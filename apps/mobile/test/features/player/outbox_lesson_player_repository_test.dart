import 'package:drift/drift.dart' show Value;
import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:app_mobile/features/player/data/outbox_lesson_player_repository.dart';
import 'package:app_mobile/features/player/domain/lesson_playback.dart';
import 'package:app_mobile/features/player/domain/lesson_player_repository.dart';
import 'package:app_mobile/shared/db/app_database.dart';
import 'package:app_mobile/shared/db/tables/outbox_op.dart';

/// Every read delegates; every write must not. Throwing on the write methods
/// is the assertion: if the decorator ever forwards one, the test fails loudly
/// rather than silently sending a note over the wire.
class _ThrowingInner implements LessonPlayerRepository {
  int fetchNoteCalls = 0;
  int fetchBookmarksCalls = 0;

  @override
  Future<String?> fetchNote(String lessonId) async {
    fetchNoteCalls++;
    return 'from server';
  }

  @override
  Future<List<LessonBookmark>> fetchBookmarks(String lessonId) async {
    fetchBookmarksCalls++;
    return const <LessonBookmark>[];
  }

  @override
  Future<void> saveNote({required String lessonId, required String body}) =>
      throw StateError('writes must not reach the wire');

  @override
  Future<LessonBookmark> createBookmark({
    required String lessonId,
    required Duration position,
    String? label,
  }) => throw StateError('writes must not reach the wire');

  @override
  Future<void> deleteBookmark(String bookmarkId) =>
      throw StateError('writes must not reach the wire');

  @override
  Future<LessonPlayback> fetchLesson(String lessonId) =>
      throw UnimplementedError();

  @override
  Future<List<LessonOutlineSection>> fetchCourseOutline(String courseId) =>
      throw UnimplementedError();

  @override
  Future<LessonVideoSource> resolveVideoSource(String lessonId) =>
      throw UnimplementedError();

  @override
  Future<String> issueMaterialDownloadUrl({
    required String lessonId,
    required String materialId,
  }) => throw UnimplementedError();
}

