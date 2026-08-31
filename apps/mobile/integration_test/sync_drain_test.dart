import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:dio/dio.dart';
import 'package:drift/drift.dart' show Value;
import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';

import 'package:app_mobile/features/sync/data/sync_api.dart';
import 'package:app_mobile/features/sync/data/sync_repository_impl.dart';
import 'package:app_mobile/features/sync/domain/sync_repository.dart';
import 'package:app_mobile/shared/db/app_database.dart';
import 'package:app_mobile/shared/db/tables/outbox_op.dart';

/// The outbox drain over the device's own SQLite and a real socket.
///
/// The unit suite drives `SyncRepositoryImpl` against a mocked `SyncApi` and an
/// in-process drift database on the host VM. Two things only a device settles:
/// that drift's bundled SQLite writes and orders the three outboxes the same
/// way there as it does under the desktop engine, and that a real Dio round
/// trip through `SyncApi` produces the request bodies the drain believes it is
/// sending. Both are smoke-level on purpose — the drain's *rules* are unit
/// tests' job.
void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  late AppDatabase db;
  late HttpServer server;
  late SyncRepositoryImpl repository;
  late List<String> seen;
  late List<Map<String, dynamic>> bodies;

  Future<void> serve(HttpRequest request) async {
    seen.add('${request.method} ${request.uri.path}');
    final String raw = await utf8.decoder.bind(request).join();
    if (raw.isNotEmpty) {
      bodies.add(jsonDecode(raw) as Map<String, dynamic>);
    }

    final HttpResponse response = request.response;
    response.headers.contentType = ContentType.json;

    if (request.uri.path.endsWith('/progress/batch')) {
      final List<dynamic> items =
          (jsonDecode(raw) as Map<String, dynamic>)['items'] as List<dynamic>;
      response.write(
        jsonEncode(<String, dynamic>{
          'results': <Map<String, dynamic>>[
            for (final dynamic _ in items)
              <String, dynamic>{'status': 'accepted'},
          ],
        }),
      );
    } else if (request.uri.path.endsWith('/bookmarks') &&
        request.method == 'POST') {
      response.write(jsonEncode(<String, dynamic>{'id': 'server-bm-1'}));
    } else {
      response.write('{}');
    }
    await response.close();
  }

  setUp(() async {
    seen = <String>[];
    bodies = <Map<String, dynamic>>[];

    db = AppDatabase(NativeDatabase.memory());
    server = await HttpServer.bind(InternetAddress.loopbackIPv4, 0);
    unawaited(server.forEach(serve));

    repository = SyncRepositoryImpl(
      api: SyncApi(
        Dio(
          BaseOptions(
            baseUrl: 'http://127.0.0.1:${server.port}/api/v1',
            connectTimeout: const Duration(seconds: 10),
            receiveTimeout: const Duration(seconds: 10),
          ),
        ),
      ),
      progress: ProgressOutboxDao(db),
      notes: NotesOutboxDao(db),
      bookmarks: BookmarksOutboxDao(db),
      bookmarkIds: BookmarkIdMapDao(db),
    );
  });

  tearDown(() async {
    await server.close(force: true);
    await db.close();
  });

  test('one pass drains all three outboxes and empties the queue', () async {
    final DateTime now = DateTime.now().toUtc();

    await ProgressOutboxDao(db).enqueue(
      ProgressOutboxCompanion.insert(
        lessonId: 'lesson-1',
        positionSeconds: 42,
        durationSeconds: 600,
        clientUpdatedAt: now,
        queuedAt: now,
      ),
    );
    await NotesOutboxDao(db).enqueue(
      NotesOutboxCompanion.insert(
        lessonId: 'lesson-1',
        op: OutboxOp.update,
        body: const Value<String?>('written on a train'),
        clientUpdatedAt: now,
        queuedAt: now,
      ),
    );
    await BookmarksOutboxDao(db).enqueue(
      BookmarksOutboxCompanion.insert(
        localId: 'local-bm-1',
        lessonId: 'lesson-1',
        op: OutboxOp.create,
        positionSeconds: const Value<int?>(90),
        clientUpdatedAt: now,
        queuedAt: now,
      ),
    );

    expect(await repository.pendingCount(), 3);

    final SyncOutcome outcome = await repository.drain();

    expect(outcome.sent, 3);
    expect(outcome.dropped, 0);
    expect(outcome.remaining, 0);
    expect(await repository.pendingCount(), 0);

    expect(seen, contains('POST /api/v1/progress/batch'));
    expect(seen, contains('PUT /api/v1/notes'));
    expect(seen, contains('POST /api/v1/lessons/lesson-1/bookmarks'));

    // The server's id must be recorded against the local one, or the next
    // delete aims at an id the server never assigned and wedges the queue.
    expect(await BookmarkIdMapDao(db).serverIdFor('local-bm-1'), 'server-bm-1');
  });
}
