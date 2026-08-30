// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'bookmark_id_map_dao.dart';

// ignore_for_file: type=lint
mixin _$BookmarkIdMapDaoMixin on DatabaseAccessor<AppDatabase> {
  $BookmarkIdMapTable get bookmarkIdMap => attachedDatabase.bookmarkIdMap;
  BookmarkIdMapDaoManager get managers => BookmarkIdMapDaoManager(this);
}

class BookmarkIdMapDaoManager {
  final _$BookmarkIdMapDaoMixin _db;
  BookmarkIdMapDaoManager(this._db);
  $$BookmarkIdMapTableTableManager get bookmarkIdMap =>
      $$BookmarkIdMapTableTableManager(_db.attachedDatabase, _db.bookmarkIdMap);
}
