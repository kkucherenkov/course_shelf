import 'dart:async';
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
///
/// [add] and [finish] are safe to call without awaiting each call in turn
/// (e.g. `stream.listen(writer.add)`): calls are serialized internally on an
/// internal queue, so two seals never race on the block counter that derives
/// each block's nonce. Nonce reuse under one key is the one failure AES-GCM
/// does not survive.
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

  /// The real plaintext total once [finish] has run. `_seal` always counts a
  /// whole block, including a short final one, so [committedPlaintextBytes]
  /// would over-report after [finish] without this cached correction.
  int? _finalPlaintextBytes;

  /// Serializes [add]/[finish] bodies so concurrent, un-awaited calls cannot
  /// both read `_committedBlocks` before either increments it.
  Future<void> _writeLock = Future<void>.value();

  /// Plaintext bytes sealed to disk so far. A whole multiple of
  /// [EncryptedFileFormat.blockSize] until [finish] runs; from then on it is
  /// the exact total [finish] returned, tail included.
  int get committedPlaintextBytes =>
      _finalPlaintextBytes ?? _committedBlocks * EncryptedFileFormat.blockSize;

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
    try {
      await handle.writeFrom(EncryptedFileFormat.buildHeader(fileNonce));
    } catch (_) {
      await handle.close();
      rethrow;
    }

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
  ///
  /// Truncation only ever removes bytes. If the file is *shorter* than
  /// [committedPlaintextBytes] implies — Drift's fsync can land before the
  /// `.csdl` write reaches disk across a power cut — this throws instead of
  /// letting `RandomAccessFile.truncate` zero-extend the file: a zero-filled
  /// tail would be a structurally valid container that fails its MAC only at
  /// playback, with no repair path, so the row would never re-fetch it.
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
    try {
      final Uint8List header = Uint8List(EncryptedFileFormat.headerLength);
      await handle.setPosition(0);
      await handle.readInto(header);
      final Uint8List fileNonce = EncryptedFileFormat.readNonce(header);

      final int blocks = EncryptedFileFormat.wholeBlocksIn(
        committedPlaintextBytes,
      );
      final int requiredLength = EncryptedFileFormat.storedLengthFor(blocks);
      final int actualLength = await handle.length();
      if (actualLength < requiredLength) {
        throw FormatException(
          'Container file is $actualLength bytes, shorter than the '
          '$requiredLength bytes the committed row implies — the file is '
          'truncated below what was recorded and cannot be resumed',
        );
      }
      await handle.truncate(requiredLength);
      await handle.setPosition(requiredLength);

      return ChunkedGcmWriter._(
        handle: handle,
        secretKey: SecretKey(key),
        fileNonce: fileNonce,
        committedBlocks: blocks,
      );
    } catch (_) {
      await handle.close();
      rethrow;
    }
  }

  /// Buffers [chunk] and seals every whole block it completes.
  ///
  /// Safe to call without awaiting each call before the next (see the class
  /// doc): the body runs on [_writeLock], so a second call queued while the
  /// first is still mid-`await` in [_seal] runs only after the first's block
  /// counter increment has landed.
  Future<void> add(List<int> chunk) => _serialized(() async {
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
  });

  /// Seals whatever partial block remains and returns the container's total
  /// plaintext length. Call exactly once, when the HTTP body ends.
  Future<int> finish() => _serialized(() async {
    if (_finished) {
      throw StateError('Writer already finished');
    }
    final Uint8List tail = _buffer.takeBytes();
    int total = committedPlaintextBytes;
    if (tail.isNotEmpty) {
      await _seal(tail);
      // _seal counted a whole block; correct to the real tail length.
      total =
          (_committedBlocks - 1) * EncryptedFileFormat.blockSize + tail.length;
    }
    _finalPlaintextBytes = total;
    _finished = true;
    await _handle.flush();
    return total;
  });

  Future<void> close() => _handle.close();

  /// Runs [action] after every previously queued [add]/[finish] call has
  /// settled — success or failure — so calls issued without awaiting each
  /// other still execute, and seal, one at a time.
  Future<T> _serialized<T>(Future<T> Function() action) {
    final Future<void> previous = _writeLock;
    final Completer<void> released = Completer<void>();
    _writeLock = released.future;
    final Future<T> result = previous.then((_) => action());
    result.whenComplete(released.complete);
    return result;
  }

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
