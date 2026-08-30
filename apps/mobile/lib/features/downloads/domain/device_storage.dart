import 'package:equatable/equatable.dart';

/// The device's own free-space reading, as the storage bar needs it.
///
/// The value is **bytes**. The platform plugin reports megabytes; the
/// conversion happens once, in the adapter, so nothing above this line has to
/// remember which unit it is holding.
///
/// Note what is *not* here: how much CourseShelf itself is using. That is the
/// sum of the queue's own rows, which `DownloadsState` already computes —
/// carrying it here too would be two sources for one number.
///
/// Also not here: total device capacity. It was removed (#305) — the bar had
/// no honest way to use it. "{used} of {total} free" read as if `used` were
/// contained in `total`, but `total` was fed `deviceFreeBytes`, and a real
/// device total would have made the caption claim CourseShelf's usage is
/// carved out of the device's free space rather than out of its full
/// capacity. Nothing needs it for anything else, so it is gone rather than
/// kept unread beside its own bug.
class StorageSnapshot extends Equatable {
  const StorageSnapshot({this.deviceFreeBytes});

  /// Free space on the device, or `null` when the platform did not answer.
  final int? deviceFreeBytes;

  /// Whether the bar can show the free-space reading rather than just
  /// CourseShelf's own figure.
  bool get hasDeviceFree => deviceFreeBytes != null;

  @override
  List<Object?> get props => <Object?>[deviceFreeBytes];
}

/// Port — device storage capacity, as the downloads surface sees it.
///
/// Exists so the bloc never touches a platform channel: the fake in tests is a
/// two-line class, and a plugin swap is one adapter.
abstract class DeviceStorage {
  /// Free capacity in bytes, or `null` when the platform did not answer.
  ///
  /// Implementations must **not** throw: a storage bar is decoration, and a
  /// plugin that fails on some OS version must not take the whole Downloads
  /// tab down with it. Return null instead.
  Future<int?> read();
}
