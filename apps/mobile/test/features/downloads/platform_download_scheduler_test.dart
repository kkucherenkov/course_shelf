import 'package:flutter/services.dart'
    show MissingPluginException, PlatformException;
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

  test('a platform refusal to register never propagates', () async {
    final DownloadSchedulerPort scheduler = PlatformDownloadScheduler(
      register: () async => throw PlatformException(
        code: '1',
        message: 'BGTaskScheduler refused the identifier',
      ),
      cancel: () async {},
    );

    // Background scheduling is opportunistic. Foreground download plus
    // resume-on-launch already guarantee completion, so a platform that refuses
    // to register must not take the queue down with it. It is logged rather
    // than silent — see `_logRefusal`.
    await expectLater(scheduler.ensureScheduled(), completes);
  });

  test('a missing plugin implementation never propagates', () async {
    final DownloadSchedulerPort scheduler = PlatformDownloadScheduler(
      register: () async =>
          throw MissingPluginException('no implementation for workmanager'),
      cancel: () async {},
    );

    // A host with no workmanager implementation at all (desktop, a widget
    // test) is the same class of "the platform cannot do this" as a refusal.
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

  test('a platform refusal to cancel never propagates', () async {
    final DownloadSchedulerPort scheduler = PlatformDownloadScheduler(
      register: () async {},
      cancel: () async =>
          throw PlatformException(code: '99', message: 'unsupported'),
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

  test('a plain Exception surfaces rather than being swallowed', () async {
    final DownloadSchedulerPort scheduler = PlatformDownloadScheduler(
      register: () async => throw Exception('not a platform refusal'),
      cancel: () async {},
    );

    // The catch is narrowed to genuine platform refusals. Anything else — an
    // `UnsupportedError` from asking a platform for a task it does not
    // implement, a bug in the closure the injector supplies — used to be
    // indistinguishable from "background scheduling is unavailable" and
    // vanished. It must propagate now.
    await expectLater(
      scheduler.ensureScheduled(),
      throwsA(
        isA<Exception>().having(
          (Exception e) => e.toString(),
          'message',
          contains('not a platform refusal'),
        ),
      ),
    );
  });

  test('a non-refusal error from cancelAll surfaces too', () async {
    final DownloadSchedulerPort scheduler = PlatformDownloadScheduler(
      register: () async {},
      cancel: () async => throw UnsupportedError('not on this platform'),
    );

    await expectLater(scheduler.cancelAll(), throwsUnsupportedError);
  });
}
