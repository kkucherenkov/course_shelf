import 'dart:io';
import 'dart:math';
import 'dart:typed_data';

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
    expect(writer.committedPlaintextBytes, 0, reason: 'partial block held back');

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
      EncryptedFileFormat.storedLengthFor(1) + 100 + EncryptedFileFormat.tagLength,
    );
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
  });

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
