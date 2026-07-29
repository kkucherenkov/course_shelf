import 'dart:io';
import 'dart:math';
import 'dart:typed_data';

import 'package:cryptography/cryptography.dart';

import 'package:app_mobile/features/downloads/domain/encrypted_file_format.dart';

/// Append-only writer for the `.csdl` container.
///
/// Buffers incoming bytes and seals them one whole block at a time. A partial
/// block is never written, which is what makes an app kill mid-block harmless:
/// the file always ends on a block boundary, so there is nothing to repair.
class ChunkedGcmWriter {
  ChunkedGcmWriter._({
    required RandomAccessFile handle,
    required SecretKey secretKey,
    required Uint8List fileNonce,
    required int committedBlocks,
  }) : _handle = handle,
       _secretKey = secretKey,
       _fileNonce = fileNonce,
       _committedBlocks = committedBlocks;

  static final AesGcm _algorithm = AesGcm.with256bits();

  final RandomAccessFile _handle;
  final SecretKey _secretKey;
  final Uint8List _fileNonce;
  final BytesBuilder _buffer = BytesBuilder(copy: false);

  int _committedBlocks;
  bool _finished = false;

  /// Plaintext bytes sealed to disk so far. Always a whole multiple of
  /// [EncryptedFileFormat.blockSize] until [finish] runs.
  int get committedPlaintextBytes =>
      _committedBlocks * EncryptedFileFormat.blockSize;

  /// Starts a new container: writes the 24-byte header with a fresh random
  /// nonce, positioned to append block 0.
  static Future<ChunkedGcmWriter> create({
    required File file,
    required Uint8List key,
  }) async {
    final Random random = Random.secure();
    final Uint8List fileNonce = Uint8List.fromList(
      List<int>.generate(
        EncryptedFileFormat.nonceLength,
        (_) => random.nextInt(256),
      ),
    );

    await file.parent.create(recursive: true);
    final RandomAccessFile handle = await file.open(mode: FileMode.write);
    await handle.writeFrom(EncryptedFileFormat.buildHeader(fileNonce));

    return ChunkedGcmWriter._(
      handle: handle,
      secretKey: SecretKey(key),
      fileNonce: fileNonce,
      committedBlocks: 0,
    );
  }

  /// Reopens an existing container to continue after [committedPlaintextBytes].
  ///
  /// The Drift row is the source of truth, so the file is **truncated down** to
  /// the length that byte count implies. If the file ran ahead — a crash
  /// between a block write and the next 4 MiB flush — the excess is discarded
  /// and re-fetched. That is at most 4 MiB, and it is what removes the "is the
  /// file ahead of the row?" question entirely.
  static Future<ChunkedGcmWriter> resume({
    required File file,
    required Uint8List key,
    required int committedPlaintextBytes,
  }) async {
    if (committedPlaintextBytes % EncryptedFileFormat.blockSize != 0) {
      throw ArgumentError.value(
        committedPlaintextBytes,
        'committedPlaintextBytes',
        'must be a whole number of ${EncryptedFileFormat.blockSize}-byte blocks',
      );
    }

    final RandomAccessFile handle = await file.open(mode: FileMode.append);
    final Uint8List header = Uint8List(EncryptedFileFormat.headerLength);
    await handle.setPosition(0);
    await handle.readInto(header);
    final Uint8List fileNonce = EncryptedFileFormat.readNonce(header);

    final int blocks = EncryptedFileFormat.wholeBlocksIn(
      committedPlaintextBytes,
    );
    await handle.truncate(EncryptedFileFormat.storedLengthFor(blocks));
    await handle.setPosition(EncryptedFileFormat.storedLengthFor(blocks));

    return ChunkedGcmWriter._(
      handle: handle,
      secretKey: SecretKey(key),
      fileNonce: fileNonce,
      committedBlocks: blocks,
    );
  }

  /// Buffers [chunk] and seals every whole block it completes.
  Future<void> add(List<int> chunk) async {
    if (_finished) {
      throw StateError('Writer already finished');
    }
    _buffer.add(chunk);
    while (_buffer.length >= EncryptedFileFormat.blockSize) {
      final Uint8List pending = _buffer.takeBytes();
      int consumed = 0;
      while (pending.length - consumed >= EncryptedFileFormat.blockSize) {
        await _seal(
          Uint8List.sublistView(
            pending,
            consumed,
            consumed + EncryptedFileFormat.blockSize,
          ),
        );
        consumed += EncryptedFileFormat.blockSize;
      }
      if (consumed < pending.length) {
        _buffer.add(Uint8List.sublistView(pending, consumed));
      }
    }
  }

  /// Seals whatever partial block remains and returns the container's total
  /// plaintext length. Call exactly once, when the HTTP body ends.
  Future<int> finish() async {
    if (_finished) {
      throw StateError('Writer already finished');
    }
    final Uint8List tail = _buffer.takeBytes();
    int total = committedPlaintextBytes;
    if (tail.isNotEmpty) {
      await _seal(tail);
      // _seal counted a whole block; correct to the real tail length.
      total =
          (_committedBlocks - 1) * EncryptedFileFormat.blockSize +
          tail.length;
    }
    _finished = true;
    await _handle.flush();
    return total;
  }

  Future<void> close() => _handle.close();

  Future<void> _seal(Uint8List block) async {
    final SecretBox box = await _algorithm.encrypt(
      block,
      secretKey: _secretKey,
      nonce: EncryptedFileFormat.nonceForBlock(_fileNonce, _committedBlocks),
    );
    await _handle.writeFrom(box.cipherText);
    await _handle.writeFrom(box.mac.bytes);
    _committedBlocks++;
  }
}
