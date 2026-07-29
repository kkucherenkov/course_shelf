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
  late LoopbackDecryptServer server;
  late Uint8List source;

  final Uint8List key = Uint8List.fromList(
    List<int>.generate(32, (int i) => i * 5 % 256),
  );

  setUp(() async {
    dir = await Directory.systemTemp.createTemp('csdl_server');
    file = File('${dir.path}/l1.csdl');

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
      resolveFile: (String lessonId) async => lessonId == 'l1' ? file : null,
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
  });

  test('404 for an unknown lesson', () async {
    final Uri url = server.urlFor('l1');
    final HttpClientResponse response = await get(url.replace(path: '/l/nope'));

    expect(response.statusCode, 404);
  });

  test('401 without the session token', () async {
    // Loopback is reachable by every other app on the device, so the ephemeral
    // port is not access control. The per-run token is.
    final Uri url = server.urlFor('l1').replace(queryParameters: const {});
    final HttpClientResponse response = await get(url);

    expect(response.statusCode, 401);
  });

  test('401 with a wrong token', () async {
    final Uri url = server
        .urlFor('l1')
        .replace(queryParameters: <String, String>{'t': 'not-the-token'});
    final HttpClientResponse response = await get(url);

    expect(response.statusCode, 401);
  });

  test('binds loopback only', () async {
    expect(server.urlFor('l1').host, '127.0.0.1');
  });
}
