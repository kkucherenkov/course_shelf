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
      into(bookmarksOutbox).insertOnConflictUpdate(entry);

  Future<List<BookmarksOutboxEntry>> pending() => (select(bookmarksOutbox)
        ..orderBy([(t) => OrderingTerm(expression: t.queuedAt)]))
      .get();

  Future<void> clear(Iterable<String> localIds) =>
      (delete(bookmarksOutbox)..where((t) => t.localId.isIn(localIds))).go();
}
