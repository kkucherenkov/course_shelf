import 'package:disk_space_plus/disk_space_plus.dart';
import 'package:flutter/foundation.dart';

import 'package:app_mobile/features/downloads/domain/device_storage.dart';

/// [DeviceStorage] backed by the `disk_space_plus` plugin.
///
/// **Units.** The plugin returns `double?` and its pub.dev API docs do not say
/// in what. Its own example labels the values `(MB)`, which is where the
/// constant below comes from — it is the single place to change if that ever
/// turns out to be wrong, and the only arithmetic in this file.
///
/// **Never throws.** The storage bar is decoration; a plugin that fails on some
/// OS version, or is simply absent (desktop, tests), must not take the whole
/// Downloads tab with it. Every failure degrades to `null`, and the bar falls
/// back to showing CourseShelf's own usage without the device free space.
class DiskSpaceDeviceStorage implements DeviceStorage {
  DiskSpaceDeviceStorage({DiskSpacePlus? plugin})
    : _plugin = plugin ?? DiskSpacePlus();

  final DiskSpacePlus _plugin;

  /// The plugin reports megabytes. 1 MB = 1024 * 1024 bytes.
  static const int _bytesPerMegabyte = 1024 * 1024;

  @override
  Future<int?> read() async {
    try {
      final double? freeMb = await _plugin.getFreeDiskSpace;
      return _toBytes(freeMb);
    } on Object catch (error) {
      // Deliberately broad: this is a platform channel, and the failure modes
      // are a MissingPluginException on an unsupported platform, a
      // PlatformException from the native side, and whatever a future version
      // adds. None of them are worth a crash, and none of them are actionable
      // beyond "no reading available" — so the message is logged and the stack
      // is not.
      debugPrint('DiskSpaceDeviceStorage: storage unavailable ($error)');
      return null;
    }
  }

  static int? _toBytes(double? megabytes) {
    if (megabytes == null || !megabytes.isFinite || megabytes < 0) return null;
    return (megabytes * _bytesPerMegabyte).round();
  }
}
