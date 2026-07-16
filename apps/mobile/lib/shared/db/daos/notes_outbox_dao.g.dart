// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'notes_outbox_dao.dart';

// ignore_for_file: type=lint
mixin _$NotesOutboxDaoMixin on DatabaseAccessor<AppDatabase> {
  $NotesOutboxTable get notesOutbox => attachedDatabase.notesOutbox;
  NotesOutboxDaoManager get managers => NotesOutboxDaoManager(this);
}

class NotesOutboxDaoManager {
  final _$NotesOutboxDaoMixin _db;
  NotesOutboxDaoManager(this._db);
  $$NotesOutboxTableTableManager get notesOutbox =>
      $$NotesOutboxTableTableManager(_db.attachedDatabase, _db.notesOutbox);
}
