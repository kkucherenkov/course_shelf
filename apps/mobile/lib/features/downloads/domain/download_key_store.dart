import 'dart:typed_data';

/// Port — supplies the device-bound AES-256 key that encrypts every download.
///
/// Deliberately not a Drift column. `downloaded_lessons` stores the per-file
/// nonce and nothing else: a key stored beside its own ciphertext is not
/// encryption.
abstract class DownloadKeyStore {
  /// 32 bytes. Generated on first use and stable for the install's lifetime.
  Future<Uint8List> keyForDevice();
}
