import 'package:drift/drift.dart';

import 'package:app_mobile/shared/db/app_database.dart';
import 'package:app_mobile/shared/db/tables/progress_outbox.dart';

part 'progress_outbox_dao.g.dart';

/// Queue of pending progress writes.
///
/// `POST /api/v1/progress/batch` declares `maxItems: 200`; [pending] defaults
/// to that so a caller cannot build an over-sized request by accident.
@DriftAccessor(tables: [ProgressOutbox])
class ProgressOutboxDao extends DatabaseAccessor<AppDatabase>
    with _$ProgressOutboxDaoMixin {
  ProgressOutboxDao(super.db);

  /// Upserts on `lessonId` — the server is last-write-wins, so a newer write
  /// supersedes the queued one rather than queueing behind it.
  Future<void> enqueue(ProgressOutboxCompanion entry) =>
      into(progressOutbox).insertOnConflictUpdate(entry);

  Future<List<ProgressOutboxEntry>> pending({int limit = 200}) =>
      (select(progressOutbox)
            ..orderBy([(t) => OrderingTerm(expression: t.queuedAt)])
            ..limit(limit))
          .get();

  Future<void> clear(Iterable<String> lessonIds) =>
      (delete(progressOutbox)..where((t) => t.lessonId.isIn(lessonIds))).go();
}
