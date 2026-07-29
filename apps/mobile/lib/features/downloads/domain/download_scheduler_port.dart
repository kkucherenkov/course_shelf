/// Port — asks the OS for a future opportunity to resume unfinished downloads.
///
/// Intentionally tiny. Android's WorkManager is Doze-constrained and
/// time-capped; iOS's `BGProcessingTask` runs only when the system decides the
/// device is idle and can be interrupted the moment the user picks the phone
/// up, and cannot carry a large transfer at all (that needs a background
/// `URLSession`, which is native code behind a platform channel). So neither
/// platform is asked to *perform* a download — only to wake the app so the
/// queue can resume what is unfinished.
///
/// Foreground download plus resume-on-launch is what actually guarantees
/// completion. This is opportunism layered on top.
abstract class DownloadSchedulerPort {
  Future<void> ensureScheduled();
  Future<void> cancelAll();
}
