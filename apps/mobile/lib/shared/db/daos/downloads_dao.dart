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

  /// Writes only the columns present on [entry] onto the row it identifies,
  /// via a real `UPDATE ... WHERE lesson_id = ?` rather than [upsert]'s
  /// `INSERT ... ON CONFLICT DO UPDATE`.
  ///
  /// The pump's state transitions and progress writes (queued -> downloading,
  /// the 4 MiB flush, backoff bookkeeping) only ever touch a row already known
  /// to exist and only ever carry the handful of columns that changed. Routing
  /// them through [upsert] would validate the INSERT branch that never runs,
  /// which demands every NOT NULL column — starting with `filePath` — even
  /// though nothing is being inserted.
  ///
  /// Returns the number of rows the `UPDATE` touched — `0` if the row was
  /// deleted (by `cancel()`) between being claimed and this write, which is
  /// what lets a caller detect that race and abort rather than downloading a
  /// full lesson onto disk for a row nothing points at any more.
  Future<int> updateFields(DownloadedLessonsCompanion entry) {
    final String lessonId = entry.lessonId.value;
    return (update(
      downloadedLessons,
    )..where((t) => t.lessonId.equals(lessonId))).write(entry);
  }

  /// Claims a queued row for the pump, returning the number of rows affected.
  ///
  /// A compare-and-swap on `state`: the transition only applies while the row
  /// is still `queued`. Anything that moved it in the meantime — a pause, a
  /// cancel that deleted it, an explicit retry — yields 0 and tells the
  /// caller to drop this claim rather than overwrite the user's intent.
  Future<int> claimForDownload(String lessonId, DateTime now) =>
      (update(downloadedLessons)..where(
            (t) =>
                t.lessonId.equals(lessonId) &
                t.state.equalsValue(DownloadState.queued),
          ))
          .write(
            DownloadedLessonsCompanion(
              state: const Value<DownloadState>(DownloadState.downloading),
              updatedAt: Value<DateTime>(now),
            ),
          );

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

  /// Every row, for the Downloads tab (E19-F01-S03), oldest `queuedAt` first.
  ///
  /// Ordering by `queuedAt` is safe for the same reason [nextQueued] is (see
  /// its doc): every writer normalizes it to UTC, so the TEXT-encoded column
  /// sorts chronologically.
  Stream<List<DownloadedLesson>> watchAll() =>
      (select(downloadedLessons)
            ..orderBy(<OrderClauseGenerator<$DownloadedLessonsTable>>[
              (t) => OrderingTerm(expression: t.queuedAt),
            ]))
          .watch();

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
  Future<List<DownloadedLesson>> byCourseId(String courseId) => (select(
    downloadedLessons,
  )..where((t) => t.courseId.equals(courseId))).get();

  /// Cancel deletes the row — there is no terminal `cancelled` state because
  /// there is nothing left to resume from.
  Future<void> remove(String lessonId) => (delete(
    downloadedLessons,
  )..where((t) => t.lessonId.equals(lessonId))).go();

  /// Deletes the row and returns what was deleted, in one round trip.
  ///
  /// `cancel()` needs the deleted row's `filePath` to clean up the
  /// ciphertext. A separate `SELECT` first (then a `DELETE`) would cost an
  /// extra async gap for the pump to race ahead in between: `claimForDownload`
  /// only has to lose to a row that is *already gone*, and every await this
  /// method doesn't need is time the pump's own claim can slip through in.
  Future<DownloadedLesson?> removeAndReturn(String lessonId) async {
    final List<DownloadedLesson> rows = await (delete(
      downloadedLessons,
    )..where((t) => t.lessonId.equals(lessonId))).goAndReturn();
    return rows.isEmpty ? null : rows.single;
  }
}
