import 'package:drift/drift.dart';

/// Maps a bookmark's client-generated `localId` to the id the server assigned
/// when its create finally synced.
///
/// A bookmark created offline is handed to the UI with a `localId` the server
/// has never seen. The moment the outbox drains, the same bookmark also exists
/// server-side under a different id — and nothing connected the two, so the
/// local copy and the server copy read as two bookmarks: a delete aimed at the
/// `localId` 404s (wedging the queue behind a row that can never succeed) and a
/// merged view renders both.
///
/// This table is that connection. It is written when the create settles, read
/// on every bookmark read and write, and dropped when the bookmark is deleted.
/// Rows are per offline-created bookmark and tiny; there is no growth problem
/// worth a cleanup job.
@DataClassName('BookmarkIdMapEntry')
class BookmarkIdMap extends Table {
  @override
  String get tableName => 'bookmark_id_map';

  /// The client-generated id the UI still holds. Same value as
  /// `bookmarks_outbox.local_id`, but this row outlives that one — the outbox
  /// row is cleared the instant it drains, which is exactly when the mapping
  /// starts to matter.
  TextColumn get localId => text()();

  /// The server-assigned id. Never null here: a row only exists once the create
  /// has settled and the server has named the bookmark.
  TextColumn get serverId => text()();

  DateTimeColumn get mappedAt => dateTime()();

  @override
  Set<Column> get primaryKey => {localId};
}
