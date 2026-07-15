import 'package:drift/drift.dart';

import 'package:app_mobile/shared/db/tables/outbox_op.dart';

/// Pending bookmark ops, drained by E20 into
/// `POST /api/v1/lessons/{lessonId}/bookmarks`, `PATCH /api/v1/bookmarks/{id}`
/// and `DELETE /api/v1/bookmarks/{id}`.
///
/// APPEND-ONLY, unlike the other two outboxes: each create is a distinct
/// entity, so rows cannot coalesce by key.
///
/// The server assigns the bookmark id on create, so a bookmark created offline
/// has no [serverId] until its create syncs — and an edit made before that
/// would reference an id that does not exist. E20 resolves this by collapsing
/// ops on the same [localId] (create+update -> one create with final values;
/// create+delete -> both dropped), so any op that needs a [serverId] has one.
/// This table stores the columns that make the collapse possible; it does not
/// perform it.
@DataClassName('BookmarksOutboxEntry')
class BookmarksOutbox extends Table {
  @override
  String get tableName => 'bookmarks_outbox';

  /// Client-generated. Stable across the collapse; never sent to the server.
  TextColumn get localId => text()();

  /// The server-assigned id. Null until the create for this [localId] syncs —
  /// nullability IS the collapse contract, so do not make this required.
  TextColumn get serverId => text().nullable()();

  TextColumn get lessonId => text()();

  TextColumn get op => textEnum<OutboxOp>()();

  /// Null when [op] is delete.
  IntColumn get positionSeconds => integer().nullable()();

  /// Null when [op] is delete, or when the bookmark has no label. Update rows
  /// carry the bookmark's FULL desired state, not a patch — so a null label on
  /// an update means "clear the label", which the drain sends as an explicit
  /// null.
  TextColumn get label => text().nullable()();

  DateTimeColumn get clientUpdatedAt => dateTime()();
  DateTimeColumn get queuedAt => dateTime()();

  @override
  Set<Column> get primaryKey => {localId};
}
