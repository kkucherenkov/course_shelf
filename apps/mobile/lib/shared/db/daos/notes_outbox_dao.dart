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
      into(notesOutbox).insertOnConflictUpdate(_normalizeUtc(entry));

  Future<List<NotesOutboxEntry>> pending() => (select(notesOutbox)
        ..orderBy([(t) => OrderingTerm(expression: t.queuedAt)]))
      .get();

  Future<void> clear(Iterable<String> lessonIds) =>
      (delete(notesOutbox)..where((t) => t.lessonId.isIn(lessonIds))).go();
}

/// Drift's TEXT datetime encoding (`store_date_time_values_as_text: true`)
/// gives UTC and local `DateTime`s different string shapes — UTC ends in
/// `Z`, local has a leading space and a trailing `+HH:MM` offset — so
/// `ORDER BY queued_at`, a lexicographic TEXT sort, can rank a chronologically
/// earlier LOCAL row after a later UTC one. Normalizing every write to UTC
/// keeps the column single-shaped, which keeps `ORDER BY` chronological.
NotesOutboxCompanion _normalizeUtc(NotesOutboxCompanion entry) =>
    entry.copyWith(
      clientUpdatedAt: entry.clientUpdatedAt.present
          ? Value(entry.clientUpdatedAt.value.toUtc())
          : entry.clientUpdatedAt,
      queuedAt: entry.queuedAt.present
          ? Value(entry.queuedAt.value.toUtc())
          : entry.queuedAt,
    );
