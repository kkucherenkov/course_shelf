import 'package:drift/drift.dart';

import 'package:app_mobile/shared/db/app_database.dart';
import 'package:app_mobile/shared/db/tables/downloaded_lessons.dart';

part 'downloads_dao.g.dart';

/// Reads and writes download state.
///
/// Holds no key material: E19 keeps the device-bound AES key in secure storage.
///
/// Unlike outbox DAOs (see [ProgressOutboxDao]), does not normalize `updatedAt`
/// to UTC — no ordering contract exists. If adding `ORDER BY updatedAt`, must
/// normalize: Drift's TEXT datetime encoding makes `ORDER BY` lexicographic.
@DriftAccessor(tables: [DownloadedLessons])
class DownloadsDao extends DatabaseAccessor<AppDatabase>
    with _$DownloadsDaoMixin {
  DownloadsDao(super.db);

  Future<void> upsert(DownloadedLessonsCompanion entry) =>
      into(downloadedLessons).insertOnConflictUpdate(entry);

  Future<DownloadedLesson?> byLessonId(String lessonId) => (select(
    downloadedLessons,
  )..where((t) => t.lessonId.equals(lessonId))).getSingleOrNull();

  Future<List<DownloadedLesson>> byState(DownloadState state) => (select(
    downloadedLessons,
  )..where((t) => t.state.equalsValue(state))).get();

  /// E19's per-item progress stream.
  Stream<DownloadedLesson?> watch(String lessonId) => (select(
    downloadedLessons,
  )..where((t) => t.lessonId.equals(lessonId))).watchSingleOrNull();

  /// Oldest `queued` row whose backoff has elapsed — the pump's next unit of
  /// work.
  ///
  /// Ordering by `queuedAt` is safe only because every writer normalizes it to
  /// UTC (see the class doc above): Drift's TEXT datetime encoding makes
  /// `ORDER BY` lexicographic, so a mixed-offset column would sort wrong. The
  /// same applies to comparing `nextAttemptAt` against [now], which callers
  /// must pass as UTC.
  ///
  /// Skipping rows in backoff here — rather than sleeping in the pump — is what
  /// keeps one unreachable lesson from stalling every healthy download behind
  /// it. On a whole-course enqueue that is the difference between one slow item
  /// and a frozen queue.
  Future<DownloadedLesson?> nextQueued({required DateTime now}) =>
      (select(downloadedLessons)
            ..where(
              (t) =>
                  t.state.equalsValue(DownloadState.queued) &
                  (t.nextAttemptAt.isNull() |
                      t.nextAttemptAt.isSmallerOrEqualValue(now)),
            )
            ..orderBy(<OrderClauseGenerator<$DownloadedLessonsTable>>[
              (t) => OrderingTerm(expression: t.queuedAt),
            ])
            ..limit(1))
          .getSingleOrNull();

  /// Every row belonging to one course — `EnqueueCourse` and course-level
  /// cancel operate on the group.
  Future<List<DownloadedLesson>> byCourseId(String courseId) =>
      (select(downloadedLessons)
            ..where((t) => t.courseId.equals(courseId)))
          .get();

  /// Cancel deletes the row — there is no terminal `cancelled` state because
  /// there is nothing left to resume from.
  Future<void> remove(String lessonId) => (delete(
    downloadedLessons,
  )..where((t) => t.lessonId.equals(lessonId))).go();
}
