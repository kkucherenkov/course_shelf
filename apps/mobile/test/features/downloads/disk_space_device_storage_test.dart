/// Unit tests for DiskSpaceDeviceStorage.
///
/// The adapter is four lines of arithmetic and one try/catch, and both matter:
///
///   1. The plugin reports **megabytes** (undocumented on pub.dev — confirmed
///      from its own example, which labels the values "(MB)"). Getting the
///      conversion wrong scales the whole storage bar by 2^20.
///   2. It must never throw. The bar is decoration; a MissingPluginException on
///      an unsupported platform must degrade to "no device totals", not take
///      the Downloads tab down.
library;

import 'package:disk_space_plus/disk_space_plus.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:app_mobile/features/downloads/data/disk_space_device_storage.dart';

class _FakePlugin implements DiskSpacePlus {
  _FakePlugin({this.free, this.total, this.throws = false});

  final double? free;
  final double? total;
  final bool throws;

  @override
  Future<double?> get getFreeDiskSpace async {
    if (throws) throw StateError('no platform implementation');
    return free;
  }

  @override
  Future<double?> get getTotalDiskSpace async {
    if (throws) throw StateError('no platform implementation');
    return total;
  }

  @override
  Future<double?> getFreeDiskSpaceForPath(String path) async => free;

  @override
  Future<String?> getPlatformVersion() async => 'fake';
}

void main() {
  test('converts the plugin megabytes to bytes', () async {
    final storage = DiskSpaceDeviceStorage(
      plugin: _FakePlugin(free: 1024, total: 65536),
    );

    final reading = await storage.read();

    expect(reading.freeBytes, 1024 * 1024 * 1024);
    expect(reading.totalBytes, 65536 * 1024 * 1024);
  });

  test('rounds a fractional megabyte reading', () async {
    final storage = DiskSpaceDeviceStorage(
      plugin: _FakePlugin(free: 1.5, total: 2.5),
    );

    final reading = await storage.read();

    expect(reading.freeBytes, (1.5 * 1024 * 1024).round());
    expect(reading.totalBytes, (2.5 * 1024 * 1024).round());
  });

  test('passes a null reading through rather than inventing a zero', () async {
    final storage = DiskSpaceDeviceStorage(plugin: _FakePlugin());

    final reading = await storage.read();

    expect(reading.freeBytes, isNull);
    expect(reading.totalBytes, isNull);
  });

  test('rejects a negative or non-finite reading', () async {
    final storage = DiskSpaceDeviceStorage(
      plugin: _FakePlugin(free: -1, total: double.infinity),
    );

    final reading = await storage.read();

    expect(reading.freeBytes, isNull);
    expect(reading.totalBytes, isNull);
  });

  test('degrades to nulls when the platform throws', () async {
    final storage = DiskSpaceDeviceStorage(plugin: _FakePlugin(throws: true));

    // The assertion is that this returns at all.
    final reading = await storage.read();

    expect(reading.freeBytes, isNull);
    expect(reading.totalBytes, isNull);
  });
}
