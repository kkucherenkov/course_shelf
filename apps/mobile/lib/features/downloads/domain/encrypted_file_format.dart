import 'dart:typed_data';

/// On-disk layout and block arithmetic for the `.csdl` download container.
///
/// ```
/// offset  0  magic     "CSDL"          4B
/// offset  4  version   u8 = 1          1B
/// offset  5  blockSize u32 LE          4B
/// offset  9  fileNonce                 12B
/// offset 21  reserved  zero            3B    -> header = 24B
/// offset 24  block 0: ciphertext(<=blockSize) || tag(16B)
///            block 1: ...                       last block may be short
/// ```
///
/// Deliberately pure: no `dart:io`, no crypto. Every off-by-one between a
/// plaintext offset, a block index, and a file offset is decided here, so it
/// can be tested without a filesystem.
///
/// Whole-file AES-GCM was rejected for this container because it can neither
/// resume across an app kill (GCM cipher state is not persistable) nor support
/// the random access `video_player` performs. Per-block sealing buys both, and
/// localizes corruption to one block instead of the whole download.
abstract final class EncryptedFileFormat {
  /// "CSDL" — Course Shelf DownLoad.
  static const List<int> magic = <int>[0x43, 0x53, 0x44, 0x4C];

  static const int version = 1;

  /// Plaintext bytes per block. 256 KiB keeps tag overhead near 0.006% while
  /// staying small enough that a seek decrypts a trivial amount.
  static const int blockSize = 262144;

  /// AES-GCM authentication tag, appended after each block's ciphertext.
  static const int tagLength = 16;

  /// AES-GCM nonce length.
  static const int nonceLength = 12;

  static const int headerLength = 24;

  /// Bytes a full block occupies on disk, tag included.
  static const int storedBlockLength = blockSize + tagLength;

  static const int _versionOffset = 4;
  static const int _blockSizeOffset = 5;
  static const int _nonceOffset = 9;

  /// Index of the block containing [plaintextOffset].
  static int blockIndexAt(int plaintextOffset) => plaintextOffset ~/ blockSize;

  /// File offset at which block [blockIndex] begins.
  static int storedOffsetOf(int blockIndex) =>
      headerLength + blockIndex * storedBlockLength;

  /// Length of a file holding exactly [blockCount] whole blocks. This is the
  /// truncation target on resume — the file is cut back to match the row.
  static int storedLengthFor(int blockCount) =>
      headerLength + blockCount * storedBlockLength;

  /// Whole blocks represented by [plaintextBytes]. A partial trailing block is
  /// never committed, so it never counts.
  static int wholeBlocksIn(int plaintextBytes) => plaintextBytes ~/ blockSize;

  /// Plaintext length of a container of [storedFileLength] bytes on disk.
  static int plaintextLengthFor(int storedFileLength) {
    final int body = storedFileLength - headerLength;
    if (body <= 0) return 0;
    final int whole = body ~/ storedBlockLength;
    final int remainder = body % storedBlockLength;
    // A remainder is a short final block: its ciphertext is remainder - tag.
    final int tail = remainder > tagLength ? remainder - tagLength : 0;
    return whole * blockSize + tail;
  }

  /// `nonce(i) = fileNonce XOR bigEndian96(i)`.
  ///
  /// Distinct `i` yields a distinct nonce within a file, and the random 96-bit
  /// [fileNonce] separates files. Nonce reuse under one key is the one failure
  /// AES-GCM does not survive, so this is the load-bearing invariant of the
  /// whole container.
  static Uint8List nonceForBlock(Uint8List fileNonce, int blockIndex) {
    if (fileNonce.length != nonceLength) {
      throw const FormatException('Nonce must be 12 bytes');
    }
    final Uint8List out = Uint8List.fromList(fileNonce);
    int remaining = blockIndex;
    for (int i = nonceLength - 1; i >= 0 && remaining != 0; i--) {
      out[i] ^= remaining & 0xFF;
      remaining >>>= 8;
    }
    return out;
  }

  static Uint8List buildHeader(Uint8List fileNonce) {
    if (fileNonce.length != nonceLength) {
      throw const FormatException('Nonce must be 12 bytes');
    }
    final Uint8List header = Uint8List(headerLength);
    header.setRange(0, magic.length, magic);
    header[_versionOffset] = version;
    ByteData.sublistView(
      header,
    ).setUint32(_blockSizeOffset, blockSize, Endian.little);
    header.setRange(_nonceOffset, _nonceOffset + nonceLength, fileNonce);
    // Bytes 21..23 stay zero (reserved).
    return header;
  }

  /// Validates the header and returns its file nonce.
  static Uint8List readNonce(Uint8List header) {
    if (header.length < headerLength) {
      throw const FormatException('Truncated container header');
    }
    for (int i = 0; i < magic.length; i++) {
      if (header[i] != magic[i]) {
        throw const FormatException('Not a CSDL container');
      }
    }
    if (header[_versionOffset] != version) {
      throw FormatException(
        'Unsupported container version ${header[_versionOffset]}',
      );
    }
    return Uint8List.fromList(
      header.sublist(_nonceOffset, _nonceOffset + nonceLength),
    );
  }
}
