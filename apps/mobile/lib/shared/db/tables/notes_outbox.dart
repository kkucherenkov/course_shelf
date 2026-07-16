import 'package:drift/drift.dart';

import 'package:app_mobile/shared/db/tables/outbox_op.dart';

/// Pending note writes, drained by E20 into `PUT /api/v1/notes` and
/// `DELETE /api/v1/notes/{lessonId}`.
///
/// COALESCED, one row per lesson: both endpoints are keyed by `lessonId` and
/// idempotent, so only the latest intent per lesson matters.
@DataClassName('NotesOutboxEntry')
class NotesOutbox extends Table {
  @override
  String get tableName => 'notes_outbox';

  /// Doubles as the coalescing key.
  TextColumn get lessonId => text()();

  /// Only `update` (→ PUT) and `delete` (→ DELETE) are reachable here; notes
  /// have no distinct create — `PUT /notes` upserts.
  TextColumn get op => textEnum<OutboxOp>()();

  /// Null when [op] is delete.
  TextColumn get body => text().nullable()();

  DateTimeColumn get clientUpdatedAt => dateTime()();
  DateTimeColumn get queuedAt => dateTime()();

  @override
  Set<Column> get primaryKey => {lessonId};
}
