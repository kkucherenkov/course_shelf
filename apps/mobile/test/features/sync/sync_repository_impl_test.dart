import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:drift/drift.dart' show Value;
import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:app_mobile/features/sync/data/sync_api.dart';
import 'package:app_mobile/features/sync/data/sync_repository_impl.dart';
import 'package:app_mobile/features/sync/domain/sync_repository.dart';
import 'package:app_mobile/shared/db/app_database.dart';
import 'package:app_mobile/shared/db/tables/outbox_op.dart';

// Relative, not `package:` — `always_use_package_imports` governs `lib/` only.
import '../../support/recording_http_adapter.dart';

/// Drives the drain through a real [SyncApi] on a real [Dio], so the assertions
/// cover the wire shape (path, verb, body) as well as the drain rules. A mocked
/// api would let a wrong path or a malformed body pass.
void main() {
  late AppDatabase db;
  late ProgressOutboxDao progress;
  late NotesOutboxDao notes;
  late BookmarksOutboxDao bookmarks;
  late BookmarkIdMapDao bookmarkIds;
  late RecordingHttpAdapter adapter;
  late SyncRepositoryImpl repository;

  /// Response per route. Defaults cover the empty cases; a test overrides it
  /// before acting when it needs a specific batch verdict.
  late String Function(RequestOptions options) respondBody;

  setUp(() {
    db = AppDatabase(NativeDatabase.memory());
    progress = ProgressOutboxDao(db);
    notes = NotesOutboxDao(db);
    bookmarks = BookmarksOutboxDao(db);
    bookmarkIds = BookmarkIdMapDao(db);

    respondBody = (RequestOptions options) => '{"id":"srv-new"}';
    adapter = RecordingHttpAdapter(
      respond: (RequestOptions options) => ResponseBody.fromString(
        respondBody(options),
        200,
        headers: <String, List<String>>{
          Headers.contentTypeHeader: <String>[Headers.jsonContentType],
        },
      ),
    );
    final Dio dio = Dio(BaseOptions(baseUrl: 'http://localhost:3000/api/v1'))
      ..httpClientAdapter = adapter;

    repository = SyncRepositoryImpl(
      api: SyncApi(dio),
      progress: progress,
      notes: notes,
      bookmarks: bookmarks,
      bookmarkIds: bookmarkIds,
    );
  });

  tearDown(() => db.close());

  Future<void> queueProgress(String lessonId, {DateTime? at}) =>
      progress.enqueue(
        ProgressOutboxCompanion(
          lessonId: Value<String>(lessonId),
          positionSeconds: const Value<int>(30),
          durationSeconds: const Value<int>(600),
          clientUpdatedAt: Value<DateTime>(at ?? DateTime.utc(2026, 8, 29, 12)),
          queuedAt: Value<DateTime>(at ?? DateTime.utc(2026, 8, 29, 12)),
        ),
      );

  String batchOf(List<String> statuses) => jsonEncode(<String, dynamic>{
    'results': statuses
        .map(
          (String s) => <String, dynamic>{
            'status': s,
            if (s != 'forbidden')
              'state': <String, dynamic>{
                'lessonId': 'l-$s',
                'positionSeconds': 900,
                'durationSeconds': 1200,
                'percent': 75,
                'completed': false,
                'lastSeenAt': '2026-08-29T10:00:00Z',
              },
          },
        )
        .toList(),
  });

  group('progress', () {
    test(
      'sends one batch and clears every row, whatever the verdict',
      () async {
        await queueProgress('a', at: DateTime.utc(2026, 8, 29, 12));
        await queueProgress('b', at: DateTime.utc(2026, 8, 29, 13));
        await queueProgress('c', at: DateTime.utc(2026, 8, 29, 14));
        respondBody = (_) =>
            batchOf(<String>['accepted', 'stale', 'forbidden']);

        final SyncOutcome outcome = await repository.drain();

        expect(adapter.requests, hasLength(1));
        expect(adapter.lastRequest.method, 'POST');
        expect(adapter.lastRequest.uri.path, '/api/v1/progress/batch');
        // accepted + stale both count as sent; only forbidden is a drop.
        expect(outcome.sent, 2);
        expect(outcome.dropped, 1);
        expect(await progress.pending(), isEmpty);
      },
    );

    test('items go out oldest first', () async {
      await queueProgress('late', at: DateTime.utc(2026, 8, 29, 15));
      await queueProgress('early', at: DateTime.utc(2026, 8, 29, 9));
      respondBody = (_) => batchOf(<String>['accepted', 'accepted']);

      await repository.drain();

      final List<dynamic> items =
          (adapter.lastRequest.data as Map<String, dynamic>)['items']
              as List<dynamic>;
      expect(
        items.map((dynamic i) => (i as Map<String, dynamic>)['lessonId']),
        <String>['early', 'late'],
      );
    });

    test('a stale verdict surfaces the server state', () async {
      await queueProgress('a');
      respondBody = (_) => batchOf(<String>['stale']);

      final SyncOutcome outcome = await repository.drain();

      expect(outcome.staleProgress, hasLength(1));
      expect(outcome.staleProgress.single.lessonId, 'l-stale');
      expect(outcome.staleProgress.single.positionSeconds, 900);
      expect(outcome.staleProgress.single.percent, 75);
    });

    test('a result list of the wrong length still clears the queue', () async {
      // The spec guarantees same length and order. If a server breaks that,
      // pairing by index would attribute one lesson's verdict to another —
      // every verdict is terminal anyway, so clear and claim nothing.
      await queueProgress('a');
      await queueProgress('b', at: DateTime.utc(2026, 8, 29, 13));
      respondBody = (_) => batchOf(<String>['accepted']);

      final SyncOutcome outcome = await repository.drain();

      expect(await progress.pending(), isEmpty);
      expect(outcome.sent, 2);
      expect(outcome.staleProgress, isEmpty);
    });

    test('nothing queued means no request at all', () async {
      final SyncOutcome outcome = await repository.drain();

      expect(adapter.requests, isEmpty);
      expect(outcome.isEmpty, isTrue);
    });
  });

  group('notes', () {
    test('an update row is a PUT carrying lessonId and body', () async {
      await notes.enqueue(
        NotesOutboxCompanion(
          lessonId: const Value<String>('l1'),
          op: const Value<OutboxOp>(OutboxOp.update),
          body: const Value<String?>('hello'),
          clientUpdatedAt: Value<DateTime>(DateTime.utc(2026, 8, 29)),
          queuedAt: Value<DateTime>(DateTime.utc(2026, 8, 29)),
        ),
      );

      await repository.drain();

      expect(adapter.lastRequest.method, 'PUT');
      expect(adapter.lastRequest.uri.path, '/api/v1/notes');
      expect(adapter.lastRequest.data, <String, dynamic>{
        'lessonId': 'l1',
        'body': 'hello',
      });
      expect(await notes.pending(), isEmpty);
    });

    test('a delete row is a DELETE on the lesson', () async {
      await notes.enqueue(
        NotesOutboxCompanion(
          lessonId: const Value<String>('l1'),
          op: const Value<OutboxOp>(OutboxOp.delete),
          body: const Value<String?>(null),
          clientUpdatedAt: Value<DateTime>(DateTime.utc(2026, 8, 29)),
          queuedAt: Value<DateTime>(DateTime.utc(2026, 8, 29)),
        ),
      );

      await repository.drain();

      expect(adapter.lastRequest.method, 'DELETE');
      expect(adapter.lastRequest.uri.path, '/api/v1/notes/l1');
    });

    test('an emptied body becomes a DELETE, never a PUT of ""', () async {
      // `UpsertNoteRequest.body` is minLength: 1 — a PUT of "" is a 400, and
      // an emptied editor means the note was cleared.
      await notes.enqueue(
        NotesOutboxCompanion(
          lessonId: const Value<String>('l1'),
          op: const Value<OutboxOp>(OutboxOp.update),
          body: const Value<String?>(''),
          clientUpdatedAt: Value<DateTime>(DateTime.utc(2026, 8, 29)),
          queuedAt: Value<DateTime>(DateTime.utc(2026, 8, 29)),
        ),
      );

      await repository.drain();

      expect(adapter.lastRequest.method, 'DELETE');
      expect(adapter.lastRequest.uri.path, '/api/v1/notes/l1');
    });
  });

  group('bookmarks — the drain keys off serverId, not op', () {
    Future<void> queueBookmark({
      required String localId,
      String? serverId,
      required OutboxOp op,
      int? positionSeconds = 42,
      String? label,
      DateTime? at,
    }) => bookmarks.enqueue(
      BookmarksOutboxCompanion(
        localId: Value<String>(localId),
        serverId: Value<String?>(serverId),
        lessonId: const Value<String>('l1'),
        op: Value<OutboxOp>(op),
        positionSeconds: Value<int?>(positionSeconds),
        label: Value<String?>(label),
        clientUpdatedAt: Value<DateTime>(at ?? DateTime.utc(2026, 8, 29)),
        queuedAt: Value<DateTime>(at ?? DateTime.utc(2026, 8, 29)),
      ),
    );

    test('null serverId POSTs, even when op says update', () async {
      // Enqueue collapses create+update into one `update` row with a null
      // serverId. It still needs a POST — this is the rule the table's own
      // doc comment spells out.
      await queueBookmark(
        localId: 'loc-1',
        op: OutboxOp.update,
        label: 'chapter two',
      );

      final SyncOutcome outcome = await repository.drain();

      expect(adapter.lastRequest.method, 'POST');
      expect(adapter.lastRequest.uri.path, '/api/v1/lessons/l1/bookmarks');
      expect(adapter.lastRequest.data, <String, dynamic>{
        'positionSeconds': 42,
        'label': 'chapter two',
      });
      expect(outcome.sent, 1);
      expect(await bookmarks.pending(), isEmpty);
    });

    test('an empty label is omitted, not sent as ""', () async {
      // `CreateBookmarkRequest.label` is minLength: 1.
      await queueBookmark(localId: 'loc-1', op: OutboxOp.create, label: '');

      await repository.drain();

      expect(
        (adapter.lastRequest.data as Map<String, dynamic>).containsKey('label'),
        isFalse,
      );
    });

    test('null serverId + delete drops the row without a request', () async {
      // Created and deleted while offline: the server never saw it.
      await queueBookmark(localId: 'loc-1', op: OutboxOp.delete);

      final SyncOutcome outcome = await repository.drain();

      expect(adapter.requests, isEmpty);
      expect(outcome.dropped, 1);
      expect(outcome.sent, 0);
      expect(await bookmarks.pending(), isEmpty);
    });

    test('a server id + delete issues DELETE by that id', () async {
      await queueBookmark(
        localId: 'loc-1',
        serverId: 'srv-9',
        op: OutboxOp.delete,
      );

      await repository.drain();

      expect(adapter.lastRequest.method, 'DELETE');
      expect(adapter.lastRequest.uri.path, '/api/v1/bookmarks/srv-9');
    });

    test(
      'a server id + update PATCHes, clearing a null label explicitly',
      () async {
        // The spec says an explicit null clears the label, and rejects an empty
        // patch with 400 — so positionSeconds always rides along.
        await queueBookmark(
          localId: 'loc-1',
          serverId: 'srv-9',
          op: OutboxOp.update,
          positionSeconds: 77,
        );

        await repository.drain();

        expect(adapter.lastRequest.method, 'PATCH');
        expect(adapter.lastRequest.uri.path, '/api/v1/bookmarks/srv-9');
        expect(adapter.lastRequest.data, <String, dynamic>{
          'positionSeconds': 77,
          'label': null,
        });
      },
    );

    test('rows go out oldest first', () async {
      await queueBookmark(
        localId: 'late',
        serverId: 'srv-late',
        op: OutboxOp.delete,
        at: DateTime.utc(2026, 8, 29, 15),
      );
      await queueBookmark(
        localId: 'early',
        serverId: 'srv-early',
        op: OutboxOp.delete,
        at: DateTime.utc(2026, 8, 29, 9),
      );

      await repository.drain();

      expect(adapter.requests.map((RequestOptions r) => r.uri.path), <String>[
        '/api/v1/bookmarks/srv-early',
        '/api/v1/bookmarks/srv-late',
      ]);
    });
  });

  group('across outboxes', () {
    test('pendingCount sums all three', () async {
      await queueProgress('a');
      await notes.enqueue(
        NotesOutboxCompanion(
          lessonId: const Value<String>('l1'),
          op: const Value<OutboxOp>(OutboxOp.delete),
          clientUpdatedAt: Value<DateTime>(DateTime.utc(2026, 8, 29)),
          queuedAt: Value<DateTime>(DateTime.utc(2026, 8, 29)),
        ),
      );
      await bookmarks.enqueue(
        BookmarksOutboxCompanion(
          localId: const Value<String>('loc-1'),
          serverId: const Value<String?>('srv-1'),
          lessonId: const Value<String>('l1'),
          op: const Value<OutboxOp>(OutboxOp.delete),
          clientUpdatedAt: Value<DateTime>(DateTime.utc(2026, 8, 29)),
          queuedAt: Value<DateTime>(DateTime.utc(2026, 8, 29)),
        ),
      );

      expect(await repository.pendingCount(), 3);
    });

    test('a failure part-way leaves the unsent rows queued', () async {
      // Progress drains first and succeeds; the note leg then 500s. What
      // already cleared stays cleared, what did not stays queued — every
      // endpoint here is idempotent or last-write-wins, so a retry is safe.
      await queueProgress('a');
      await notes.enqueue(
        NotesOutboxCompanion(
          lessonId: const Value<String>('l1'),
          op: const Value<OutboxOp>(OutboxOp.update),
          body: const Value<String?>('body'),
          clientUpdatedAt: Value<DateTime>(DateTime.utc(2026, 8, 29)),
          queuedAt: Value<DateTime>(DateTime.utc(2026, 8, 29)),
        ),
      );
      adapter = RecordingHttpAdapter(
        respond: (RequestOptions options) {
          if (options.path.startsWith('/notes')) {
            return ResponseBody.fromString('{}', 500);
          }
          return ResponseBody.fromString(
            batchOf(<String>['accepted']),
            200,
            headers: <String, List<String>>{
              Headers.contentTypeHeader: <String>[Headers.jsonContentType],
            },
          );
        },
      );
      repository = SyncRepositoryImpl(
        api: SyncApi(
          Dio(BaseOptions(baseUrl: 'http://localhost:3000/api/v1'))
            ..httpClientAdapter = adapter,
        ),
        progress: progress,
        notes: notes,
        bookmarks: bookmarks,
        bookmarkIds: bookmarkIds,
      );

      await expectLater(repository.drain(), throwsA(isA<DioException>()));

      expect(await progress.pending(), isEmpty, reason: 'progress leg landed');
      expect(await notes.pending(), hasLength(1), reason: 'note leg did not');
    });
  });
}
