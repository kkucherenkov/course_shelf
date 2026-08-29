import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:app_mobile/features/downloads/data/http_lesson_byte_source.dart';
import 'package:app_mobile/features/downloads/data/loopback_decrypt_server.dart';
import 'package:app_mobile/features/player/data/lesson_player_api.dart';
import 'package:app_mobile/shared/config/app_config.dart';
import 'package:app_mobile/shared/db/app_database.dart';

// Relative, not `package:` — `always_use_package_imports` governs files under
// `lib/` only, and `test/` has no package path.
import '../../support/recording_http_adapter.dart';

/// Guards the whole `/api/v1` doubling class, not one file.
///
/// Dio **string-concatenates** `baseUrl + path`; it does not do RFC URI
/// resolution. `AppConfig.apiBaseUrl` already ends in `/api/v1`, so a call
/// site that passes `/api/v1/notes` resolves to `/api/v1/api/v1/notes` and
/// 404s against the real backend.
///
/// Issue #172 caught this in `auth_api.dart` and fixed that one file. It
/// survived in `lesson_player_api.dart` (10 call sites) and
/// `http_lesson_byte_source.dart` (1) for another six weeks, because the tests
/// covering them built Dio with `baseUrl: 'http://localhost:3000'` — without
/// the `/api/v1` the app runs with — and asserted `RequestOptions.path`, the
/// argument, rather than `RequestOptions.uri`, the resolved URL. Both mistakes
/// are load-bearing: either one alone hides the bug.
///
/// So this file does the opposite of both: it builds Dio from the real
/// `AppConfig`, exercises every method that reaches the network, and asserts
/// that no resolved path contains `/api/v1` twice. A new call site with the
/// prefix fails here without anyone remembering to write a test for it.
void main() {
  late AppDatabase db;
  late Dio dio;
  late RecordingHttpAdapter adapter;

  /// Exactly what `buildDio` uses, so the test cannot drift from the app.
  final String realBase = const AppConfig(
    apiBaseUrl: 'http://localhost:3000/api/v1',
    authBaseUrl: 'http://localhost:3000',
  ).apiBaseUrl;

  setUp(() {
    db = AppDatabase(NativeDatabase.memory());
    adapter = RecordingHttpAdapter(
      // One body that satisfies every reader here: `url` for stream-url and
      // material download-url, `body` for the note, `items` for bookmarks,
      // and the bookmark fields for a create.
      respond: (RequestOptions options) => ResponseBody.fromString(
        '{"url":"/api/v1/stream/lessons/l1?token=t","token":"t",'
        '"expiresAt":"2026-07-29T10:15:00Z","body":"note","items":[],'
        '"id":"b1","lessonId":"l1","positionSeconds":10,'
        '"createdAt":"2026-07-29T10:15:00Z",'
        '"updatedAt":"2026-07-29T10:15:00Z",'
        '"sections":[],"materials":[],"subtitles":[],'
        '"title":"t","durationSeconds":1,"courseId":"c1"}',
        200,
        headers: <String, List<String>>{
          Headers.contentTypeHeader: <String>[Headers.jsonContentType],
        },
      ),
    );
    dio = Dio(BaseOptions(baseUrl: realBase))..httpClientAdapter = adapter;
  });

  tearDown(() => db.close());

  LessonPlayerApi playerApi() => LessonPlayerApi(
    dio: dio,
    downloadsDao: DownloadsDao(db),
    // Never reached: with no `downloaded_lessons` row every call takes the
    // network branch, so nothing resolves a file.
    loopback: LoopbackDecryptServer(
      resolveFile: (String _) async => null,
      key: () async => Uint8List(32),
    ),
  );

  /// Every call is wrapped: several of these parse responses this one canned
  /// body does not satisfy. The parse result is irrelevant — the request was
  /// already recorded by the time parsing throws, and the request is what is
  /// under test.
  Future<void> ignoringResult(Future<void> Function() call) async {
    try {
      await call();
    } on Object {
      // Intentionally swallowed — see above.
    }
  }

  test('no LessonPlayerApi call resolves to a doubled /api/v1', () async {
    final LessonPlayerApi api = playerApi();

    await ignoringResult(() => api.fetchLesson('l1'));
    await ignoringResult(() => api.fetchCourseOutline('c1'));
    await ignoringResult(() => api.resolveVideoSource('l1'));
    await ignoringResult(() => api.fetchBookmarks('l1'));
    await ignoringResult(
      () => api.createBookmark(lessonId: 'l1', position: Duration.zero),
    );
    await ignoringResult(() => api.deleteBookmark('b1'));
    await ignoringResult(() => api.fetchNote('l1'));
    await ignoringResult(() => api.saveNote(lessonId: 'l1', body: 'x'));
    await ignoringResult(
      () => api.issueMaterialDownloadUrl(lessonId: 'l1', materialId: 'm1'),
    );

    expect(
      adapter.requests,
      isNotEmpty,
      reason: 'the API changed shape and this test stopped exercising it',
    );
    for (final RequestOptions request in adapter.requests) {
      expect(
        request.uri.path,
        isNot(contains('/api/v1/api/v1')),
        reason:
            '${request.method} ${request.path} resolved to ${request.uri} — '
            'drop the /api/v1 prefix from the call site; baseUrl carries it',
      );
      expect(
        request.uri.path,
        startsWith('/api/v1/'),
        reason: '${request.method} ${request.path} lost the versioned prefix',
      );
    }
  });

  test('no HttpLessonByteSource call resolves to a doubled /api/v1', () async {
    final HttpLessonByteSource source = HttpLessonByteSource(dio: dio);

    await ignoringResult(
      () => source.fetchFrom(lessonId: 'l1', offset: 0).then((_) {}),
    );

    expect(adapter.requests, isNotEmpty);
    for (final RequestOptions request in adapter.requests) {
      expect(request.uri.path, isNot(contains('/api/v1/api/v1')));
      expect(request.uri.path, startsWith('/api/v1/'));
    }
  });

  test('the prefix would have been caught: a doubled path is detectable', () {
    // Pins the mechanism itself, so the two tests above cannot quietly stop
    // meaning anything if Dio ever switches to real URI resolution.
    final RequestOptions doubled = RequestOptions(
      baseUrl: realBase,
      path: '/api/v1/notes',
    );
    expect(doubled.uri.path, '/api/v1/api/v1/notes');

    final RequestOptions correct = RequestOptions(
      baseUrl: realBase,
      path: '/notes',
    );
    expect(correct.uri.path, '/api/v1/notes');
  });
}
