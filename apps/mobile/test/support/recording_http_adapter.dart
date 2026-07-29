import 'dart:typed_data';

import 'package:dio/dio.dart';

/// A [HttpClientAdapter] that records every request and returns a scripted
/// response. Lets a test assert on the exact method, path, and headers Dio put
/// on the wire without opening a socket.
///
/// `respond` receives the outgoing [RequestOptions] and returns the
/// [ResponseBody] to hand back, so a single adapter can answer different routes
/// differently and can vary its answer by call count.
class RecordingHttpAdapter implements HttpClientAdapter {
  RecordingHttpAdapter({required this.respond});

  final ResponseBody Function(RequestOptions options) respond;

  final List<RequestOptions> requests = <RequestOptions>[];

  RequestOptions get lastRequest => requests.last;

  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) async {
    requests.add(options);
    return respond(options);
  }

  @override
  void close({bool force = false}) {}
}
