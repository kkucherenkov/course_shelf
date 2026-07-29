import 'package:flutter_test/flutter_test.dart';

import 'package:app_mobile/features/downloads/data/platform_download_scheduler.dart';
import 'package:app_mobile/features/downloads/domain/download_scheduler_port.dart';

void main() {
  test('ensureScheduled registers exactly once per call', () async {
    int registered = 0;
    final DownloadSchedulerPort scheduler = PlatformDownloadScheduler(
      register: () async => registered++,
      cancel: () async {},
    );

    await scheduler.ensureScheduled();
    expect(registered, 1);
  });

  test('a registration failure never propagates', () async {
    final DownloadSchedulerPort scheduler = PlatformDownloadScheduler(
      register: () async => throw Exception('no platform channel'),
      cancel: () async {},
    );

    // Background scheduling is opportunistic. Foreground download plus
    // resume-on-launch already guarantee completion, so a platform that refuses
    // to register must not take the queue down with it.
    await expectLater(scheduler.ensureScheduled(), completes);
  });

  test('cancelAll delegates to the platform', () async {
    int cancelled = 0;
    final DownloadSchedulerPort scheduler = PlatformDownloadScheduler(
      register: () async {},
      cancel: () async => cancelled++,
    );

    await scheduler.cancelAll();
    expect(cancelled, 1);
  });

  test('a cancellation failure never propagates', () async {
    final DownloadSchedulerPort scheduler = PlatformDownloadScheduler(
      register: () async {},
      cancel: () async => throw Exception('no platform channel'),
    );

    // Same rationale as ensureScheduled: background scheduling is opportunistic,
    // so a platform that refuses to cancel must not fail the queue.
    await expectLater(scheduler.cancelAll(), completes);
  });

  test('a programming error surfaces rather than being swallowed', () async {
    final DownloadSchedulerPort scheduler = PlatformDownloadScheduler(
      register: () async => throw StateError('wiring bug'),
      cancel: () async {},
    );

    // Errors indicate this app's wiring is broken, not that the platform
    // refused. They must surface so breakage is caught in testing.
    await expectLater(scheduler.ensureScheduled(), throwsStateError);
  });
}
