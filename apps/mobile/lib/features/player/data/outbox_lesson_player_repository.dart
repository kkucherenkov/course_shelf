import 'package:drift/drift.dart' show Value;
import 'package:uuid/uuid.dart';

import 'package:app_mobile/features/player/domain/lesson_playback.dart';
import 'package:app_mobile/features/player/domain/lesson_player_repository.dart';
import 'package:app_mobile/shared/db/app_database.dart';
import 'package:app_mobile/shared/db/tables/outbox_op.dart';

/// Routes the player's note and bookmark **writes** through the outboxes
/// instead of straight at the wire, and reconciles the bookmark **read** with
/// what is still queued. Every other read delegates untouched.
///
/// Before this, `LessonPlayerApi` sent each write immediately and `PlayerBloc`
/// swallowed the error — so a note typed on a train was silently lost, and the
/// two outbox tables built for exactly this had no producer at all. The
/// progress outbox already worked this way (`ProgressOutboxRecorder`); this
/// gives notes and bookmarks the same shape.
///
/// **Writes always queue, online or not.** One code path instead of two, no
/// connectivity check on the write path, and the UI never waits on a round
/// trip. [onEnqueued] then asks the sync engine to drain, so an online write
/// still reaches the server immediately — it just goes via the queue. Passing
/// that as a callback rather than a `SyncBloc` keeps the player from depending
/// on the sync feature; the injector wires the two together.
///
/// **Offline ids are reconciled here, not in the screens.** A bookmark created
/// offline is handed back with its client-side `localId`, because the server
/// assigns the real id and has not seen it yet. The drain records
/// `localId -> serverId` in `bookmark_id_map` once the create settles, and this
/// class is the single place every read and write routes through, so the two
/// ids describe one bookmark from that moment on:
///   - [fetchBookmarks] returns the server's copy and the still-queued local
///     ones, never both copies of the same bookmark, and never a bookmark with
///     a queued delete.
///   - [deleteBookmark] resolves a `localId` to its server id before queueing,
///     so a bookmark created and then synced offline is deleted on the server
///     rather than 404ing against an id it never assigned.
class OutboxLessonPlayerRepository implements LessonPlayerRepository {
  OutboxLessonPlayerRepository({
    required LessonPlayerRepository inner,
    required NotesOutboxDao notes,
    required BookmarksOutboxDao bookmarks,
    required BookmarkIdMapDao bookmarkIds,
    void Function()? onEnqueued,
    Uuid? uuid,
  }) : _inner = inner,
       _notes = notes,
       _bookmarks = bookmarks,
       _bookmarkIds = bookmarkIds,
       _onEnqueued = onEnqueued,
       _uuid = uuid ?? const Uuid();

  final LessonPlayerRepository _inner;
  final NotesOutboxDao _notes;
  final BookmarksOutboxDao _bookmarks;
  final BookmarkIdMapDao _bookmarkIds;
  final void Function()? _onEnqueued;
  final Uuid _uuid;

  // ── writes: queued ─────────────────────────────────────────────────────────

  /// An emptied body is queued as a `delete`, not an upsert of `""` — the spec
  /// gives `UpsertNoteRequest.body` `minLength: 1` and 400s on empty, and
  /// clearing the editor means "remove the note".
  @override
  Future<void> saveNote({
    required String lessonId,
    required String body,
  }) async {
    final DateTime now = DateTime.now().toUtc();
    await _notes.enqueue(
      NotesOutboxCompanion(
        lessonId: Value<String>(lessonId),
        op: Value<OutboxOp>(
          body.trim().isEmpty ? OutboxOp.delete : OutboxOp.update,
        ),
        body: Value<String?>(body.trim().isEmpty ? null : body),
        clientUpdatedAt: Value<DateTime>(now),
        queuedAt: Value<DateTime>(now),
      ),
    );
    _onEnqueued?.call();
  }

  @override
  Future<LessonBookmark> createBookmark({
    required String lessonId,
    required Duration position,
    String? label,
  }) async {
    final DateTime now = DateTime.now().toUtc();
    // Client-generated and stable across the enqueue-time collapse. Never sent
    // to the server: the drain keys off `serverId`, which stays null until the
    // create syncs.
    final String localId = _uuid.v4();
    await _bookmarks.enqueue(
      BookmarksOutboxCompanion(
        localId: Value<String>(localId),
        serverId: const Value<String?>(null),
        lessonId: Value<String>(lessonId),
        op: const Value<OutboxOp>(OutboxOp.create),
        positionSeconds: Value<int?>(position.inSeconds),
        label: Value<String?>(label),
        clientUpdatedAt: Value<DateTime>(now),
        queuedAt: Value<DateTime>(now),
      ),
    );
    _onEnqueued?.call();
    return LessonBookmark(id: localId, position: position, label: label ?? '');
  }

