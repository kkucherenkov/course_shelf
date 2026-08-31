import 'dart:async';
import 'dart:io';
import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:drift/drift.dart' show Value;
import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:path_provider/path_provider.dart';

import 'package:app_mobile/features/downloads/data/chunked_gcm_writer.dart';
import 'package:app_mobile/features/downloads/data/loopback_decrypt_server.dart';
import 'package:app_mobile/features/downloads/data/secure_download_key_store.dart';
import 'package:app_mobile/features/player/data/lesson_player_api.dart';
import 'package:app_mobile/features/player/data/video_player_adapter.dart';
import 'package:app_mobile/features/player/domain/lesson_playback.dart';
import 'package:app_mobile/features/player/domain/video_playback_port.dart';
import 'package:app_mobile/shared/db/app_database.dart';
import 'package:app_mobile/shared/db/tables/downloaded_lessons.dart';

import 'support/tiny_mp4.dart';

/// E19-F01-S02, on a real device — the half `flutter test` structurally cannot
/// reach.
///
/// `test/features/player/lesson_player_offline_source_test.dart` already proves
/// the *resolution* rules (intact / truncated / deleted / unknown total) on the
/// host VM. What it cannot prove is that the resolved URL plays: `video_player`
/// has no implementation under `flutter test`, `flutter_secure_storage` has no
/// Keystore, and `path_provider` has no directory. Everything below runs
/// against the real ones.
///
/// Written as plain `test()` rather than `testWidgets()` deliberately: these
/// assert on wall-clock playback progress and real socket round-trips, neither
/// of which survives a `WidgetTester`'s clock.
void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  const String lessonId = 'l1';

  late AppDatabase db;
  late DownloadsDao dao;
  late Directory dir;
  late File container;
  late Uint8List key;
  late LoopbackDecryptServer loopback;
  late LessonPlayerApi api;
  late HttpServer origin;
  late Uint8List plaintext;

  setUp(() async {
    plaintext = tinyMp4Bytes();

    // Real Keystore-backed key, real app directory, real SQLite (drift_flutter
    // ships `sqlite3_flutter_libs`, so `NativeDatabase` here is the device's
    // bundled engine — in-memory only so no test leaves a database behind).
    key = await SecureDownloadKeyStore().keyForDevice();
    db = AppDatabase(NativeDatabase.memory());
    dao = DownloadsDao(db);

    final Directory support = await getApplicationSupportDirectory();
    dir = await Directory(
      '${support.path}/integration_test/offline_playback',
    ).create(recursive: true);
    container = File('${dir.path}/$lessonId.csdl');

    // The same writer the download queue uses — so the bytes the player reads
    // back are sealed by production code, not by the test.
    final ChunkedGcmWriter writer = await ChunkedGcmWriter.create(
      file: container,
      key: key,
    );
    await writer.add(plaintext);
    final int total = await writer.finish();
    await writer.close();
    expect(total, plaintext.length);

    await dao.upsert(
      DownloadedLessonsCompanion.insert(
        lessonId: lessonId,
        state: DownloadState.ready,
        filePath: container.path,
        updatedAt: DateTime.now().toUtc(),
        totalBytes: Value<int?>(plaintext.length),
      ),
    );

    // Stands in for the backend purely so the *network* fallback has somewhere
    // to point. The offline path never reaches it.
    origin = await HttpServer.bind(InternetAddress.loopbackIPv4, 0);
    unawaited(
      origin.forEach((HttpRequest request) async {
        request.response.headers.contentType = ContentType.json;
        request.response.write('{"url":"/api/v1/stream/lessons/$lessonId"}');
        await request.response.close();
      }),
    );

    loopback = LoopbackDecryptServer(
      resolveFile: (String id) async {
        final DownloadedLesson? row = await dao.byLessonId(id);
        return row == null ? null : File(row.filePath);
      },
      key: () async => key,
    );

    api = LessonPlayerApi(
      dio: Dio(
        BaseOptions(
          baseUrl: 'http://127.0.0.1:${origin.port}/api/v1',
          // A hung socket must fail the test, not hang the emulator job until
          // its `timeout-minutes` kills it with no useful output.
          connectTimeout: const Duration(seconds: 10),
          receiveTimeout: const Duration(seconds: 10),
        ),
      ),
      downloadsDao: dao,
      loopback: loopback,
    );
  });

  tearDown(() async {
    await loopback.stop();
    await origin.close(force: true);
    await db.close();
    if (dir.existsSync()) await dir.delete(recursive: true);
  });

  /// Polls until [predicate] holds. Real playback advances on the platform's
  /// own clock, so there is nothing to pump and nothing to await — only a
  /// deadline, which is what turns "never started" into a failure instead of a
  /// hang.
  Future<void> waitFor(
    bool Function() predicate, {
    Duration timeout = const Duration(seconds: 20),
    required String describe,
  }) async {
    final DateTime deadline = DateTime.now().add(timeout);
    while (!predicate()) {
      if (DateTime.now().isAfter(deadline)) {
        fail('Timed out waiting: $describe');
      }
      await Future<void>.delayed(const Duration(milliseconds: 100));
    }
  }

  // `package:test`'s default is 30s per test, which an emulator's software
  // H.264 decoder can spend just getting to the first frame — and blowing it
  // reports as an opaque framework timeout rather than as the assertion that
  // was waiting. The two decoder tests carry their own budget; the deadlines
  // *inside* them are what actually fail a stall.
  const Timeout decoderBudget = Timeout(Duration(minutes: 3));

  test(
    'a downloaded lesson plays from the loopback decrypt URL',
    timeout: decoderBudget,
    () async {
      final LessonVideoSource source = await api.resolveVideoSource(lessonId);
      expect(source.kind, LessonVideoSourceKind.localFile);
      expect(source.isOffline, isTrue);

      final VideoPlayerAdapter adapter = VideoPlayerAdapter();
      addTearDown(adapter.dispose);

      // ExoPlayer ranges the container in over loopback; every byte it decodes
      // was decrypted a block at a time by `ChunkedGcmReader`. If the container
      // format, the nonce derivation or the Range handling were wrong, this is
      // where it shows — `initialize()` either throws or reports a decode error.
      await adapter.open(source);

      expect(adapter.snapshot.isInitialized, isTrue);
      expect(adapter.snapshot.errorMessage, isNull);
      // The fixture is 3s. Assert a floor rather than equality — container
      // duration is rounded from the track timescale and differs by a frame
      // between decoders.
      expect(
        adapter.snapshot.duration.inMilliseconds,
        greaterThan(2000),
        reason: 'duration should come from the decoded fixture, not a default',
      );

      await adapter.play();
      await waitFor(
        () => adapter.snapshot.position > Duration.zero,
        describe: 'playback position to advance past zero',
      );
      expect(adapter.snapshot.errorMessage, isNull);
    },
  );

  test(
    'a removed download falls back to the network and re-marks the row failed',
    () async {
      await container.delete();

      final LessonVideoSource source = await api.resolveVideoSource(lessonId);

      expect(source.kind, LessonVideoSourceKind.network);
      final DownloadedLesson? row = await dao.byLessonId(lessonId);
      expect(row?.state, DownloadState.failed);
      expect(row?.lastError, isNotNull);
    },
  );

  test(
    'a file removed under a live loopback URL answers 404 instead of hanging',
    () async {
      // The player is already holding this URL — resolution happened while the
      // file was intact, so the `resolveVideoSource` guard above cannot help.
      // The only thing standing between the user and a spinner that never ends
      // is the server answering at all.
      final LessonVideoSource source = await api.resolveVideoSource(lessonId);
      expect(source.kind, LessonVideoSourceKind.localFile);

      await container.delete();

      final HttpClient client = HttpClient();
      addTearDown(() => client.close(force: true));
      final HttpClientResponse response = await (await client.getUrl(
        Uri.parse(source.uri),
      )).close().timeout(const Duration(seconds: 10));
      await response.drain<void>();

      expect(response.statusCode, HttpStatus.notFound);
    },
  );

  test(
    'a player pointed at a removed download surfaces an error',
    timeout: decoderBudget,
    () async {
      final LessonVideoSource source = await api.resolveVideoSource(lessonId);
      await container.delete();

      final VideoPlayerAdapter adapter = VideoPlayerAdapter();
      addTearDown(adapter.dispose);

      // ExoPlayer reports a 404 either by rejecting `initialize()` or by settling
      // into an error value — which of the two is a plugin-version detail, and
      // pinning it here would make this test a tripwire for upgrades rather than
      // for the behaviour that matters: it must not sit there initialising
      // forever.
      Object? thrown;
      try {
        await adapter.open(source).timeout(const Duration(seconds: 25));
      } on TimeoutException {
        fail(
          'open() never settled — this is the hang the test exists to catch',
        );
      } on Object catch (error) {
        thrown = error;
      }

      final VideoPlaybackSnapshot snapshot = adapter.snapshot;
      expect(
        thrown ?? snapshot.errorMessage,
        isNotNull,
        reason: 'a missing download must fail the open, not hang it',
      );
      expect(snapshot.isInitialized, isFalse);
    },
  );
}
