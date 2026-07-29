import 'package:app_mobile/features/downloads/domain/download_item.dart';

/// Port — the download queue as the BLoC sees it.
abstract class DownloadsRepository {
  Future<void> enqueueLesson(String lessonId, {String? courseId});

  /// Enqueues every lesson of a course that is not already `ready`.
  Future<void> enqueueCourse(String courseId, List<String> lessonIds);

  Future<void> pause(String lessonId);
  Future<void> resume(String lessonId);

  /// Deletes the row and its partial file — cancel has no terminal state
  /// because there is nothing left to resume from.
  Future<void> cancel(String lessonId);

  Future<void> retry(String lessonId);

  /// Called once at startup. Any row left `downloading` by an app kill is
  /// reconciled to `paused`; nothing was committed mid-block, so no file
  /// repair is needed.
  Future<void> reconcileAfterRestart();

  /// High-frequency progress for the active item plus the persisted rest.
  Stream<List<DownloadItem>> watchAll();

  Stream<DownloadItem?> watch(String lessonId);
}
