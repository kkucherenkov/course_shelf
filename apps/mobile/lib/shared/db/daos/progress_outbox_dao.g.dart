// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'progress_outbox_dao.dart';

// ignore_for_file: type=lint
mixin _$ProgressOutboxDaoMixin on DatabaseAccessor<AppDatabase> {
  $ProgressOutboxTable get progressOutbox => attachedDatabase.progressOutbox;
  ProgressOutboxDaoManager get managers => ProgressOutboxDaoManager(this);
}

class ProgressOutboxDaoManager {
  final _$ProgressOutboxDaoMixin _db;
  ProgressOutboxDaoManager(this._db);
  $$ProgressOutboxTableTableManager get progressOutbox =>
      $$ProgressOutboxTableTableManager(
        _db.attachedDatabase,
        _db.progressOutbox,
      );
}
