import 'package:drift/drift.dart';

import 'package:app_mobile/shared/db/app_database.dart';
import 'package:app_mobile/shared/db/tables/notes_outbox.dart';

part 'notes_outbox_dao.g.dart';

/// Queue of pending note upserts/deletes, coalesced per lesson.
@DriftAccessor(tables: [NotesOutbox])
class NotesOutboxDao extends DatabaseAccessor<AppDatabase>
    with _$NotesOutboxDaoMixin {
  NotesOutboxDao(super.db);

  /// Upserts on `lessonId`: `PUT /notes` and `DELETE /notes/{lessonId}` are
  /// both idempotent, so only the latest intent matters.
  Future<void> enqueue(NotesOutboxCompanion entry) =>
      into(notesOutbox).insertOnConflictUpdate(entry);

  Future<List<NotesOutboxEntry>> pending() => (select(notesOutbox)
        ..orderBy([(t) => OrderingTerm(expression: t.queuedAt)]))
      .get();

  Future<void> clear(Iterable<String> lessonIds) =>
      (delete(notesOutbox)..where((t) => t.lessonId.isIn(lessonIds))).go();
}
