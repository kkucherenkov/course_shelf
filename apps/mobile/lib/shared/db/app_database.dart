import 'package:drift/drift.dart';
import 'package:drift_flutter/drift_flutter.dart';

import 'package:app_mobile/shared/db/daos/bookmark_id_map_dao.dart';
import 'package:app_mobile/shared/db/daos/bookmarks_outbox_dao.dart';
import 'package:app_mobile/shared/db/daos/cached_catalog_dao.dart';
import 'package:app_mobile/shared/db/daos/downloads_dao.dart';
import 'package:app_mobile/shared/db/daos/notes_outbox_dao.dart';
import 'package:app_mobile/shared/db/daos/progress_outbox_dao.dart';
import 'package:app_mobile/shared/db/tables/bookmark_id_map.dart';
import 'package:app_mobile/shared/db/tables/bookmarks_outbox.dart';
import 'package:app_mobile/shared/db/tables/cached_courses.dart';
import 'package:app_mobile/shared/db/tables/cached_lessons.dart';
import 'package:app_mobile/shared/db/tables/cached_sections.dart';
import 'package:app_mobile/shared/db/tables/downloaded_lessons.dart';
import 'package:app_mobile/shared/db/tables/notes_outbox.dart';
import 'package:app_mobile/shared/db/tables/outbox_op.dart';
import 'package:app_mobile/shared/db/tables/progress_outbox.dart';

// Re-exported so consumers (BLoCs, tests) that only import app_database.dart
// can reference each DAO without a second import to its own library — a
// plain `import` does not propagate the type generated in each DAO's own
// `part` file to files that only import app_database.dart.
export 'package:app_mobile/shared/db/daos/bookmark_id_map_dao.dart'
    show BookmarkIdMapDao;
export 'package:app_mobile/shared/db/daos/bookmarks_outbox_dao.dart'
    show BookmarksOutboxDao;
export 'package:app_mobile/shared/db/daos/cached_catalog_dao.dart'
    show CachedCatalogDao;
export 'package:app_mobile/shared/db/daos/downloads_dao.dart' show DownloadsDao;
export 'package:app_mobile/shared/db/daos/notes_outbox_dao.dart'
    show NotesOutboxDao;
export 'package:app_mobile/shared/db/daos/progress_outbox_dao.dart'
    show ProgressOutboxDao;

part 'app_database.g.dart';

/// Local persistence for cache + outbox + downloads.
///
/// Consumers are BLoCs only — widget code must never touch Drift
/// (E15-F02-S01 acceptance).
@DriftDatabase(
  tables: [
    CachedCourses,
    CachedSections,
    CachedLessons,
    ProgressOutbox,
    NotesOutbox,
    BookmarksOutbox,
    BookmarkIdMap,
    DownloadedLessons,
  ],
  daos: [
    CachedCatalogDao,
    ProgressOutboxDao,
    NotesOutboxDao,
    BookmarksOutboxDao,
    BookmarkIdMapDao,
    DownloadsDao,
  ],
)
class AppDatabase extends _$AppDatabase {
  AppDatabase(super.e);

  /// Opens the on-device database. `drift_flutter` bundles SQLite and picks a
  /// platform-appropriate location.
  AppDatabase.open() : super(driftDatabase(name: 'course_shelf'));

  @override
  int get schemaVersion => 4;

  @override
  MigrationStrategy get migration => MigrationStrategy(
    onCreate: (m) => m.createAll(),
    // v1 -> v2 (E19-F01-S01): downloaded_lessons gains the queue columns.
    onUpgrade: (m, from, to) async {
      if (from < 2) {
        await m.addColumn(downloadedLessons, downloadedLessons.courseId);
        await m.addColumn(downloadedLessons, downloadedLessons.attemptCount);
        await m.addColumn(downloadedLessons, downloadedLessons.queuedAt);
        await m.addColumn(downloadedLessons, downloadedLessons.nextAttemptAt);
        // Pre-v2 rows have no queue position. `updatedAt` is the best proxy
        // available and preserves their relative order.
        await m.database.customStatement(
          'UPDATE downloaded_lessons SET queued_at = updated_at '
          'WHERE queued_at IS NULL',
        );
      }
      // v2 -> v3 (E19-F01-S03): the queue row carries its own display names.
      // Not backfilled — there is nowhere to backfill them from, which is the
      // whole reason the columns exist. Pre-v3 rows render with the id as a
      // fallback until they are re-enqueued.
      if (from < 3) {
        await m.addColumn(downloadedLessons, downloadedLessons.lessonTitle);
        await m.addColumn(downloadedLessons, downloadedLessons.courseTitle);
      }
      // v3 -> v4 (E31-F01-S03): bookmarks created offline get a durable
      // localId -> serverId mapping. Nothing to backfill — every pre-v4
      // bookmark either never left the device or was already fetched back
      // under its server id.
      if (from < 4) {
        await m.createTable(bookmarkIdMap);
      }
    },
    beforeOpen: (details) async {
      // Drift disables foreign keys by default; cached_sections and
      // cached_lessons rely on them.
      await customStatement('PRAGMA foreign_keys = ON');
    },
  );
}