  /// The id here may be a server id (from a fetch) or a `localId` (from a
  /// bookmark created offline). Three cases, and the outbox plus the id map
  /// tell them apart:
  ///   - a row is still queued for this `localId` — enqueueing on it collapses
  ///     the pending create into the delete, and the drain drops
  ///     `serverId == null && op == delete` without a request;
  ///   - nothing is queued but the id map knows this `localId` — the create
  ///     already settled, so the delete must name the id the server assigned.
  ///     Sending the `localId` instead 404s, and because a failed leg
  ///     propagates, that one row would wedge every later drain;
  ///   - neither — the id came from a fetch and is already a server id.
  @override
  Future<void> deleteBookmark(String bookmarkId) async {
    final DateTime now = DateTime.now().toUtc();
    final BookmarksOutboxEntry? queued = await _bookmarks.findByLocalId(
      bookmarkId,
    );
    final String? mapped = queued == null
        ? await _bookmarkIds.serverIdFor(bookmarkId)
        : null;
    await _bookmarks.enqueue(
      BookmarksOutboxCompanion(
        localId: Value<String>(queued?.localId ?? bookmarkId),
        // Null when this row is collapsing a not-yet-synced create — that is
        // what makes the drain drop it instead of issuing a DELETE for an id
        // the server never assigned.
        serverId: Value<String?>(
          queued != null ? queued.serverId : (mapped ?? bookmarkId),
        ),
        lessonId: Value<String>(queued?.lessonId ?? ''),
        op: const Value<OutboxOp>(OutboxOp.delete),
        positionSeconds: const Value<int?>(null),
        label: const Value<String?>(null),
        clientUpdatedAt: Value<DateTime>(now),
        queuedAt: Value<DateTime>(now),
      ),
    );
    _onEnqueued?.call();
  }

  // ── reads: straight through ────────────────────────────────────────────────

  @override
  Future<LessonPlayback> fetchLesson(String lessonId) =>
      _inner.fetchLesson(lessonId);

  @override
  Future<List<LessonOutlineSection>> fetchCourseOutline(String courseId) =>
      _inner.fetchCourseOutline(courseId);

  @override
  Future<LessonVideoSource> resolveVideoSource(String lessonId) =>
      _inner.resolveVideoSource(lessonId);

  /// The server's bookmarks for this lesson, reconciled with what is still
  /// queued for it — the one place a caller can get a bookmark list, so the one
  /// place this has to be right.
  ///
  /// Three corrections, in order:
  ///   - a queued delete hides the server's copy, so a bookmark deleted offline
  ///     does not come back on the next read;
  ///   - a queued create that has not synced is surfaced, so a bookmark added
  ///     offline survives reopening the lesson instead of vanishing;
  ///   - a queued create whose `localId` the id map has already resolved to one
  ///     of the fetched server ids is NOT surfaced. That row is the same
  ///     bookmark as the server's copy; adding it would be the duplicate. It
  ///     can outlive its own drain — the mapping is written before the row is
  ///     cleared, and the process can stop in between.
  @override
  Future<List<LessonBookmark>> fetchBookmarks(String lessonId) async {
    final List<LessonBookmark> remote = await _inner.fetchBookmarks(lessonId);
    final List<BookmarksOutboxEntry> queued = await _bookmarks.pending();
    if (queued.isEmpty) return remote;

    final Map<String, String> localByServer = await _bookmarkIds
        .localIdsByServerId(remote.map((LessonBookmark b) => b.id));
    final Set<String> alreadyOnServer = localByServer.values.toSet();

    // Deletes are matched across every queued row, not just this lesson's: a
    // delete aimed at a bookmark the client only ever saw through a fetch has
    // no lesson to record (`deleteBookmark` writes an empty one), and bookmark
    // ids are unique anyway, so a wider scan cannot hide the wrong bookmark.
    final Set<String> deleted = <String>{
      for (final BookmarksOutboxEntry row in queued)
        if (row.op == OutboxOp.delete) row.serverId ?? row.localId,
    };

    return <LessonBookmark>[
      for (final LessonBookmark bookmark in remote)
        if (!deleted.contains(bookmark.id)) bookmark,
      for (final BookmarksOutboxEntry row in queued)
        if (row.lessonId == lessonId &&
            row.op != OutboxOp.delete &&
            row.serverId == null &&
            !alreadyOnServer.contains(row.localId))
          LessonBookmark(
            id: row.localId,
            position: Duration(seconds: row.positionSeconds ?? 0),
            label: row.label ?? '',
          ),
    ]..sort(
      (LessonBookmark a, LessonBookmark b) => a.position.compareTo(b.position),
    );
  }

  @override
  Future<String?> fetchNote(String lessonId) => _inner.fetchNote(lessonId);

  @override
  Future<String> issueMaterialDownloadUrl({
    required String lessonId,
    required String materialId,
  }) => _inner.issueMaterialDownloadUrl(
    lessonId: lessonId,
    materialId: materialId,
  );
}
