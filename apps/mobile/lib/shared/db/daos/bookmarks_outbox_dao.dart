import 'package:drift/drift.dart';

import 'package:app_mobile/shared/db/app_database.dart';
import 'package:app_mobile/shared/db/tables/bookmarks_outbox.dart';

part 'bookmarks_outbox_dao.g.dart';

/// Queue of bookmark ops, coalesced per bookmark.
///
/// Unlike the progress and notes outboxes, this does NOT coalesce by lesson:
/// each bookmark is a distinct entity, keyed by the client's `localId`.
///
/// Drain rule (E20 implements this; not written here, but the shape of this
/// table requires it): key off `serverId`, not `op`.
///   - `serverId == null` ⟹ POST (create it), regardless of `op` — an
///     enqueue-time collapse of create+update leaves an `update` row with a
///     null `serverId`, and it still needs a POST, not a PATCH.
///   - `serverId != null` ⟹ PATCH/DELETE by that id, per `op`.
///   - `serverId == null && op == delete` ⟹ drop; nothing was ever created
///     server-side, so there is nothing to send.
@DriftAccessor(tables: [BookmarksOutbox])
class BookmarksOutboxDao extends DatabaseAccessor<AppDatabase>
    with _$BookmarksOutboxDaoMixin {
  BookmarksOutboxDao(super.db);

  /// Upserts on `localId`: a later op against the same bookmark REPLACES the
  /// queued one at enqueue time — not at drain. A create followed by an
  /// update therefore collapses into a single `update` row with
  /// `serverId == null`; no `create` row survives to be drained. Distinct
  /// bookmarks have distinct localIds and never collide.
  Future<void> enqueue(BookmarksOutboxCompanion entry) =>
      into(bookmarksOutbox).insertOnConflictUpdate(_normalizeUtc(entry));

  Future<List<BookmarksOutboxEntry>> pending() => (select(bookmarksOutbox)
        ..orderBy([(t) => OrderingTerm(expression: t.queuedAt)]))
      .get();

  Future<void> clear(Iterable<String> localIds) =>
      (delete(bookmarksOutbox)..where((t) => t.localId.isIn(localIds))).go();
}

/// Drift's TEXT datetime encoding (`store_date_time_values_as_text: true`)
/// gives UTC and local `DateTime`s different string shapes — UTC ends in
/// `Z`, local has a leading space and a trailing `+HH:MM` offset — so
/// `ORDER BY queued_at`, a lexicographic TEXT sort, can rank a chronologically
/// earlier LOCAL row after a later UTC one. Normalizing every write to UTC
/// keeps the column single-shaped, which keeps `ORDER BY` chronological.
BookmarksOutboxCompanion _normalizeUtc(BookmarksOutboxCompanion entry) =>
    entry.copyWith(
      clientUpdatedAt: entry.clientUpdatedAt.present
          ? Value(entry.clientUpdatedAt.value.toUtc())
          : entry.clientUpdatedAt,
      queuedAt: entry.queuedAt.present
          ? Value(entry.queuedAt.value.toUtc())
          : entry.queuedAt,
    );
