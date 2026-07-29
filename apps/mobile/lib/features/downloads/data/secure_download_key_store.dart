import 'dart:convert';
import 'dart:math';
import 'dart:typed_data';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import 'package:app_mobile/features/downloads/domain/download_key_store.dart';

/// [DownloadKeyStore] over `flutter_secure_storage` — Keystore on Android,
/// Keychain on iOS. Mirrors the constructor seam of `SecureTokenStorage` so a
/// test can inject a fake; the plugin has no implementation under
/// `flutter test`.
class SecureDownloadKeyStore implements DownloadKeyStore {
  SecureDownloadKeyStore([FlutterSecureStorage? storage])
    : _storage = storage ?? const FlutterSecureStorage(iOptions: _iosOptions);

  /// A `BGAppRefreshTask` can fire while the device is locked. The package
  /// default is `KeychainAccessibility.unlocked`, which would make the key
  /// unreadable exactly then — the download would stall with no error and no
  /// way to diagnose it from Dart. `first_unlock` keeps it readable after the
  /// first unlock following a reboot, which is what background resume needs.
  static const IOSOptions _iosOptions = IOSOptions(
    accessibility: KeychainAccessibility.first_unlock,
  );

  static const String _storageKey = 'download_master_key_v1';
  static const int _keyLengthBytes = 32;

  final FlutterSecureStorage _storage;
  final Random _random = Random.secure();

  @override
  Future<Uint8List> keyForDevice() async {
    final String? existing = await _storage.read(key: _storageKey);
    if (existing != null) {
      final Uint8List decoded = base64Decode(existing);
      if (decoded.length == _keyLengthBytes) return decoded;
      // A wrong-length value can only come from a corrupted store. Regenerating
      // orphans any file encrypted under the old key — those rows fail their
      // tag check and are re-marked `failed`, which is recoverable. Refusing to
      // generate would instead break every future download forever.
    }

    final Uint8List fresh = Uint8List.fromList(
      List<int>.generate(_keyLengthBytes, (_) => _random.nextInt(256)),
    );
    await _storage.write(key: _storageKey, value: base64Encode(fresh));
    return fresh;
  }
}
