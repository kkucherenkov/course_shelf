import 'dart:convert';
import 'dart:typed_data';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

import 'package:app_mobile/features/downloads/data/secure_download_key_store.dart';

class _MockSecureStorage extends Mock implements FlutterSecureStorage {}

void main() {
  late _MockSecureStorage storage;
  late SecureDownloadKeyStore store;

  setUp(() {
    storage = _MockSecureStorage();
    store = SecureDownloadKeyStore(storage);
    when(
      () => storage.write(
        key: any<String>(named: 'key'),
        value: any<String>(named: 'value'),
      ),
    ).thenAnswer((_) async {});
  });

  test('generates a 32-byte key on first use and persists it', () async {
    when(
      () => storage.read(key: any<String>(named: 'key')),
    ).thenAnswer((_) async => null);

    final Uint8List key = await store.keyForDevice();

    expect(key.length, 32);
    final String written =
        verify(
              () => storage.write(
                key: any<String>(named: 'key'),
                value: captureAny<String>(named: 'value'),
              ),
            ).captured.single
            as String;
    expect(base64Decode(written), key);
  });

  test('returns the stored key on later calls without rewriting', () async {
    final Uint8List existing = Uint8List.fromList(
      List<int>.generate(32, (int i) => i),
    );
    when(
      () => storage.read(key: any<String>(named: 'key')),
    ).thenAnswer((_) async => base64Encode(existing));

    expect(await store.keyForDevice(), existing);
    verifyNever(
      () => storage.write(
        key: any<String>(named: 'key'),
        value: any<String>(named: 'value'),
      ),
    );
  });

  test('regenerates when the stored value is the wrong length', () async {
    when(
      () => storage.read(key: any<String>(named: 'key')),
    ).thenAnswer((_) async => base64Encode(<int>[1, 2, 3]));

    final Uint8List key = await store.keyForDevice();

    expect(key.length, 32);
    verify(
      () => storage.write(
        key: any<String>(named: 'key'),
        value: any<String>(named: 'value'),
      ),
    ).called(1);
  });

  test('regenerates when the stored value is not valid base64', () async {
    // A corrupted store does not politely corrupt into something decodable.
    // `!` is outside the base64 alphabet and the length is not a multiple of
    // 4, so `base64Decode` throws `FormatException` rather than returning a
    // short list — a different failure from the wrong-length case above, and
    // one that escaped `keyForDevice` entirely.
    when(
      () => storage.read(key: any<String>(named: 'key')),
    ).thenAnswer((_) async => 'not!base64!!');

    final Uint8List key = await store.keyForDevice();

    expect(key.length, 32);
    verify(
      () => storage.write(
        key: any<String>(named: 'key'),
        value: any<String>(named: 'value'),
      ),
    ).called(1);
  });

  test('two generated keys differ', () async {
    when(
      () => storage.read(key: any<String>(named: 'key')),
    ).thenAnswer((_) async => null);

    final Uint8List a = await store.keyForDevice();
    final Uint8List b = await SecureDownloadKeyStore(storage).keyForDevice();

    expect(a, isNot(b));
  });
}
