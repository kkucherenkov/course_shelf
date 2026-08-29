import 'package:app_mobile/features/downloads/domain/download_item.dart';

/// Port — the download queue as the BLoC sees it.
/// A lesson to enqueue, with the names the queue row will keep.
///
/// The titles travel with the request because there is nothing to look them up
/// from later — see `DownloadedLessons.lessonTitle`.
class DownloadRequest {
  const DownloadRequest({
    required this.lessonId,
    this.lessonTitle,
    this.courseTitle,
  });

  final String lessonId;
  final String? lessonTitle;
  final String? courseTitle;
}

abstract class DownloadsRepository {
  Future<void> enqueueLesson(
    String lessonId, {
    String? courseId,
    String? lessonTitle,
    String? courseTitle,
  });

  /// Enqueues every lesson of a course that is not already `ready`.
  Future<void> enqueueCourse(String courseId, List<DownloadRequest> lessons);

  Future<void> pause(String lessonId);
  Future<void> resume(String lessonId);

  /// Deletes the row and its partial file — cancel has no terminal state
  /// because there is nothing left to resume from.
  Future<void> cancel(String lessonId);

  Future<void> retry(String lessonId);

  /// Called once at startup (and from the background resume task). Any row
  /// left `downloading` by an app kill is re-queued and the pump kicked;
  /// nothing was committed mid-block, so no file repair is needed — only
  /// resuming the transfer.
  Future<void> reconcileAfterRestart();

  /// Runs the queue until nothing is eligible, then completes.
  ///
  /// On the port because a background-fetch handler must **await** it before
  /// reporting completion to the OS, and that handler only ever sees this
  /// interface — it resolves `getIt<DownloadsRepository>()` in a fresh isolate
  /// with no access to the concrete class. [reconcileAfterRestart] only
  /// relabels rows and kicks the pump, so returning right after it ends the
  /// background execution session while the transfer it just started is still
  /// in flight and the OS tears the isolate down mid-download.
  ///
  /// Doubles as the seam that lets a test await the pump instead of polling.
  Future<void> drain();

  /// High-frequency progress for the active item plus the persisted rest.
  Stream<List<DownloadItem>> watchAll();

  Stream<DownloadItem?> watch(String lessonId);
}
