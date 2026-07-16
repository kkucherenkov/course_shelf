// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'bookmarks_outbox_dao.dart';

// ignore_for_file: type=lint
mixin _$BookmarksOutboxDaoMixin on DatabaseAccessor<AppDatabase> {
  $BookmarksOutboxTable get bookmarksOutbox => attachedDatabase.bookmarksOutbox;
  BookmarksOutboxDaoManager get managers => BookmarksOutboxDaoManager(this);
}

class BookmarksOutboxDaoManager {
  final _$BookmarksOutboxDaoMixin _db;
  BookmarksOutboxDaoManager(this._db);
  $$BookmarksOutboxTableTableManager get bookmarksOutbox =>
      $$BookmarksOutboxTableTableManager(
        _db.attachedDatabase,
        _db.bookmarksOutbox,
      );
}
