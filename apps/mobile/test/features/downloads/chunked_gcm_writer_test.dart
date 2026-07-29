import 'dart:io';
import 'dart:math';
import 'dart:typed_data';

import 'package:cryptography/cryptography.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:app_mobile/features/downloads/data/chunked_gcm_writer.dart';
import 'package:app_mobile/features/downloads/domain/encrypted_file_format.dart';

void main() {
  late Directory dir;
  late File file;

  final Uint8List key = Uint8List.fromList(
    List<int>.generate(32, (int i) => i * 7 % 256),
  );

  Uint8List plaintext(int length) {
    final Random random = Random(1234);
    return Uint8List.fromList(
      List<int>.generate(length, (_) => random.nextInt(256)),
    );
  }

  setUp(() async {
    dir = await Directory.systemTemp.createTemp('csdl_writer');
    file = File('${dir.path}/lesson.csdl');
  });

  tearDown(() => dir.delete(recursive: true));

  test('writes a valid header before any block', () async {
    final ChunkedGcmWriter writer = await ChunkedGcmWriter.create(
      file: file,
      key: key,
    );
    await writer.close();

    final Uint8List header = await file.readAsBytes();
    expect(header.length, EncryptedFileFormat.headerLength);
    expect(EncryptedFileFormat.readNonce(header).length, 12);
  });

  test('commits only whole blocks as bytes arrive', () async {
    final ChunkedGcmWriter writer = await ChunkedGcmWriter.create(
      file: file,
      key: key,
    );

    await writer.add(plaintext(EncryptedFileFormat.blockSize - 1));
    expect(
      writer.committedPlaintextBytes,
      0,
      reason: 'partial block held back',
    );

    await writer.add(plaintext(1));
    expect(writer.committedPlaintextBytes, EncryptedFileFormat.blockSize);

    await writer.close();
    expect(await file.length(), EncryptedFileFormat.storedLengthFor(1));
  });

  test('finish seals a short trailing block', () async {
    final ChunkedGcmWriter writer = await ChunkedGcmWriter.create(
      file: file,
      key: key,
    );

    await writer.add(plaintext(EncryptedFileFormat.blockSize + 100));
    final int total = await writer.finish();
    await writer.close();

    expect(total, EncryptedFileFormat.blockSize + 100);
    expect(
      await file.length(),
      EncryptedFileFormat.storedLengthFor(1) +
          100 +
          EncryptedFileFormat.tagLength,
    );
    // `_seal` counts the short tail as a whole block internally, so the
    // getter must report the corrected total finish() returned, not
    // `_committedBlocks * blockSize` (which would over-report by
    // `blockSize - 100`).
    expect(writer.committedPlaintextBytes, total);
  });

  test('resume truncates a file that ran ahead of its row', () async {
    final ChunkedGcmWriter writer = await ChunkedGcmWriter.create(
      file: file,
      key: key,
    );
    await writer.add(plaintext(EncryptedFileFormat.blockSize * 3));
    await writer.close();

    // The row only ever recorded 1 block — simulating a crash between the file
    // write and the 4 MiB flush. The file must be cut back to match the row.
    final ChunkedGcmWriter resumed = await ChunkedGcmWriter.resume(
      file: file,
      key: key,
      committedPlaintextBytes: EncryptedFileFormat.blockSize,
    );

    expect(resumed.committedPlaintextBytes, EncryptedFileFormat.blockSize);
    expect(await file.length(), EncryptedFileFormat.storedLengthFor(1));
    await resumed.close();
  });

  test('resumed writes land after the truncation point, not at 0', () async {
    final ChunkedGcmWriter writer = await ChunkedGcmWriter.create(
      file: file,
      key: key,
    );
    await writer.add(plaintext(EncryptedFileFormat.blockSize * 3));
    await writer.close();

    // Snapshot block 0's stored bytes before resuming, so a `setPosition`
    // regression under `FileMode.append` (which forces every write to EOF)
    // would show up as this region changing instead of only growing.
    final Uint8List beforeResume = await file.readAsBytes();
    final Uint8List block0Before = Uint8List.sublistView(
      beforeResume,
      EncryptedFileFormat.storedOffsetOf(0),
      EncryptedFileFormat.storedOffsetOf(1),
    );

    final ChunkedGcmWriter resumed = await ChunkedGcmWriter.resume(
      file: file,
      key: key,
      committedPlaintextBytes: EncryptedFileFormat.blockSize,
    );
    await resumed.add(plaintext(EncryptedFileFormat.blockSize));
    await resumed.close();

    final Uint8List afterResume = await file.readAsBytes();
    expect(afterResume.length, EncryptedFileFormat.storedLengthFor(2));
    expect(
      Uint8List.sublistView(
        afterResume,
        EncryptedFileFormat.storedOffsetOf(0),
        EncryptedFileFormat.storedOffsetOf(1),
      ),
      block0Before,
      reason: 'block 0 must be untouched by the resumed write',
    );
    // `plaintext()` reseeds on every call, so the resumed block's plaintext
    // is byte-identical to block 0's. If `resume()` passed `committedBlocks:
    // 0` instead of `blocks`, the resumed block would encrypt that identical
    // plaintext under the same nonce as block 0 and come out byte-identical
    // too — the length and "block 0 unchanged" assertions above would still
    // pass. This is what actually proves nonce continuity across resume.
    expect(
      Uint8List.sublistView(
        afterResume,
        EncryptedFileFormat.storedOffsetOf(1),
        EncryptedFileFormat.storedOffsetOf(2),
      ),
      isNot(block0Before),
      reason: 'resumed block must not reuse block 0\'s nonce',
    );
  });

  test('resume rejects a file shorter than the row implies', () async {
    final ChunkedGcmWriter writer = await ChunkedGcmWriter.create(
      file: file,
      key: key,
    );
    await writer.add(plaintext(EncryptedFileFormat.blockSize * 2));
    await writer.close();

    // Simulate the row's fsync landing before the second block's write
    // reaches disk across a power cut: cut the file back into the middle of
    // block 1, while the row still claims both blocks are committed.
    // `FileMode.append` is used (not `write`) because `write` truncates the
    // file to empty as soon as it is opened.
    final RandomAccessFile truncator = await file.open(mode: FileMode.append);
    await truncator.truncate(EncryptedFileFormat.storedLengthFor(1) + 10);
    await truncator.close();

    expect(
      () => ChunkedGcmWriter.resume(
        file: file,
        key: key,
        committedPlaintextBytes: EncryptedFileFormat.blockSize * 2,
      ),
      throwsA(isA<FormatException>()),
    );
  });

  test(
    'concurrent unawaited add() calls still serialize onto distinct nonces',
    () async {
      final ChunkedGcmWriter writer = await ChunkedGcmWriter.create(
        file: file,
        key: key,
      );

      final Uint8List first = plaintext(EncryptedFileFormat.blockSize);
      final Uint8List second = Uint8List.fromList(
        first.map((int byte) => byte ^ 0xFF).toList(),
      );

      // Deliberately unawaited, mirroring `stream.listen(writer.add)`. If
      // `add()` did not serialize internally, both calls would read
      // `_committedBlocks` before either incremented it and seal under the
      // same nonce — corrupting the AES-GCM key material, not just one
      // block's plaintext.
      final Future<void> firstCall = writer.add(first);
      final Future<void> secondCall = writer.add(second);
      await Future.wait(<Future<void>>[firstCall, secondCall]);
      await writer.close();

      final Uint8List stored = await file.readAsBytes();
      final Uint8List fileNonce = EncryptedFileFormat.readNonce(stored);
      final AesGcm algorithm = AesGcm.with256bits();
      final SecretKey secretKey = SecretKey(key);

      Future<Uint8List> decryptBlock(int index) async {
        final Uint8List storedBlock = Uint8List.sublistView(
          stored,
          EncryptedFileFormat.storedOffsetOf(index),
          EncryptedFileFormat.storedOffsetOf(index + 1),
        );
        final Uint8List cipherText = Uint8List.sublistView(
          storedBlock,
          0,
          storedBlock.length - EncryptedFileFormat.tagLength,
        );
        final Uint8List tag = Uint8List.sublistView(
          storedBlock,
          storedBlock.length - EncryptedFileFormat.tagLength,
        );
        // Decrypting with the nonce derived from `index` only succeeds (MAC
        // check passes) if that block was actually sealed under that nonce
        // — this is what would fail if the two calls raced.
        final SecretBox box = SecretBox(
          cipherText,
          nonce: EncryptedFileFormat.nonceForBlock(fileNonce, index),
          mac: Mac(tag),
        );
        final List<int> plain = await algorithm.decrypt(
          box,
          secretKey: secretKey,
        );
        return Uint8List.fromList(plain);
      }

      expect(await decryptBlock(0), first);
      expect(await decryptBlock(1), second);
    },
  );

  test('resume rejects a byte count that is not a block boundary', () async {
    final ChunkedGcmWriter writer = await ChunkedGcmWriter.create(
      file: file,
      key: key,
    );
    await writer.close();

    expect(
      () => ChunkedGcmWriter.resume(
        file: file,
        key: key,
        committedPlaintextBytes: 5,
      ),
      throwsA(isA<ArgumentError>()),
    );
  });
}
