import 'package:app_mobile/features/sync/data/sync_api.dart';
import 'package:app_mobile/features/sync/domain/sync_repository.dart';
import 'package:app_mobile/shared/db/app_database.dart';
import 'package:app_mobile/shared/db/tables/outbox_op.dart';

/// Drains `progress_outbox`, `notes_outbox` and `bookmarks_outbox` into the API.
///
/// **Ordering.** Each outbox is drained oldest-first on `queuedAt` (the DAOs
/// already `ORDER BY` it, and normalise every write to UTC so that ordering is
/// chronological rather than lexicographic). The three outboxes are drained in
/// sequence, not interleaved: they address disjoint resources — a lesson's
/// progress, its note, its bookmarks — so no ordering between them is
/// observable server-side, and one round-trip per outbox beats one per row.
///
/// **Failure.** Progress goes first because it is the only batched call and the
/// only one that is certain to have rows. If a leg throws, the exception
/// propagates: everything already cleared stays cleared, everything not yet
/// sent stays queued, and the next trigger resumes. Nothing is lost either way,
/// because every endpoint here is idempotent or last-write-wins.
class SyncRepositoryImpl implements SyncRepository {
  const SyncRepositoryImpl({
    required SyncApi api,
    required ProgressOutboxDao progress,
    required NotesOutboxDao notes,
    required BookmarksOutboxDao bookmarks,
  }) : _api = api,
       _progress = progress,
       _notes = notes,
       _bookmarks = bookmarks;

  final SyncApi _api;
  final ProgressOutboxDao _progress;
  final NotesOutboxDao _notes;
  final BookmarksOutboxDao _bookmarks;

  @override
  Future<int> pendingCount() async {
    final List<ProgressOutboxEntry> p = await _progress.pending();
    final List<NotesOutboxEntry> n = await _notes.pending();
    final List<BookmarksOutboxEntry> b = await _bookmarks.pending();
    return p.length + n.length + b.length;
  }

  @override
  Future<SyncOutcome> drain() async {
    final _Tally tally = _Tally();

    await _drainProgress(tally);
    await _drainNotes(tally);
    await _drainBookmarks(tally);

    return SyncOutcome(
      sent: tally.sent,
      dropped: tally.dropped,
      remaining: await pendingCount(),
      staleProgress: tally.stale,
    );
  }

  // ── progress ───────────────────────────────────────────────────────────────

  /// One `POST /progress/batch` for up to 200 rows.
  ///
  /// Every verdict is terminal, so every row in the batch is cleared:
  ///   - `accepted` — applied (or absorbed by last-write-wins).
  ///   - `stale`    — absorbed; the server already had newer state, which is
  ///                  surfaced on the outcome rather than retried.
  ///   - `forbidden` — no READ grant, or the lesson is gone. Retrying would
  ///                  wedge the queue behind a row that can never succeed.
  ///
  /// Rows beyond the 200 cap stay queued and are reported through
  /// [SyncOutcome.remaining]; the next trigger takes the next page.
  Future<void> _drainProgress(_Tally tally) async {
    final List<ProgressOutboxEntry> rows = await _progress.pending();
    if (rows.isEmpty) return;

    final List<BatchItemResult> results = await _api.sendProgressBatch(
      rows
          .map(
            (ProgressOutboxEntry r) => <String, dynamic>{
              'lessonId': r.lessonId,
              'positionSeconds': r.positionSeconds,
              'durationSeconds': r.durationSeconds,
              'clientUpdatedAt': r.clientUpdatedAt.toUtc().toIso8601String(),
            },
          )
          .toList(),
    );

    // The spec guarantees same length and order. If a server ever breaks that,
    // pairing by index would attribute one lesson's verdict to another — so
    // fall back to clearing everything (all verdicts are terminal anyway) and
    // claim nothing about which was stale.
    if (results.length != rows.length) {
      await _progress.clear(
        rows.map((ProgressOutboxEntry r) => r.lessonId).toList(),
      );
      tally.sent += rows.length;
      return;
    }

    for (int i = 0; i < rows.length; i++) {
      final BatchItemResult result = results[i];
      switch (result.status) {
        case BatchItemStatus.accepted:
          tally.sent++;
        case BatchItemStatus.stale:
          tally.sent++;
          final StaleProgress? parsed = _staleFrom(result.state);
          if (parsed != null) tally.stale.add(parsed);
        case BatchItemStatus.forbidden:
          tally.dropped++;
      }
    }

    await _progress.clear(
      rows.map((ProgressOutboxEntry r) => r.lessonId).toList(),
    );
  }

