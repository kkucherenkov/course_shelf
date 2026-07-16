import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:app_mobile/shared/db/app_database.dart';

void main() {
  late AppDatabase db;

  setUp(() => db = AppDatabase(NativeDatabase.memory()));
  tearDown(() => db.close());

  test('schemaVersion is 1', () {
    expect(db.schemaVersion, 1);
  });

  test('onCreate builds the schema from cold', () async {
    // Forces the migrator to run; a broken onCreate throws here.
    await db.customSelect('SELECT 1').get();
    final tables = await db
        .customSelect("SELECT name FROM sqlite_master WHERE type='table'")
        .get();
    final names = tables.map((r) => r.read<String>('name')).toSet();
    expect(names, contains('cached_courses'));
  });

  test('onCreate builds every table', () async {
    final tables = await db
        .customSelect("SELECT name FROM sqlite_master WHERE type='table'")
        .get();
    final names = tables.map((r) => r.read<String>('name')).toSet();
    expect(
      names,
      containsAll(<String>[
        'cached_courses',
        'cached_sections',
        'cached_lessons',
        'progress_outbox',
        'notes_outbox',
        'bookmarks_outbox',
        'downloaded_lessons',
      ]),
    );
  });

  test('cached_lessons and cached_sections are indexed on courseId',
      () async {
    // `lessonsForCourse` and `replaceOutline`'s deletes both filter on
    // courseId; without an index this is an unindexed table scan.
    final indexes = await db
        .customSelect("SELECT name FROM sqlite_master WHERE type='index'")
        .get();
    final names = indexes.map((r) => r.read<String>('name')).toSet();
    expect(names, contains('idx_cached_lessons_course_id'));
    expect(names, contains('idx_cached_sections_course_id'));
  });

  test('downloaded_lessons stores no encryption key', () async {
    // E19 keeps the device-bound AES key in flutter_secure_storage. A key
    // stored beside its own ciphertext is not encryption — this guards that
    // boundary against a well-meaning future column.
    final cols =
        await db.customSelect('PRAGMA table_info(downloaded_lessons)').get();
    final names =
        cols.map((r) => r.read<String>('name').toLowerCase()).toList();
    // Substring, not equality: a real leak would be named `encryption_key` or
    // `key_id`, not `key`.
    expect(names.where((n) => n.contains('key')), isEmpty);
    expect(names, contains('nonce'));
  });
}
