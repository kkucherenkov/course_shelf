import 'dart:async';
import 'dart:io';
import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:path_provider/path_provider.dart';

import 'package:app_mobile/features/downloads/data/chunked_gcm_reader.dart';
import 'package:app_mobile/features/downloads/data/disk_space_device_storage.dart';
import 'package:app_mobile/features/downloads/data/downloads_repository_impl.dart';
import 'package:app_mobile/features/downloads/data/http_lesson_byte_source.dart';
import 'package:app_mobile/features/downloads/data/secure_download_key_store.dart';
import 'package:app_mobile/features/downloads/domain/download_scheduler_port.dart';
import 'package:app_mobile/shared/db/app_database.dart';
import 'package:app_mobile/shared/db/tables/downloaded_lessons.dart';

import 'support/tiny_mp4.dart';

/// The download queue, on a device, with nothing above `LessonByteSource`
/// faked: real HTTP over a loopback origin, the real Keystore key, the real
/// application-support directory, the real bundled SQLite, and the real
/// AES-GCM container writer.
///
/// `test/features/downloads/downloads_repository_impl_test.dart` covers the
/// state machine — retries, backoff, pause, cancel, changed-resource. This
/// covers the one thing it cannot: that a byte fetched over a socket, sealed
/// under a key from Android Keystore, written into a path `path_provider`
/// chose, comes back out identical.
void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  const String lessonId = 'l1';

  late AppDatabase db;
  late DownloadsDao dao;
  late HttpServer origin;
  late Directory downloads;
  late Uint8List payload;
  late DownloadsRepositoryImpl repository;
  int streamUrlRequests = 0;

  /// Stands in for the backend: mints a signed URL, then serves the bytes.
  /// Closes over `origin` and `payload`, both of which are assigned before the
  /// first request can arrive.
  Future<void> serve(HttpRequest request) async {
    final HttpResponse response = request.response;
    if (request.uri.path.endsWith('/stream-url')) {
      streamUrlRequests++;
      response.headers.contentType = ContentType.json;
      response.write('{"url":"http://127.0.0.1:${origin.port}/blob"}');
    } else if (request.uri.path == '/blob') {
      response.headers.contentType = ContentType('video', 'mp4');
      response.headers.set(HttpHeaders.contentLengthHeader, payload.length);
      response.add(payload);
    } else {
      response.statusCode = HttpStatus.notFound;
    }
    await response.close();
  }

  setUp(() async {
    payload = tinyMp4Bytes();
    streamUrlRequests = 0;

    db = AppDatabase(NativeDatabase.memory());
    dao = DownloadsDao(db);

    final Directory support = await getApplicationSupportDirectory();
    downloads = await Directory(
      '${support.path}/integration_test/download_queue',
    ).create(recursive: true);

    origin = await HttpServer.bind(InternetAddress.loopbackIPv4, 0);
    unawaited(origin.forEach(serve));

    repository = DownloadsRepositoryImpl(
      dao: dao,
      byteSource: HttpLessonByteSource(
        dio: Dio(
          BaseOptions(
            baseUrl: 'http://127.0.0.1:${origin.port}/api/v1',
            connectTimeout: const Duration(seconds: 10),
            receiveTimeout: const Duration(seconds: 10),
          ),
        ),
      ),
      keyStore: SecureDownloadKeyStore(),
      scheduler: _NoopScheduler(),
      downloadsDirectory: () async => downloads,
      isOnline: () async => true,
      // The production ladder is 2s..16s. A test that waits it out is a test
      // that gets killed by `timeout-minutes`; the ladder itself is unit-tested.
      backoff: (int _) => Duration.zero,
    );
  });

  tearDown(() async {
    await origin.close(force: true);
    await db.close();
    if (downloads.existsSync()) await downloads.delete(recursive: true);
  });

  test(
    'a queued lesson downloads, encrypts, and decrypts back unchanged',
    () async {
      await repository.enqueueLesson(lessonId, lessonTitle: 'Lesson one');
      await repository.drain();

      final DownloadedLesson? row = await dao.byLessonId(lessonId);
      expect(row, isNotNull);
      expect(row!.state, DownloadState.ready);
      expect(row.lastError, isNull);
      expect(row.totalBytes, payload.length);
      expect(streamUrlRequests, greaterThan(0));

      final File container = File(row.filePath);
      expect(container.existsSync(), isTrue);
      // Ciphertext, not the payload — a container the same size as the plaintext
      // would mean the header and tag never got written.
      expect(await container.length(), greaterThan(payload.length));

      final ChunkedGcmReader reader = await ChunkedGcmReader.open(
        file: container,
        key: await SecureDownloadKeyStore().keyForDevice(),
      );
      addTearDown(reader.close);

      expect(reader.plaintextLength, payload.length);
      expect(await reader.read(0, payload.length), payload);
    },
  );

  // `disk_space_plus` is the one dependency whose native side no check has ever
  // executed — under `flutter test` it is a `MissingPluginException` that
  // `DiskSpaceDeviceStorage` swallows into `null`, so the unit test proves only
  // that the swallow works.
  test('device free space comes back from the platform', () async {
    final int? free = await DiskSpaceDeviceStorage().read();

    expect(free, isNotNull, reason: 'disk_space_plus returned no reading');
    expect(free, greaterThan(0));
  });
}

/// The queue asks the OS for a background wake-up after every state change.
/// WorkManager registration is not what this test is about, and a real
/// registration would outlive the test process.
class _NoopScheduler implements DownloadSchedulerPort {
  @override
  Future<void> ensureScheduled() async {}

  @override
  Future<void> cancelAll() async {}
}
