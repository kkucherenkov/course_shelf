import 'package:drift/drift.dart';

import 'package:app_mobile/shared/db/app_database.dart';
import 'package:app_mobile/shared/db/tables/bookmarks_outbox.dart';

part 'bookmarks_outbox_dao.g.dart';

/// Append-only queue of bookmark ops.
///
/// Unlike the progress and notes outboxes, this does NOT coalesce by lesson:
/// each bookmark is a distinct entity. Ops are keyed by the client's `localId`,
/// which E20 uses to collapse a create+update into a single create.
@DriftAccessor(tables: [BookmarksOutbox])
class BookmarksOutboxDao extends DatabaseAccessor<AppDatabase>
    with _$BookmarksOutboxDaoMixin {
  BookmarksOutboxDao(super.db);

  /// Upserts on `localId`: a later op against the same bookmark replaces the
  /// queued one. Distinct bookmarks have distinct localIds and never collide.
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
