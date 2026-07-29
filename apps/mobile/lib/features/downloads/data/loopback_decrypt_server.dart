import 'dart:developer' as developer;
import 'dart:io';
import 'dart:math';
import 'dart:typed_data';

import 'package:app_mobile/features/downloads/data/chunked_gcm_reader.dart';

/// Serves a downloaded lesson's *plaintext* over `127.0.0.1` so `video_player`
/// can play it.
///
/// `video_player` wraps ExoPlayer / AVPlayer, takes a URL or a path, and cannot
/// decrypt. Handing it a decrypted temp file would put plaintext on disk and
/// double the storage; a loopback server keeps the plaintext in memory, one
/// block at a time, for exactly as long as a read needs it.
///
/// Access control is the per-run token, **not** the ephemeral port: loopback is
/// reachable by every other app on the device.
class LoopbackDecryptServer {
  LoopbackDecryptServer({
    required Future<File?> Function(String lessonId) resolveFile,
    required Future<Uint8List> Function() key,
  }) : _resolveFile = resolveFile,
       _key = key;

  /// Chunk size for streaming a range out. Independent of the container's block
  /// size — this is just how much is held in memory at once.
  static const int _chunkSize = 65536;

  final Future<File?> Function(String lessonId) _resolveFile;
  final Future<Uint8List> Function() _key;

  HttpServer? _server;
  late final String _token = _mintToken();

  Uri urlFor(String lessonId) {
    final HttpServer server = _requireServer();
    return Uri(
      scheme: 'http',
      host: server.address.address,
      port: server.port,
      path: '/l/$lessonId',
      queryParameters: <String, String>{'t': _token},
    );
  }

  Future<Uri> start() async {
    if (_server != null) return urlFor('');
    final HttpServer server = await HttpServer.bind(
      InternetAddress.loopbackIPv4,
      0,
    );
    _server = server;
    _listen(server);
    return urlFor('');
  }

  Future<void> stop() async {
    final HttpServer? server = _server;
    _server = null;
    await server?.close(force: true);
  }

  HttpServer _requireServer() {
    final HttpServer? server = _server;
    if (server == null) {
      throw StateError('LoopbackDecryptServer.start() has not been called');
    }
    return server;
  }

  /// Not awaited: `listen` returns a subscription that lives as long as the
  /// server, and `stop()` closing the server is what ends it.
  ///
  /// `_handle`'s returned `Future` is deliberately not awaited either — one
  /// slow or failing request must not block the next connection — so its
  /// errors (e.g. a corrupt block mid-stream, rethrown after the response is
  /// closed early) are caught here instead. Left uncaught, they would become
  /// unhandled `Future` rejections that answer to nothing in particular,
  /// rather than being contained to the one request that failed.
  ///
  /// Contained, but not silent: this is the only place an error from the whole
  /// playback-serving path can surface at all. A failed MAC, secure storage
  /// refusing the key, a file deleted mid-read — the client sees a 500 or a
  /// truncated body and nothing else, so without this log there is no way to
  /// tell those apart from a device.
  void _listen(HttpServer server) {
    server.listen(
      (HttpRequest request) {
        _handle(request).catchError((Object error, StackTrace stackTrace) {
          _log('Loopback request failed', error, stackTrace);
        });
      },
      onError: (Object error, StackTrace stackTrace) {
        _log('Loopback server socket error', error, stackTrace);
      },
    );
  }

  void _log(String message, Object error, StackTrace stackTrace) =>
      developer.log(
        message,
        error: error,
        stackTrace: stackTrace,
        name: 'LoopbackDecryptServer',
      );

