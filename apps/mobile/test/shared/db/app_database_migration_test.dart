import 'dart:io';

import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:sqlite3/sqlite3.dart';

import 'package:app_mobile/shared/db/app_database.dart';

/// Hand-builds a pre-E19 (v1) `downloaded_lessons` table directly with
/// `package:sqlite3`, bypassing drift entirely. AppDatabase's own `onCreate`
/// always builds the *current* schema, so it can't produce a genuine v1
/// fixture — this is the only way to get a database that still needs the
/// v1 -> v2 migration to run.
///
/// `updated_at` is written as an ISO-8601 UTC string, not an integer:
/// `build.yaml` sets `store_date_time_values_as_text: true` (unix-timestamp
/// storage loses the UTC/local marker on read-back), and
/// [DateTime.toIso8601String] on a UTC instant is exactly the format drift
/// itself writes for that mode.
void _writeV1Fixture(File file, DateTime updatedAt) {
  final Database raw = sqlite3.open(file.path);
  try {
    raw.execute('''
      CREATE TABLE downloaded_lessons (
        lesson_id TEXT NOT NULL PRIMARY KEY,
        state TEXT NOT NULL,
        file_path TEXT NOT NULL,
        bytes_downloaded INTEGER NOT NULL DEFAULT 0,
        total_bytes INTEGER,
        nonce BLOB,
        last_error TEXT,
        updated_at TEXT NOT NULL
      );
    ''');
    raw.execute(
      'INSERT INTO downloaded_lessons '
      '(lesson_id, state, file_path, updated_at) VALUES (?, ?, ?, ?)',
      <Object?>[
        'v1-lesson',
        'queued',
        '/tmp/v1-lesson.csdl',
        updatedAt.toIso8601String(),
      ],
    );
    // What drift reads on open to decide a migration is needed.
    raw.execute('PRAGMA user_version = 1');
  } finally {
    raw.close();
  }
}

void main() {
  // Deliberately its own file, not a group in app_database_test.dart: that
  // file's top-level `setUp` opens an in-memory AppDatabase for every test,
  // which this suite doesn't use — opening a second AppDatabase instance
  // alongside it trips drift's (harmless but noisy) "multiple databases"
  // debug warning.
  group('migration v1 -> v2', () {
    late Directory tempDir;

    setUp(() async {
      tempDir = await Directory.systemTemp.createTemp('cs_migration_test_');
    });

    tearDown(() async {
      await tempDir.delete(recursive: true);
    });

    test(
      'adds the queue columns and backfills queuedAt from updatedAt',
      () async {
        final File dbFile = File('${tempDir.path}/course_shelf.sqlite');
        final DateTime v1UpdatedAt = DateTime.utc(2026, 1, 1, 12);
        _writeV1Fixture(dbFile, v1UpdatedAt);

        final AppDatabase migrated = AppDatabase(NativeDatabase(dbFile));
        addTearDown(migrated.close);

        // 1. The migration ran and added all four queue columns.
        final cols = await migrated
            .customSelect('PRAGMA table_info(downloaded_lessons)')
            .get();
        final colNames = cols.map((r) => r.read<String>('name')).toSet();
        expect(
          colNames,
          containsAll(<String>[
            'course_id',
            'attempt_count',
            'queued_at',
            'next_attempt_at',
          ]),
        );

        final row = await migrated.downloadsDao.byLessonId('v1-lesson');
        expect(row, isNotNull);
        // 2. The interesting assertion: the backfill statement actually ran
        // against pre-existing user data, not just the ALTER TABLEs.
        expect(row!.queuedAt, v1UpdatedAt);
        // 3. Nothing backfills nextAttemptAt — null means "eligible now".
        expect(row.nextAttemptAt, isNull);
        // 4. From the column default, not the backfill.
        expect(row.attemptCount, 0);

        // 5. A backfilled queuedAt the ordering query in nextQueued() can
        // actually see — a backfill nextQueued() can't read is pointless.
        final next = await migrated.downloadsDao.nextQueued(
          now: v1UpdatedAt.add(const Duration(minutes: 1)),
        );
        expect(next?.lessonId, 'v1-lesson');
      },
    );
  });
}
