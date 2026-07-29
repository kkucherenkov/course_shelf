import 'dart:io';
import 'dart:math';
import 'dart:typed_data';

import 'package:cryptography/cryptography.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:app_mobile/features/downloads/data/chunked_gcm_reader.dart';
import 'package:app_mobile/features/downloads/data/chunked_gcm_writer.dart';
import 'package:app_mobile/features/downloads/domain/encrypted_file_format.dart';

void main() {
  late Directory dir;
  late File file;

  final Uint8List key = Uint8List.fromList(
    List<int>.generate(32, (int i) => i * 3 % 256),
  );

  Uint8List plaintext(int length) {
    final Random random = Random(99);
    return Uint8List.fromList(
      List<int>.generate(length, (_) => random.nextInt(256)),
    );
  }

  Future<Uint8List> writeFixture(int length) async {
    final Uint8List source = plaintext(length);
    final ChunkedGcmWriter writer = await ChunkedGcmWriter.create(
      file: file,
      key: key,
    );
    await writer.add(source);
    await writer.finish();
    await writer.close();
    return source;
  }

  setUp(() async {
    dir = await Directory.systemTemp.createTemp('csdl_reader');
    file = File('${dir.path}/lesson.csdl');
  });

  tearDown(() => dir.delete(recursive: true));

  test('reports the plaintext length across a short final block', () async {
    await writeFixture(EncryptedFileFormat.blockSize * 2 + 500);

    final ChunkedGcmReader reader = await ChunkedGcmReader.open(
      file: file,
      key: key,
    );
    expect(reader.plaintextLength, EncryptedFileFormat.blockSize * 2 + 500);
    await reader.close();
  });

  test('round-trips the whole file', () async {
    final Uint8List source = await writeFixture(
      EncryptedFileFormat.blockSize + 1000,
    );

    final ChunkedGcmReader reader = await ChunkedGcmReader.open(
      file: file,
      key: key,
    );
    expect(await reader.read(0, reader.plaintextLength), source);
    await reader.close();
  });

  test('reads a range spanning a block boundary', () async {
    final Uint8List source = await writeFixture(
      EncryptedFileFormat.blockSize * 3,
    );
    const int start = EncryptedFileFormat.blockSize - 10;

    final ChunkedGcmReader reader = await ChunkedGcmReader.open(
      file: file,
      key: key,
    );
    expect(
      await reader.read(start, 20),
      Uint8List.sublistView(source, start, start + 20),
    );
    await reader.close();
  });

  test('clamps a read that runs past the end', () async {
    final Uint8List source = await writeFixture(1000);

    final ChunkedGcmReader reader = await ChunkedGcmReader.open(
      file: file,
      key: key,
    );
    expect(await reader.read(900, 5000), Uint8List.sublistView(source, 900));
    await reader.close();
  });

  test('a flipped byte fails authentication at that block', () async {
    await writeFixture(EncryptedFileFormat.blockSize * 2);

    // Corrupt one byte inside block 1's ciphertext.
    final RandomAccessFile handle = await file.open(mode: FileMode.append);
    final int target = EncryptedFileFormat.storedOffsetOf(1) + 42;
    await handle.setPosition(target);
    await handle.writeByte(0xFF);
    await handle.close();

    final ChunkedGcmReader reader = await ChunkedGcmReader.open(
      file: file,
      key: key,
    );

    // Block 0 is untouched and still readable — per-block tags localize damage.
    expect((await reader.read(0, 16)).length, 16);
    await expectLater(
      reader.read(EncryptedFileFormat.blockSize, 16),
      throwsA(isA<SecretBoxAuthenticationError>()),
    );
    await reader.close();
  });

  test('rejects a foreign container', () async {
    await file.writeAsBytes(Uint8List(EncryptedFileFormat.headerLength));
    expect(
      () => ChunkedGcmReader.open(file: file, key: key),
      throwsA(isA<FormatException>()),
    );
  });
}