  Future<void> _handle(HttpRequest request) async {
    final HttpResponse response = request.response;
    // Sent on every response — including 401/404/416 — per the brief.
    // Setting it once here, before any status branch, means no later branch
    // can forget it.
    response.headers.set(HttpHeaders.acceptRangesHeader, 'bytes');

    if (request.uri.queryParameters['t'] != _token) {
      response.statusCode = HttpStatus.unauthorized;
      await response.close();
      return;
    }

    final List<String> segments = request.uri.pathSegments;
    if (segments.length != 2 || segments.first != 'l') {
      response.statusCode = HttpStatus.notFound;
      await response.close();
      return;
    }

    // Everything below this point can throw during setup — a resolver
    // failure, `_key()` (secure storage unavailable), or
    // `ChunkedGcmReader.open()` (a corrupt container header, or the file
    // vanishing between the `existsSync()` check and the open call below,
    // i.e. a delete racing this request) — or mid-stream, if a block fails
    // its MAC. Either way the response must get *some* status and be closed,
    // not left open forever waiting for bytes that are never coming.
    //
    // dart:io's `HttpResponse` does not expose a way to ask "have headers
    // already gone out?", so `responseStarted` tracks that explicitly: it
    // flips right before the real status/headers are written for the actual
    // body, which is the last point a fresh status code is still possible.
    ChunkedGcmReader? reader;
    bool responseStarted = false;
    try {
      final File? file = await _resolveFile(segments[1]);
      if (file == null || !file.existsSync()) {
        response.statusCode = HttpStatus.notFound;
        await response.close();
        return;
      }

      reader = await ChunkedGcmReader.open(file: file, key: await _key());

      final int total = reader.plaintextLength;
      final _Range? range = _parseRange(
        request.headers.value(HttpHeaders.rangeHeader),
        total,
      );

      if (range != null && range.unsatisfiable) {
        response.statusCode = HttpStatus.requestedRangeNotSatisfiable;
        response.headers.set(HttpHeaders.contentRangeHeader, 'bytes */$total');
        await response.close();
        return;
      }

      final int start = range?.start ?? 0;
      final int end = range?.end ?? total - 1;

      response.headers.contentType = ContentType('video', 'mp4');
      response.headers.set(HttpHeaders.contentLengthHeader, end - start + 1);

      if (range == null) {
        response.statusCode = HttpStatus.ok;
      } else {
        response.statusCode = HttpStatus.partialContent;
        response.headers.set(
          HttpHeaders.contentRangeHeader,
          'bytes $start-$end/$total',
        );
      }

      // Status and headers for the real body are now on the wire: a later
      // failure can only truncate the body, not re-answer with a fresh
      // status.
      responseStarted = true;
      int cursor = start;
      while (cursor <= end) {
        final int take = min(_chunkSize, end - cursor + 1);
        response.add(await reader.read(cursor, take));
        await response.flush();
        cursor += take;
      }
      await response.close();
    } on Object {
      try {
        if (!responseStarted) {
          // Nothing has been written yet, so a real status is still
          // possible — a setup failure must not answer with silence.
          response.statusCode = HttpStatus.internalServerError;
        }
        // If streaming had already started, the status and Content-Length
        // are already on the wire and cannot change: closing short of that
        // promised length is the signal instead. A body shorter than
        // Content-Length reads as truncated, which both ExoPlayer and
        // AVPlayer treat as a decode error rather than a hang.
        await response.close();
      } on Object {
        // close() itself throws the same Content-Length-mismatch exception
        // in the mid-stream case (dart:io validates bytes written against
        // the header it already sent) — expected, and must not mask the
        // original error below.
      }
      rethrow;
    } finally {
      await reader?.close();
    }
  }

  /// Handles `bytes=a-b` and `bytes=a-`. A suffix range (`bytes=-n`) is not
  /// emitted by ExoPlayer or AVPlayer for progressive playback, so it is
  /// treated as absent rather than half-implemented.
  _Range? _parseRange(String? header, int total) {
    if (header == null || !header.startsWith('bytes=')) return null;
    final String spec = header.substring('bytes='.length);
    final int dash = spec.indexOf('-');
    if (dash <= 0) return null;

    final int? start = int.tryParse(spec.substring(0, dash));
    if (start == null) return null;
    if (start >= total) return const _Range.unsatisfiable();

    final String tail = spec.substring(dash + 1);
    final int end = tail.isEmpty
        ? total - 1
        : min(int.tryParse(tail) ?? total - 1, total - 1);
    if (end < start) return const _Range.unsatisfiable();

    return _Range(start: start, end: end);
  }

  static String _mintToken() {
    final Random random = Random.secure();
    final List<int> bytes = List<int>.generate(16, (_) => random.nextInt(256));
    return bytes.map((int b) => b.toRadixString(16).padLeft(2, '0')).join();
  }
}

class _Range {
  const _Range({required this.start, required this.end})
    : unsatisfiable = false;

  const _Range.unsatisfiable() : start = 0, end = 0, unsatisfiable = true;

  final int start;
  final int end;
  final bool unsatisfiable;
}
