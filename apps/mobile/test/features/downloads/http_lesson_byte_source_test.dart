import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:app_mobile/features/downloads/data/http_lesson_byte_source.dart';
import 'package:app_mobile/features/downloads/domain/lesson_byte_source.dart';

import '../../support/recording_http_adapter.dart';

void main() {
  late Dio dio;
  late RecordingHttpAdapter adapter;

  ResponseBody jsonUrl() => ResponseBody.fromString(
    '{"url":"/api/v1/stream/lessons/l1?token=tok","token":"tok",'
    '"expiresAt":"2026-07-29T10:15:00Z"}',
    200,
    headers: <String, List<String>>{
      Headers.contentTypeHeader: <String>[Headers.jsonContentType],
    },
  );

  ResponseBody partial(List<int> bytes, {required String contentRange}) =>
      ResponseBody(
        Stream<Uint8List>.value(Uint8List.fromList(bytes)),
        206,
        headers: <String, List<String>>{
          'content-range': <String>[contentRange],
        },
      );

  setUp(() {
    adapter = RecordingHttpAdapter(
      respond: (RequestOptions options) => options.path.contains('stream-url')
          ? jsonUrl()
          : partial(<int>[1, 2, 3], contentRange: 'bytes 100-102/900'),
    );
    dio = Dio(BaseOptions(baseUrl: 'http://localhost:3000'))
      ..httpClientAdapter = adapter;
  });

  test('mints a fresh signed URL on every fetch', () async {
    final LessonByteSource source = HttpLessonByteSource(dio: dio);

    await source.fetchFrom(lessonId: 'l1', offset: 0);
    await source.fetchFrom(lessonId: 'l1', offset: 0);

    final int mints = adapter.requests
        .where((RequestOptions r) => r.path.contains('stream-url'))
        .length;
    // The token's TTL is 15 minutes; a resume after a long pause must not carry
    // a dead one, so the URL is re-minted every time rather than cached.
    expect(mints, 2);
  });

  test('sends the exact open-ended Range header', () async {
    final LessonByteSource source = HttpLessonByteSource(dio: dio);

    await source.fetchFrom(lessonId: 'l1', offset: 4096);

    final RequestOptions ranged = adapter.requests.last;
    expect(ranged.method, 'GET');
    expect(ranged.headers['Range'], 'bytes=4096-');
  });

  test('omits Range when starting from zero', () async {
    final LessonByteSource source = HttpLessonByteSource(dio: dio);

    await source.fetchFrom(lessonId: 'l1', offset: 0);

    expect(adapter.requests.last.headers.containsKey('Range'), isFalse);
  });

  test('parses the total from Content-Range', () async {
    final LessonByteSource source = HttpLessonByteSource(dio: dio);

    final RangedResponse response = await source.fetchFrom(
      lessonId: 'l1',
      offset: 100,
    );

    expect(response.totalBytes, 900);
  });

  test('falls back to Content-Length on a 200', () async {
    adapter = RecordingHttpAdapter(
      respond: (RequestOptions options) => options.path.contains('stream-url')
          ? jsonUrl()
          : ResponseBody(
              Stream<Uint8List>.value(Uint8List.fromList(<int>[1, 2])),
              200,
              headers: <String, List<String>>{
                'content-length': <String>['2'],
              },
            ),
    );
    dio = Dio(BaseOptions(baseUrl: 'http://localhost:3000'))
      ..httpClientAdapter = adapter;

    final RangedResponse response = await HttpLessonByteSource(
      dio: dio,
    ).fetchFrom(lessonId: 'l1', offset: 0);

    expect(response.totalBytes, 2);
  });

  test('resolves a relative signed URL against the Dio base', () async {
    await HttpLessonByteSource(dio: dio).fetchFrom(lessonId: 'l1', offset: 0);

    expect(adapter.requests.last.uri.host, 'localhost');
    expect(adapter.requests.last.uri.path, '/api/v1/stream/lessons/l1');
  });
}
