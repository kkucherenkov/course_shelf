import 'dart:typed_data';

import 'package:flutter_test/flutter_test.dart';

import 'package:app_mobile/features/downloads/domain/encrypted_file_format.dart';

void main() {
  const int block = EncryptedFileFormat.blockSize;

  Uint8List nonce() =>
      Uint8List.fromList(List<int>.generate(12, (int i) => i + 1));

  group('block arithmetic', () {
    test(
      'blockIndexAt is inclusive at the low edge, exclusive at the high',
      () {
        expect(EncryptedFileFormat.blockIndexAt(0), 0);
        expect(EncryptedFileFormat.blockIndexAt(block - 1), 0);
        expect(EncryptedFileFormat.blockIndexAt(block), 1);
        expect(EncryptedFileFormat.blockIndexAt(block * 3 + 7), 3);
      },
    );

    test('storedOffsetOf accounts for the header and every prior tag', () {
      expect(EncryptedFileFormat.storedOffsetOf(0), 24);
      expect(EncryptedFileFormat.storedOffsetOf(1), 24 + block + 16);
      expect(EncryptedFileFormat.storedOffsetOf(2), 24 + 2 * (block + 16));
    });

    test('storedLengthFor is the truncation target on resume', () {
      expect(EncryptedFileFormat.storedLengthFor(0), 24);
      expect(EncryptedFileFormat.storedLengthFor(4), 24 + 4 * (block + 16));
    });

    test('wholeBlocksIn never counts a partial trailing block', () {
      expect(EncryptedFileFormat.wholeBlocksIn(0), 0);
      expect(EncryptedFileFormat.wholeBlocksIn(block - 1), 0);
      expect(EncryptedFileFormat.wholeBlocksIn(block), 1);
      expect(EncryptedFileFormat.wholeBlocksIn(block * 2 + 5), 2);
    });

    test('plaintextLengthFor inverts a whole-block file', () {
      expect(EncryptedFileFormat.plaintextLengthFor(24), 0);
      expect(
        EncryptedFileFormat.plaintextLengthFor(
          EncryptedFileFormat.storedLengthFor(3),
        ),
        block * 3,
      );
    });

    test('plaintextLengthFor subtracts the tag from a short final block', () {
      // 2 whole blocks, then a 100-byte final block sealed with a 16-byte tag.
      final int stored = EncryptedFileFormat.storedLengthFor(2) + 100 + 16;
      expect(EncryptedFileFormat.plaintextLengthFor(stored), block * 2 + 100);
    });
  });

  group('nonce derivation', () {
    test('is deterministic', () {
      expect(
        EncryptedFileFormat.nonceForBlock(nonce(), 7),
        EncryptedFileFormat.nonceForBlock(nonce(), 7),
      );
    });

    test('differs for every block index — a reused GCM nonce is fatal', () {
      final Set<String> seen = <String>{};
      for (int i = 0; i < 2000; i++) {
        final Uint8List n = EncryptedFileFormat.nonceForBlock(nonce(), i);
        expect(n.length, 12);
        expect(seen.add(n.join(',')), isTrue, reason: 'nonce repeated at $i');
      }
    });

    test('block 0 is the file nonce unchanged', () {
      expect(EncryptedFileFormat.nonceForBlock(nonce(), 0), nonce());
    });
  });

  group('header', () {
    test('round-trips the file nonce', () {
      final Uint8List header = EncryptedFileFormat.buildHeader(nonce());
      expect(header.length, 24);
      expect(EncryptedFileFormat.readNonce(header), nonce());
    });

    test('rejects a foreign container', () {
      final Uint8List header = EncryptedFileFormat.buildHeader(nonce());
      header[0] = 0x00;
      expect(
        () => EncryptedFileFormat.readNonce(header),
        throwsA(isA<FormatException>()),
      );
    });

    test('rejects a truncated header', () {
      expect(
        () => EncryptedFileFormat.readNonce(Uint8List(10)),
        throwsA(isA<FormatException>()),
      );
    });

    test('rejects a future container version', () {
      final Uint8List header = EncryptedFileFormat.buildHeader(nonce());
      header[4] = 2;
      expect(
        () => EncryptedFileFormat.readNonce(header),
        throwsA(isA<FormatException>()),
      );
    });
  });
}
