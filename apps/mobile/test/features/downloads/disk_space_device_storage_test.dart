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
///
/// The last group renders [StorageBar] from what the stubbed plugin returned,
/// so the megabyte conversion and the degrade path are asserted against what a
/// user actually sees rather than against a hand-built [StorageSnapshot]. The
/// stub is `disk_space_plus`'s Dart interface — the native implementations
/// behind it are still unexercised in CI (issue #280); these tests do not and
/// cannot cover them.
library;

import 'package:app_ui/app_ui.dart';
import 'package:disk_space_plus/disk_space_plus.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:app_mobile/features/downloads/data/disk_space_device_storage.dart';
import 'package:app_mobile/features/downloads/domain/device_storage.dart';
import 'package:app_mobile/features/downloads/presentation/widgets/storage_bar.dart';
import 'package:app_mobile/i18n/strings.g.dart';

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

  group('StorageBar over the stubbed plugin', () {
    Future<void> pumpBar(
      WidgetTester tester, {
      required DiskSpacePlus plugin,
      required int appUsedBytes,
    }) async {
      final reading = await DiskSpaceDeviceStorage(plugin: plugin).read();

      await tester.pumpWidget(
        TranslationProvider(
          child: MaterialApp(
            theme: AppTheme.dark(),
            home: Scaffold(
              body: StorageBar(
                appUsedBytes: appUsedBytes,
                snapshot: StorageSnapshot(
                  deviceFreeBytes: reading.freeBytes,
                  deviceTotalBytes: reading.totalBytes,
                ),
              ),
            ),
          ),
        ),
      );
    }

    testWidgets('renders the plugin reading as the full caption and legend', (
      tester,
    ) async {
      // 8192 MB free of 65536 MB — the bar must show GB, not the raw figures.
      await pumpBar(
        tester,
        plugin: _FakePlugin(free: 8192, total: 65536),
        appUsedBytes: 1024 * 1024,
      );

      expect(find.text('1.0 MB of 8.0 GB free'), findsOneWidget);
      expect(find.text('Other apps'), findsOneWidget);
      expect(find.text('Free'), findsOneWidget);
    });

    testWidgets('falls back to our own usage when the plugin throws', (
      tester,
    ) async {
      await pumpBar(
        tester,
        plugin: _FakePlugin(throws: true),
        appUsedBytes: 2 * 1024 * 1024,
      );

      expect(find.text('CourseShelf is using 2.0 MB'), findsOneWidget);
      // No denominator, so no three-segment legend to explain.
      expect(find.text('Other apps'), findsNothing);
    });
  });
}
