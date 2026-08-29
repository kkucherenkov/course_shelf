import 'package:equatable/equatable.dart';

/// The device's own capacity reading, as the storage bar needs it.
///
/// Both values are **bytes**. The platform plugin reports megabytes; the
/// conversion happens once, in the adapter, so nothing above this line has to
/// remember which unit it is holding.
///
/// Note what is *not* here: how much CourseShelf itself is using. That is the
/// sum of the queue's own rows, which `DownloadsState` already computes —
/// carrying it here too would be two sources for one number.
class StorageSnapshot extends Equatable {
  const StorageSnapshot({this.deviceFreeBytes, this.deviceTotalBytes});

  /// Free space on the device, or `null` when the platform did not answer.
  final int? deviceFreeBytes;

  /// Total device capacity, or `null` when the platform did not answer.
  final int? deviceTotalBytes;

  /// Whether the bar can show the full "x of y" reading rather than just
  /// CourseShelf's own figure.
  bool get hasDeviceTotals =>
      deviceFreeBytes != null && deviceTotalBytes != null;

  /// Space used by everything that is not CourseShelf, given what CourseShelf
  /// is holding. `null` unless both device numbers are known.
  int? otherUsedBytes(int appUsedBytes) {
    final int? total = deviceTotalBytes;
    final int? free = deviceFreeBytes;
    if (total == null || free == null) return null;
    // Clamped: the two platform readings are taken a moment apart, and on a
    // busy device that can make the remainder come out fractionally negative.
    final int other = total - free - appUsedBytes;
    return other < 0 ? 0 : other;
  }

  @override
  List<Object?> get props => <Object?>[deviceFreeBytes, deviceTotalBytes];
}

/// Port — device storage capacity, as the downloads surface sees it.
///
/// Exists so the bloc never touches a platform channel: the fake in tests is a
/// two-line class, and a plugin swap is one adapter.
abstract class DeviceStorage {
  /// Free and total capacity in bytes.
  ///
  /// Implementations must **not** throw: a storage bar is decoration, and a
  /// plugin that fails on some OS version must not take the whole Downloads
  /// tab down with it. Return nulls instead.
  Future<({int? freeBytes, int? totalBytes})> read();
}
