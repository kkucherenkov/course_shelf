import 'package:drift/drift.dart' show Value;
import 'package:uuid/uuid.dart';

import 'package:app_mobile/features/player/domain/lesson_playback.dart';
import 'package:app_mobile/features/player/domain/lesson_player_repository.dart';
import 'package:app_mobile/shared/db/app_database.dart';
import 'package:app_mobile/shared/db/tables/outbox_op.dart';

/// Routes the player's note and bookmark **writes** through the outboxes
/// instead of straight at the wire; every **read** delegates untouched.
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
/// **Known gap, worth stating.** A bookmark created offline is handed back with
/// its client-side `localId`, because the server assigns the real id and has
/// not seen it yet. Until the next `fetchBookmarks`, the row on screen carries
/// an id the server does not know. Deleting it in that window is handled — the
/// outbox collapses create+delete and drops both, so nothing is orphaned — but
/// a refetch will briefly show the server's copy alongside the local one if the
/// drain lands between the two. Reconciling local and server ids needs an id
/// map the schema does not have; out of scope for this card.
class OutboxLessonPlayerRepository implements LessonPlayerRepository {
  OutboxLessonPlayerRepository({
    required LessonPlayerRepository inner,
    required NotesOutboxDao notes,
    required BookmarksOutboxDao bookmarks,
    void Function()? onEnqueued,
    Uuid? uuid,
  }) : _inner = inner,
       _notes = notes,
       _bookmarks = bookmarks,
       _onEnqueued = onEnqueued,
       _uuid = uuid ?? const Uuid();

  final LessonPlayerRepository _inner;
  final NotesOutboxDao _notes;
  final BookmarksOutboxDao _bookmarks;
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
  /// bookmark created offline in this session). The outbox tells them apart:
  /// enqueueing on `localId` collapses a pending create into the delete, and
  /// the drain drops `serverId == null && op == delete` without a request. A
  /// server id has no pending row to collide with, so it queues on its own.
  @override
  Future<void> deleteBookmark(String bookmarkId) async {
    final DateTime now = DateTime.now().toUtc();
    final BookmarksOutboxEntry? queued = await _bookmarks.findByLocalId(
      bookmarkId,
    );
    await _bookmarks.enqueue(
      BookmarksOutboxCompanion(
        localId: Value<String>(queued?.localId ?? bookmarkId),
        // Null when this row is collapsing a not-yet-synced create — that is
        // what makes the drain drop it instead of issuing a DELETE for an id
        // the server never assigned.
        serverId: Value<String?>(queued != null ? queued.serverId : bookmarkId),
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

  @override
  Future<List<LessonBookmark>> fetchBookmarks(String lessonId) =>
      _inner.fetchBookmarks(lessonId);

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
