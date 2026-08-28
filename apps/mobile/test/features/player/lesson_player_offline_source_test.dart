import 'dart:io';
import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:drift/drift.dart' show Value;
import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:app_mobile/features/downloads/data/loopback_decrypt_server.dart';
import 'package:app_mobile/features/downloads/domain/encrypted_file_format.dart';
import 'package:app_mobile/features/player/data/lesson_player_api.dart';
import 'package:app_mobile/features/player/domain/lesson_playback.dart';
import 'package:app_mobile/shared/db/app_database.dart';
import 'package:app_mobile/shared/db/tables/downloaded_lessons.dart';

import '../../support/recording_http_adapter.dart';

/// A `ready` download must play through the loopback decrypt server, never as
/// a raw path — `downloaded_lessons.filePath` is AES-GCM ciphertext, so
/// handing it to `video_player` plays nothing at all.
void main() {
  const int plaintextBytes = 100;
  // header + ciphertext + one tag, i.e. what an intact 100-byte download of a
  // single short block occupies on disk.
  const int storedBytes =
      EncryptedFileFormat.headerLength +
      plaintextBytes +
      EncryptedFileFormat.tagLength;

  late AppDatabase db;
  late DownloadsDao dao;
  late Dio dio;
  late Directory tmp;
  late LoopbackDecryptServer loopback;
  late LessonPlayerApi api;

  setUp(() async {
    db = AppDatabase(NativeDatabase.memory());
    dao = DownloadsDao(db);
    tmp = await Directory.systemTemp.createTemp('offline-source-test');
    dio = Dio(BaseOptions(baseUrl: 'http://localhost:3000'))
      ..httpClientAdapter = RecordingHttpAdapter(
        respond: (RequestOptions options) => ResponseBody.fromString(
          '{"url":"/api/v1/stream/lessons/l1?token=t"}',
          200,
          headers: <String, List<String>>{
            Headers.contentTypeHeader: <String>[Headers.jsonContentType],
          },
        ),
      );
    loopback = LoopbackDecryptServer(
      resolveFile: (String _) async => null,
      key: () async => Uint8List(32),
    );
    api = LessonPlayerApi(dio: dio, downloadsDao: dao, loopback: loopback);
  });

  tearDown(() async {
    await loopback.stop();
    await db.close();
    await tmp.delete(recursive: true);
  });

  Future<File> writeContainer(String name, int byteLength) async {
    final File file = File('${tmp.path}/$name');
    await file.writeAsBytes(Uint8List(byteLength));
    return file;
  }

  Future<void> insertReady(File file, {int? totalBytes = plaintextBytes}) =>
      dao.upsert(
        DownloadedLessonsCompanion.insert(
          lessonId: 'l1',
          state: DownloadState.ready,
          filePath: file.path,
          updatedAt: DateTime.now().toUtc(),
          totalBytes: Value<int?>(totalBytes),
        ),
      );

  test('an intact ready download resolves to the loopback decrypt URL', () async {
    await insertReady(await writeContainer('l1.csdl', storedBytes));

    final LessonVideoSource source = await api.resolveVideoSource('l1');

    expect(source.kind, LessonVideoSourceKind.localFile);
    expect(source.isOffline, isTrue);
    final Uri uri = Uri.parse(source.uri);
    expect(uri.scheme, 'http');
    expect(uri.host, '127.0.0.1');
    expect(uri.path, '/l/l1');
    // Loopback is reachable by every other app on the device, so the per-run
    // token — not the ephemeral port — is what gates access.
    expect(uri.queryParameters['t'], isNotEmpty);
  });

  test('a truncated container falls back to the network and re-marks the row failed', () async {
    await insertReady(await writeContainer('l1.csdl', storedBytes - 10));

    final LessonVideoSource source = await api.resolveVideoSource('l1');

    expect(source.kind, LessonVideoSourceKind.network);
    final DownloadedLesson? row = await dao.byLessonId('l1');
    expect(row?.state, DownloadState.failed);
    expect(row?.lastError, isNotNull);
  });

  test('a deleted file falls back to the network and re-marks the row failed', () async {
    final File file = await writeContainer('l1.csdl', storedBytes);
    await insertReady(file);
    await file.delete();

    final LessonVideoSource source = await api.resolveVideoSource('l1');

    expect(source.kind, LessonVideoSourceKind.network);
    expect((await dao.byLessonId('l1'))?.state, DownloadState.failed);
  });

  // `totalBytes` stays null until the first response carries a Content-Length,
  // so a row that never learnt its total must still be playable rather than
  // failing an integrity check it has no operand for.
  test('a ready row with no recorded total still plays offline', () async {
    await insertReady(
      await writeContainer('l1.csdl', storedBytes),
      totalBytes: null,
    );

    final LessonVideoSource source = await api.resolveVideoSource('l1');

    expect(source.kind, LessonVideoSourceKind.localFile);
  });
}
