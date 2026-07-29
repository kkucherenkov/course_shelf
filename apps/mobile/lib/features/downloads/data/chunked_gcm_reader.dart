import 'dart:io';
import 'dart:math';
import 'dart:typed_data';

import 'package:cryptography/cryptography.dart';

import 'package:app_mobile/features/downloads/domain/encrypted_file_format.dart';

/// Random-access reader for the `.csdl` container.
///
/// Decrypts only the blocks a requested range actually touches, which is what
/// lets `video_player` seek through an encrypted file at all. A whole-file GCM
/// blob would have to be decrypted from byte 0 for every seek.
class ChunkedGcmReader {
  ChunkedGcmReader._({
    required RandomAccessFile handle,
    required SecretKey secretKey,
    required Uint8List fileNonce,
    required this.plaintextLength,
  }) : _handle = handle,
       _secretKey = secretKey,
       _fileNonce = fileNonce;

  static final AesGcm _algorithm = AesGcm.with256bits();

  final RandomAccessFile _handle;
  final SecretKey _secretKey;
  final Uint8List _fileNonce;

  /// Total decrypted length of the container.
  final int plaintextLength;

  static Future<ChunkedGcmReader> open({
    required File file,
    required Uint8List key,
  }) async {
    final RandomAccessFile handle = await file.open();
    try {
      final Uint8List header = Uint8List(EncryptedFileFormat.headerLength);
      await handle.readInto(header);
      // Throws FormatException on a bad magic or an unknown version.
      final Uint8List fileNonce = EncryptedFileFormat.readNonce(header);

      return ChunkedGcmReader._(
        handle: handle,
        secretKey: SecretKey(key),
        fileNonce: fileNonce,
        plaintextLength: EncryptedFileFormat.plaintextLengthFor(
          await file.length(),
        ),
      );
    } catch (_) {
      await handle.close();
      rethrow;
    }
  }

  /// Plaintext bytes `[offset, offset + length)`, clamped to the end of the
  /// container.
  Future<Uint8List> read(int offset, int length) async {
    final int end = min(offset + length, plaintextLength);
    if (offset >= plaintextLength || end <= offset) return Uint8List(0);

    final int firstBlock = EncryptedFileFormat.blockIndexAt(offset);
    final int lastBlock = EncryptedFileFormat.blockIndexAt(end - 1);
    final BytesBuilder out = BytesBuilder(copy: false);

    for (int index = firstBlock; index <= lastBlock; index++) {
      final Uint8List block = await _decryptBlock(index);
      final int blockStart = index * EncryptedFileFormat.blockSize;
      final int from = index == firstBlock ? offset - blockStart : 0;
      final int to = index == lastBlock ? end - blockStart : block.length;
      out.add(Uint8List.sublistView(block, from, to));
    }

    return out.takeBytes();
  }

  Future<void> close() => _handle.close();

  Future<Uint8List> _decryptBlock(int index) async {
    final int blockStart = index * EncryptedFileFormat.blockSize;
    final int plaintextInBlock = min(
      EncryptedFileFormat.blockSize,
      plaintextLength - blockStart,
    );

    await _handle.setPosition(EncryptedFileFormat.storedOffsetOf(index));
    final Uint8List cipherText = Uint8List(plaintextInBlock);
    await _handle.readInto(cipherText);
    final Uint8List mac = Uint8List(EncryptedFileFormat.tagLength);
    await _handle.readInto(mac);

    // Throws SecretBoxAuthenticationError if this block was tampered with or
    // truncated. Per-block tags mean the damage is scoped to this block, not
    // the whole download.
    final List<int> clear = await _algorithm.decrypt(
      SecretBox(
        cipherText,
        nonce: EncryptedFileFormat.nonceForBlock(_fileNonce, index),
        mac: Mac(mac),
      ),
      secretKey: _secretKey,
    );
    return Uint8List.fromList(clear);
  }
}
