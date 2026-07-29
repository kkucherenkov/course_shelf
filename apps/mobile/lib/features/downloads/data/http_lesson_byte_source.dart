import 'package:dio/dio.dart';

import 'package:app_mobile/features/downloads/domain/lesson_byte_source.dart';

/// [LessonByteSource] over the versioned REST API.
///
/// Mirrors `LessonPlayerApi`: Dio by hand against documented paths, because the
/// generated Dart client is currently unimportable (its codegen output path
/// makes every generated file self-import a directory that does not exist).
class HttpLessonByteSource implements LessonByteSource {
  HttpLessonByteSource({required Dio dio}) : _dio = dio;

  final Dio _dio;

  @override
  Future<RangedResponse> fetchFrom({
    required String lessonId,
    required int offset,
    CancelToken? cancelToken,
  }) async {
    // Minted per call, never cached. The token's TTL is 900s, so a resume after
    // a pause longer than that would otherwise present a dead token and 401.
    final Response<Map<String, dynamic>> minted = await _dio
        .get<Map<String, dynamic>>(
          '/api/v1/lessons/$lessonId/stream-url',
          cancelToken: cancelToken,
        );
    final Map<String, dynamic>? body = minted.data;
    if (body == null) {
      throw const FormatException('Empty stream-url response');
    }
    final String url = _resolveUrl(body['url'] as String);

    final Response<ResponseBody> response = await _dio.get<ResponseBody>(
      url,
      cancelToken: cancelToken,
      options: Options(
        responseType: ResponseType.stream,
        // Omitted at offset 0 so the server answers 200 with the whole body;
        // an open-ended range from 0 would work too, but this keeps a fresh
        // download on the simpler code path.
        headers: offset > 0
            ? <String, dynamic>{'Range': 'bytes=$offset-'}
            : null,
      ),
    );

    final ResponseBody? data = response.data;
    if (data == null) {
      throw const FormatException('Empty stream response');
    }

    return RangedResponse(
      bytes: data.stream,
      totalBytes: _totalFrom(response.headers),
    );
  }

  /// `Content-Range: bytes 100-102/900` -> 900. Falls back to `Content-Length`,
  /// which is the whole resource only on a 200.
  int? _totalFrom(Headers headers) {
    final String? contentRange = headers.value('content-range');
    if (contentRange != null) {
      final int slash = contentRange.lastIndexOf('/');
      if (slash != -1) {
        final String total = contentRange.substring(slash + 1);
        if (total != '*') return int.tryParse(total);
      }
    }
    final String? contentLength = headers.value('content-length');
    return contentLength == null ? null : int.tryParse(contentLength);
  }

  /// The backend returns a same-origin relative path so it never has to know
  /// its own public hostname — the same rule `LessonPlayerApi._resolveUrl`
  /// applies.
  String _resolveUrl(String raw) {
    if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
    final String base = _dio.options.baseUrl;
    if (base.isEmpty) return raw;
    return Uri.parse(base).resolve(raw).toString();
  }
}
