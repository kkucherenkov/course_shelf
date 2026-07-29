import 'package:app_mobile/features/downloads/domain/download_scheduler_port.dart';

/// Unique name for the OS-side resume task.
const String kDownloadResumeTask = 'course-shelf.downloads.resume';

/// [DownloadSchedulerPort] backed by whatever the platform offers.
///
/// The platform calls are injected rather than imported directly so this class
/// is testable on a host with no Android or iOS toolchain. `main.dart` supplies
/// the real `workmanager` closures; a test supplies counters.
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
    } on Exception {
      // Swallowed by design. A platform that will not register background work
      // (an OS refusal, a missing plugin, a desktop host) must not fail the
      // enqueue: the foreground pump and resume-on-launch still complete the
      // download. Rethrowing would turn an optimization into a hard dependency.
      //
      // Deliberately `on Exception`, not `on Object`: an `Error` means this
      // app's own wiring is broken, and that must surface rather than
      // masquerade as background scheduling being unavailable.
    }
  }

  @override
  Future<void> cancelAll() async {
    try {
      await _cancel();
    } on Exception {
      // Same rationale as ensureScheduled: a platform that refuses to cancel
      // must not fail the queue. Only platform exceptions are swallowed; errors
      // indicating wiring bugs must surface for debugging.
    }
  }
}
