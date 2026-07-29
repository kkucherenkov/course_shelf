import 'dart:developer' as developer;

import 'package:flutter/services.dart'
    show MissingPluginException, PlatformException;

import 'package:app_mobile/features/downloads/domain/download_scheduler_port.dart';

/// Unique name for the OS-side resume task.
///
/// On iOS this string is also a build-time contract: it must appear verbatim
/// in `ios/Runner/Info.plist` under `BGTaskSchedulerPermittedIdentifiers`, and
/// `ios/Runner/AppDelegate.swift` must register a launch handler for it before
/// `didFinishLaunchingWithOptions` returns. `BGTaskScheduler` rejects a submit
/// for an identifier missing either one.
const String kDownloadResumeTask = 'course-shelf.downloads.resume';

/// [DownloadSchedulerPort] backed by whatever the platform offers.
///
/// The platform calls are injected rather than imported directly so this class
/// is testable on a host with no Android or iOS toolchain. The injector
/// supplies the real `workmanager` closures; a test supplies counters.
class PlatformDownloadScheduler implements DownloadSchedulerPort {
  PlatformDownloadScheduler({
    required Future<void> Function() register,
    required Future<void> Function() cancel,
  }) : _register = register,
       _cancel = cancel;

  final Future<void> Function() _register;
  final Future<void> Function() _cancel;

  @override
  Future<void> ensureScheduled() async {
    try {
      await _register();
    } on PlatformException catch (error, stackTrace) {
      _logRefusal('register', error, stackTrace);
    } on MissingPluginException catch (error, stackTrace) {
      _logRefusal('register', error, stackTrace);
    }
  }

  @override
  Future<void> cancelAll() async {
    try {
      await _cancel();
    } on PlatformException catch (error, stackTrace) {
      _logRefusal('cancel', error, stackTrace);
    } on MissingPluginException catch (error, stackTrace) {
      _logRefusal('cancel', error, stackTrace);
    }
  }

  /// A platform refusal must not fail the enqueue: background scheduling is an
  /// optimization, and the foreground pump plus resume-on-launch already
  /// complete the download. A user tapping download on a device that downloads
  /// fine must not see an error because the optimization is unavailable.
  ///
  /// It must not be *silent* either. A misconfigured
  /// `BGTaskSchedulerPermittedIdentifiers`, an unregistered task identifier, a
  /// `Workmanager().initialize` that never ran — all arrive here as a
  /// [PlatformException] and nowhere else, and background resume would
  /// otherwise be permanently and invisibly dead.
  ///
  /// Only those two are caught. Anything else — a [StateError], a
  /// [TypeError], an `UnsupportedError` from asking a platform for a task it
  /// does not implement — means this app's own wiring is wrong, and propagates
  /// so it surfaces in testing rather than masquerading as the platform
  /// declining.
  void _logRefusal(String operation, Object error, StackTrace stackTrace) {
    developer.log(
      'Background download scheduling unavailable ($operation) — the queue '
      'still completes in the foreground and on next launch',
      error: error,
      stackTrace: stackTrace,
      name: 'PlatformDownloadScheduler',
    );
  }
}