void main() {
  late AppDatabase db;
  late NotesOutboxDao notes;
  late BookmarksOutboxDao bookmarks;
  late BookmarkIdMapDao bookmarkIds;
  late _ThrowingInner inner;
  late OutboxLessonPlayerRepository repository;
  late int nudges;

  setUp(() {
    db = AppDatabase(NativeDatabase.memory());
    notes = NotesOutboxDao(db);
    bookmarks = BookmarksOutboxDao(db);
    bookmarkIds = BookmarkIdMapDao(db);
    inner = _ThrowingInner();
    nudges = 0;
    repository = OutboxLessonPlayerRepository(
      inner: inner,
      notes: notes,
      bookmarks: bookmarks,
      bookmarkIds: bookmarkIds,
      onEnqueued: () => nudges++,
    );
  });

  tearDown(() => db.close());

  group('notes', () {
    test('a save queues an update and nudges the sync engine', () async {
      await repository.saveNote(lessonId: 'l1', body: 'hello');

      final List<NotesOutboxEntry> queued = await notes.pending();
      expect(queued, hasLength(1));
      expect(queued.single.lessonId, 'l1');
      expect(queued.single.op, OutboxOp.update);
      expect(queued.single.body, 'hello');
      // An online write still reaches the server immediately — it just goes
      // via the queue.
      expect(nudges, 1);
    });

    test('clearing the editor queues a delete, not an empty body', () async {
      // `UpsertNoteRequest.body` is minLength: 1, so "" is a 400 — and an
      // emptied editor means the note was removed.
      await repository.saveNote(lessonId: 'l1', body: '   ');

      final NotesOutboxEntry queued = (await notes.pending()).single;
      expect(queued.op, OutboxOp.delete);
      expect(queued.body, isNull);
    });

    test('two saves on one lesson coalesce to the newest', () async {
      await repository.saveNote(lessonId: 'l1', body: 'first');
      await repository.saveNote(lessonId: 'l1', body: 'second');

      final List<NotesOutboxEntry> queued = await notes.pending();
      expect(queued, hasLength(1));
      expect(queued.single.body, 'second');
    });
  });

  group('bookmarks', () {
    test(
      'a create queues with a null serverId and returns the localId',
      () async {
        final LessonBookmark created = await repository.createBookmark(
          lessonId: 'l1',
          position: const Duration(seconds: 42),
          label: 'here',
        );

        final BookmarksOutboxEntry queued = (await bookmarks.pending()).single;
        expect(
          queued.serverId,
          isNull,
          reason: 'the server has not seen it yet',
        );
        expect(queued.op, OutboxOp.create);
        expect(queued.positionSeconds, 42);
        expect(queued.label, 'here');
        // The id handed back is the client's own, so a delete in this window
        // still finds the queued row.
        expect(created.id, queued.localId);
        expect(created.position, const Duration(seconds: 42));
        expect(nudges, 1);
      },
    );

    test(
      'deleting a not-yet-synced create collapses to a droppable row',
      () async {
        final LessonBookmark created = await repository.createBookmark(
          lessonId: 'l1',
          position: const Duration(seconds: 42),
        );

        await repository.deleteBookmark(created.id);

        final BookmarksOutboxEntry queued = (await bookmarks.pending()).single;
        expect(queued.op, OutboxOp.delete);
        // Null serverId + delete is the drain's "drop it, the server never saw
        // this bookmark" rule — no DELETE is issued for an id that was never
        // assigned.
        expect(queued.serverId, isNull);
      },
    );

    test('deleting a server-known bookmark queues its server id', () async {
      await repository.deleteBookmark('srv-9');

      final BookmarksOutboxEntry queued = (await bookmarks.pending()).single;
      expect(queued.op, OutboxOp.delete);
      expect(queued.serverId, 'srv-9');
    });

    test('a delete keeps the lessonId of the row it collapses', () async {
      // The delete path has no lessonId of its own — it must take it from the
      // queued row, or the drain would POST-then-DELETE against ''.
      final LessonBookmark created = await repository.createBookmark(
        lessonId: 'lesson-abc',
        position: Duration.zero,
      );

      await repository.deleteBookmark(created.id);

      expect((await bookmarks.pending()).single.lessonId, 'lesson-abc');
    });

    test('two creates on one lesson stay two rows', () async {
      await repository.createBookmark(lessonId: 'l1', position: Duration.zero);
      await repository.createBookmark(
        lessonId: 'l1',
        position: const Duration(seconds: 10),
      );

      // Coalescing is per bookmark (localId), not per lesson.
      expect(await bookmarks.pending(), hasLength(2));
    });
  });

  group('reads', () {
    test('delegate to the inner repository when nothing is queued', () async {
      // `fetchBookmarks` reconciles against the outbox, but an empty outbox has
      // nothing to reconcile — the server's answer passes straight through.
      // The reconciliation itself is covered in
      // test/features/sync/offline_bookmark_reconciliation_test.dart.
      expect(await repository.fetchNote('l1'), 'from server');
      expect(await repository.fetchBookmarks('l1'), isEmpty);

      expect(inner.fetchNoteCalls, 1);
      expect(inner.fetchBookmarksCalls, 1);
      expect(nudges, 0, reason: 'a read is not a write');
    });
  });

  test(
    'an existing queued row is not lost when the sync nudge is absent',
    () async {
      // `onEnqueued` is optional — a caller without a sync engine (a test, a
      // background isolate) must still queue correctly.
      final OutboxLessonPlayerRepository bare = OutboxLessonPlayerRepository(
        inner: inner,
        notes: notes,
        bookmarks: bookmarks,
        bookmarkIds: bookmarkIds,
      );

      await bare.saveNote(lessonId: 'l1', body: 'body');

      expect(await notes.pending(), hasLength(1));
    },
  );

  test(
    'queued writes are stored in UTC so the drain order is chronological',
    () async {
      await repository.saveNote(lessonId: 'l1', body: 'body');

      final NotesOutboxEntry queued = (await notes.pending()).single;
      expect(queued.queuedAt.isUtc, isTrue);
      expect(queued.clientUpdatedAt.isUtc, isTrue);
    },
  );

  test('a bookmark localId is unique per create', () async {
    final LessonBookmark a = await repository.createBookmark(
      lessonId: 'l1',
      position: Duration.zero,
    );
    final LessonBookmark b = await repository.createBookmark(
      lessonId: 'l1',
      position: Duration.zero,
    );

    expect(a.id, isNot(b.id));
  });

  test('a delete for an unknown id does not invent a lessonId row', () async {
    await bookmarks.enqueue(
      BookmarksOutboxCompanion(
        localId: const Value<String>('srv-9'),
        serverId: const Value<String?>('srv-9'),
        lessonId: const Value<String>('l1'),
        op: const Value<OutboxOp>(OutboxOp.update),
        positionSeconds: const Value<int?>(5),
        clientUpdatedAt: Value<DateTime>(DateTime.utc(2026, 8, 29)),
        queuedAt: Value<DateTime>(DateTime.utc(2026, 8, 29)),
      ),
    );

    await repository.deleteBookmark('srv-9');

    final BookmarksOutboxEntry queued = (await bookmarks.pending()).single;
    expect(queued.op, OutboxOp.delete);
    expect(queued.serverId, 'srv-9');
    expect(queued.lessonId, 'l1', reason: 'taken from the row it collapsed');
  });
}
