import 'dart:typed_data';

import 'package:dio/dio.dart';

/// One ranged read of a lesson's video.
class RangedResponse {
  const RangedResponse({required this.bytes, required this.totalBytes});

  /// The body, streamed — a lesson video does not fit comfortably in memory.
  final Stream<Uint8List> bytes;

  /// Full length of the resource, from `Content-Range` on a 206 or
  /// `Content-Length` on a 200. Null when the server sent neither.
  final int? totalBytes;
}

/// Port — supplies lesson video bytes starting at an arbitrary offset.
///
/// Exists so the download queue can be tested without HTTP, and so every
/// signed-URL concern (minting, TTL, relative-URL resolution) stays in one
/// implementation.
abstract class LessonByteSource {
  Future<RangedResponse> fetchFrom({
    required String lessonId,
    required int offset,
    CancelToken? cancelToken,
  });
}
