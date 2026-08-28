import 'dart:io';
import 'dart:math';
import 'dart:typed_data';

import 'package:flutter_test/flutter_test.dart';

import 'package:app_mobile/features/downloads/data/chunked_gcm_writer.dart';
import 'package:app_mobile/features/downloads/data/loopback_decrypt_server.dart';
import 'package:app_mobile/features/downloads/domain/encrypted_file_format.dart';

void main() {
  late Directory dir;
  late File file;
  late File corruptFile;
  late LoopbackDecryptServer server;
  late Uint8List source;

  final Uint8List key = Uint8List.fromList(
    List<int>.generate(32, (int i) => i * 5 % 256),
  );

  setUp(() async {
    dir = await Directory.systemTemp.createTemp('csdl_server');
    file = File('${dir.path}/l1.csdl');
    // Not written here — only the "corrupt header" test populates this, with
    // a bad magic, so a fresh empty File exists for every other test's
    // resolver to safely ignore.
    corruptFile = File('${dir.path}/corrupt.csdl');

    final Random random = Random(7);
    source = Uint8List.fromList(
      List<int>.generate(
        EncryptedFileFormat.blockSize + 2048,
        (_) => random.nextInt(256),
      ),
    );
    final ChunkedGcmWriter writer = await ChunkedGcmWriter.create(
      file: file,
      key: key,
    );
    await writer.add(source);
    await writer.finish();
    await writer.close();

    server = LoopbackDecryptServer(
      resolveFile: (String lessonId) async {
        if (lessonId == 'l1') return file;
        if (lessonId == 'corrupt') return corruptFile;
        return null;
      },
      key: () async => key,
    );
    await server.start();
  });

  tearDown(() async {
    await server.stop();
    await dir.delete(recursive: true);
  });

  Future<HttpClientResponse> get(Uri url, {String? range}) async {
    final HttpClient client = HttpClient();
    final HttpClientRequest request = await client.getUrl(url);
    if (range != null) request.headers.set(HttpHeaders.rangeHeader, range);
    return request.close();
  }

  // `resolveVideoSource` calls `start()` on every offline play, so two
  // overlapping lesson opens race it. A check-then-act guard binds two sockets
  // and orphans the first with no reference left to close it.
  test('concurrent start() calls bind exactly one socket', () async {
    // setUp already started this one; stop first so both calls below race the
    // same cold start.
    await server.stop();

    final List<Uri> bound = await Future.wait<Uri>(<Future<Uri>>[
      server.start(),
      server.start(),
      server.start(),
    ]);

    expect(bound.map((Uri uri) => uri.port).toSet(), hasLength(1));
    // The one socket that did get bound is the one being served from.
    final HttpClientResponse response = await get(server.urlFor('l1'));
    expect(response.statusCode, 200);
    await response.drain<void>();
  });

  test('serves the whole file with 200 and Accept-Ranges', () async {
    final HttpClientResponse response = await get(server.urlFor('l1'));

    expect(response.statusCode, 200);
    expect(response.headers.value(HttpHeaders.acceptRangesHeader), 'bytes');
    expect(response.contentLength, source.length);

    final List<int> body = await response.fold<List<int>>(
      <int>[],
      (List<int> acc, List<int> chunk) => acc..addAll(chunk),
    );
    expect(Uint8List.fromList(body), source);
  });

  test('answers a Range request with 206 and the right slice', () async {
    final HttpClientResponse response = await get(
      server.urlFor('l1'),
      range: 'bytes=100-199',
    );

    expect(response.statusCode, 206);
    expect(
      response.headers.value(HttpHeaders.contentRangeHeader),
      'bytes 100-199/${source.length}',
    );

    final List<int> body = await response.fold<List<int>>(
      <int>[],
      (List<int> acc, List<int> chunk) => acc..addAll(chunk),
    );
    expect(Uint8List.fromList(body), Uint8List.sublistView(source, 100, 200));
  });

  test('serves an open-ended range to the end', () async {
    const int from = EncryptedFileFormat.blockSize + 1000;
    final HttpClientResponse response = await get(
      server.urlFor('l1'),
      range: 'bytes=$from-',
    );

    expect(response.statusCode, 206);
    final List<int> body = await response.fold<List<int>>(
      <int>[],
      (List<int> acc, List<int> chunk) => acc..addAll(chunk),
    );
    expect(Uint8List.fromList(body), Uint8List.sublistView(source, from));
  });

  test('416 when the range starts past the end', () async {
    final HttpClientResponse response = await get(
      server.urlFor('l1'),
      range: 'bytes=${source.length + 10}-',
    );

    expect(response.statusCode, 416);
    expect(response.headers.value(HttpHeaders.acceptRangesHeader), 'bytes');
  });

  test('404 for an unknown lesson', () async {
    final Uri url = server.urlFor('l1');
    final HttpClientResponse response = await get(url.replace(path: '/l/nope'));

    expect(response.statusCode, 404);
    expect(response.headers.value(HttpHeaders.acceptRangesHeader), 'bytes');
  });

  test('401 without the session token', () async {
    // Loopback is reachable by every other app on the device, so the ephemeral
    // port is not access control. The per-run token is.
    final Uri url = server.urlFor('l1').replace(queryParameters: const {});
    final HttpClientResponse response = await get(url);

    expect(response.statusCode, 401);
    expect(response.headers.value(HttpHeaders.acceptRangesHeader), 'bytes');
  });

  test('401 with a wrong token', () async {
    final Uri url = server
        .urlFor('l1')
        .replace(queryParameters: <String, String>{'t': 'not-the-token'});
    final HttpClientResponse response = await get(url);

    expect(response.statusCode, 401);
    expect(response.headers.value(HttpHeaders.acceptRangesHeader), 'bytes');
  });

  test('binds loopback only', () async {
    expect(server.urlFor('l1').host, '127.0.0.1');
  });

  test(
    'a corrupt block mid-stream truncates the response instead of hanging',
    () async {
      // Corrupt one byte inside block 1's ciphertext, after the fixture (and
      // the server pointed at it) already exist.
      final RandomAccessFile handle = await file.open(mode: FileMode.append);
      await handle.setPosition(EncryptedFileFormat.storedOffsetOf(1) + 42);
      await handle.writeByte(0xFF);
      await handle.close();

      // Range starts in block 0 (so headers + some bytes go out fine) and
      // extends into the corrupted block 1.
      final HttpClientResponse response = await get(
        server.urlFor('l1'),
        range: 'bytes=0-${EncryptedFileFormat.blockSize + 100}',
      );

      expect(response.statusCode, 206);
      await expectLater(
        response.fold<List<int>>(
          <int>[],
          (List<int> acc, List<int> chunk) => acc..addAll(chunk),
        ),
        throwsA(anything),
        reason: 'a truncated body must surface as an error, not a hang',
      );
    },
    timeout: const Timeout(Duration(seconds: 10)),
  );

  test(
    'a corrupt container header answers with an error, not a hang',
    () async {
      // Wrong magic: ChunkedGcmReader.open() throws a FormatException before
      // any status or header for the real body is written. Without the
      // setup-phase guard, this exception has nowhere to go but the response
      // never being closed.
      await corruptFile.writeAsBytes(
        Uint8List(EncryptedFileFormat.headerLength),
      );

      final HttpClientResponse response = await get(server.urlFor('corrupt'));

      expect(response.statusCode, 500);
      expect(response.headers.value(HttpHeaders.acceptRangesHeader), 'bytes');
    },
    timeout: const Timeout(Duration(seconds: 10)),
  );
}
