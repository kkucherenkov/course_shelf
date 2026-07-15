import 'package:drift/drift.dart';

import 'package:app_mobile/shared/db/app_database.dart';
import 'package:app_mobile/shared/db/tables/downloaded_lessons.dart';

part 'downloads_dao.g.dart';

/// Reads and writes download state.
///
/// Holds no key material: E19 keeps the device-bound AES key in secure storage.
@DriftAccessor(tables: [DownloadedLessons])
class DownloadsDao extends DatabaseAccessor<AppDatabase>
    with _$DownloadsDaoMixin {
  DownloadsDao(super.db);

  Future<void> upsert(DownloadedLessonsCompanion entry) =>
      into(downloadedLessons).insertOnConflictUpdate(entry);

  Future<DownloadedLesson?> byLessonId(String lessonId) =>
      (select(downloadedLessons)..where((t) => t.lessonId.equals(lessonId)))
          .getSingleOrNull();

  Future<List<DownloadedLesson>> byState(DownloadState state) =>
      (select(downloadedLessons)..where((t) => t.state.equalsValue(state)))
          .get();

  /// E19's per-item progress stream.
  Stream<DownloadedLesson?> watch(String lessonId) =>
      (select(downloadedLessons)..where((t) => t.lessonId.equals(lessonId)))
          .watchSingleOrNull();

  /// Cancel deletes the row — there is no terminal `cancelled` state because
  /// there is nothing left to resume from.
  Future<void> remove(String lessonId) =>
      (delete(downloadedLessons)..where((t) => t.lessonId.equals(lessonId)))
          .go();
}