  static StaleProgress? _staleFrom(Map<String, dynamic>? state) {
    if (state == null) return null;
    final String? lessonId = state['lessonId'] as String?;
    if (lessonId == null) return null;
    return StaleProgress(
      lessonId: lessonId,
      positionSeconds: (state['positionSeconds'] as num?)?.toInt() ?? 0,
      durationSeconds: (state['durationSeconds'] as num?)?.toInt() ?? 0,
      percent: (state['percent'] as num?)?.toDouble() ?? 0,
      completed: state['completed'] as bool? ?? false,
    );
  }

  // ── notes ──────────────────────────────────────────────────────────────────

  /// One call per queued lesson. `PUT /notes` and `DELETE /notes/{lessonId}`
  /// are both idempotent, and the outbox already coalesced to one row per
  /// lesson, so there is nothing to batch.
  ///
  /// An `update` row whose body is null or empty is sent as a DELETE: the spec
  /// gives `UpsertNoteRequest.body` `minLength: 1` and rejects an empty one, and
  /// "the user cleared the note" is what an emptied body means.
  Future<void> _drainNotes(_Tally tally) async {
    for (final NotesOutboxEntry row in await _notes.pending()) {
      final String body = row.body ?? '';
      if (row.op == OutboxOp.delete || body.isEmpty) {
        await _api.deleteNote(row.lessonId);
      } else {
        await _api.upsertNote(lessonId: row.lessonId, body: body);
      }
      await _notes.clear(<String>[row.lessonId]);
      tally.sent++;
    }
  }

  // ── bookmarks ──────────────────────────────────────────────────────────────

  /// One call per queued bookmark, keyed off `serverId` rather than `op` —
  /// the rule `BookmarksOutboxDao` documents.
  ///
  /// Enqueue collapses create+update into a single `update` row with a null
  /// `serverId`, so `op` alone cannot tell you whether the server has ever seen
  /// this bookmark. `serverId` can:
  ///   - null + delete  → drop. Created and deleted while offline; the server
  ///                      never saw it, so there is nothing to send.
  ///   - null           → POST, whatever `op` says.
  ///   - non-null       → PATCH or DELETE by that id, per `op`.
  ///
  /// A created bookmark's new server id is not written back: the row is cleared
  /// on success, so nothing is left to carry it. A later edit of that bookmark
  /// enqueues against the id the player refetched.
  Future<void> _drainBookmarks(_Tally tally) async {
    for (final BookmarksOutboxEntry row in await _bookmarks.pending()) {
      final String? serverId = row.serverId;

      if (serverId == null && row.op == OutboxOp.delete) {
        await _bookmarks.clear(<String>[row.localId]);
        tally.dropped++;
        continue;
      }

      if (serverId == null) {
        await _api.createBookmark(
          lessonId: row.lessonId,
          positionSeconds: row.positionSeconds ?? 0,
          label: row.label,
        );
      } else if (row.op == OutboxOp.delete) {
        await _api.deleteBookmark(serverId);
      } else {
        await _api.updateBookmark(
          id: serverId,
          positionSeconds: row.positionSeconds ?? 0,
          label: row.label,
        );
      }

      await _bookmarks.clear(<String>[row.localId]);
      tally.sent++;
    }
  }
}

/// Mutable running totals for one drain pass. Private to this file — the
/// outcome the caller sees is the immutable [SyncOutcome].
class _Tally {
  int sent = 0;
  int dropped = 0;
  final List<StaleProgress> stale = <StaleProgress>[];
}
