import 'package:dio/dio.dart';
import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:app_mobile/features/player/data/lesson_player_api.dart';
import 'package:app_mobile/shared/db/app_database.dart';

// Relative, not `package:` — `always_use_package_imports` governs files under
// `lib/` only, and `test/` has no package path.
import '../../support/recording_http_adapter.dart';

void main() {
  late AppDatabase db;
  late Dio dio;
  late RecordingHttpAdapter adapter;

  setUp(() {
    db = AppDatabase(NativeDatabase.memory());
    adapter = RecordingHttpAdapter(
      respond: (RequestOptions options) => ResponseBody.fromString(
        '{"url":"/api/v1/stream/lessons/l1?token=t","token":"t",'
        '"expiresAt":"2026-07-29T10:15:00Z"}',
        200,
        headers: <String, List<String>>{
          Headers.contentTypeHeader: <String>[Headers.jsonContentType],
        },
      ),
    );
    dio = Dio(BaseOptions(baseUrl: 'http://localhost:3000'))
      ..httpClientAdapter = adapter;
  });

  tearDown(() => db.close());

  // These two routes are GET in openapi.yaml, GET in the NestJS controller,
  // and GET in the generated TS client that apps/web uses. apps/mobile used
  // POST, which NestJS answers with 404. Pin the verb so it cannot regress.
  test('resolveVideoSource issues GET, not POST', () async {
    final LessonPlayerApi api = LessonPlayerApi(
      dio: dio,
      downloadsDao: DownloadsDao(db),
    );

    await api.resolveVideoSource('l1');

    expect(adapter.lastRequest.method, 'GET');
    expect(adapter.lastRequest.path, '/api/v1/lessons/l1/stream-url');
  });

  test('issueMaterialDownloadUrl issues GET, not POST', () async {
    final LessonPlayerApi api = LessonPlayerApi(
      dio: dio,
      downloadsDao: DownloadsDao(db),
    );

    await api.issueMaterialDownloadUrl(lessonId: 'l1', materialId: 'm1');

    expect(adapter.lastRequest.method, 'GET');
    expect(
      adapter.lastRequest.path,
      '/api/v1/lessons/l1/materials/m1/download-url',
    );
  });
}
