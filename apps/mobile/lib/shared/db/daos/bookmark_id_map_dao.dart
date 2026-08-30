import 'package:drift/drift.dart';

import 'package:app_mobile/shared/db/app_database.dart';
import 'package:app_mobile/shared/db/tables/bookmark_id_map.dart';

part 'bookmark_id_map_dao.g.dart';

/// Reads and writes the `localId` -> `serverId` bookmark mapping.
///
/// Written by the sync drain when a create settles; read by the player's
/// repository decorator, which is the single place every bookmark read and
/// write routes through.
@DriftAccessor(tables: [BookmarkIdMap])
class BookmarkIdMapDao extends DatabaseAccessor<AppDatabase>
    with _$BookmarkIdMapDaoMixin {
  BookmarkIdMapDao(super.db);

  /// Upserts on `localId`. Idempotent on purpose: a drain that re-POSTs after a
  /// partial failure overwrites the mapping rather than colliding on it.
  Future<void> record({
    required String localId,
    required String serverId,
    DateTime? at,
  }) => into(bookmarkIdMap).insertOnConflictUpdate(
    BookmarkIdMapCompanion(
      localId: Value<String>(localId),
      serverId: Value<String>(serverId),
      mappedAt: Value<DateTime>((at ?? DateTime.now()).toUtc()),
    ),
  );

  /// The server id this local id ended up as, or null if the create has not
  /// synced yet (or the id was a server id to begin with).
  Future<String?> serverIdFor(String localId) async {
    final BookmarkIdMapEntry? row =
        await (select(bookmarkIdMap)
              ..where((t) => t.localId.equals(localId))
              ..limit(1))
            .getSingleOrNull();
    return row?.serverId;
  }

  /// The local ids already mapped onto any of [serverIds], as a
  /// `serverId -> localId` lookup. Empty input short-circuits: an `IN ()` over
  /// no values is a query that can only return nothing.
  Future<Map<String, String>> localIdsByServerId(
    Iterable<String> serverIds,
  ) async {
    final List<String> ids = serverIds.toList();
    if (ids.isEmpty) return const <String, String>{};
    final List<BookmarkIdMapEntry> rows = await (select(
      bookmarkIdMap,
    )..where((t) => t.serverId.isIn(ids))).get();
    return <String, String>{
      for (final BookmarkIdMapEntry row in rows) row.serverId: row.localId,
    };
  }

  Future<void> forget(String localId) =>
      (delete(bookmarkIdMap)..where((t) => t.localId.equals(localId))).go();
}
