import 'package:drift/drift.dart';
import 'package:drift_flutter/drift_flutter.dart';

import 'package:app_mobile/shared/db/daos/bookmarks_outbox_dao.dart';
import 'package:app_mobile/shared/db/daos/cached_catalog_dao.dart';
import 'package:app_mobile/shared/db/daos/notes_outbox_dao.dart';
import 'package:app_mobile/shared/db/daos/progress_outbox_dao.dart';
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
export 'package:app_mobile/shared/db/daos/bookmarks_outbox_dao.dart'
    show BookmarksOutboxDao;
export 'package:app_mobile/shared/db/daos/cached_catalog_dao.dart'
    show CachedCatalogDao;
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
    DownloadedLessons,
  ],
  daos: [
    CachedCatalogDao,
    ProgressOutboxDao,
    NotesOutboxDao,
    BookmarksOutboxDao,
  ],
)
class AppDatabase extends _$AppDatabase {
  AppDatabase(super.e);

  /// Opens the on-device database. `drift_flutter` bundles SQLite and picks a
  /// platform-appropriate location.
  AppDatabase.open() : super(driftDatabase(name: 'course_shelf'));

  @override
  int get schemaVersion => 1;

  @override
  MigrationStrategy get migration => MigrationStrategy(
        onCreate: (m) => m.createAll(),
        // No v1 -> v2 step yet: there is no v2. The hook exists so E19 can add
        // one without restructuring.
        onUpgrade: (m, from, to) async {},
        beforeOpen: (details) async {
          // Drift disables foreign keys by default; cached_sections and
          // cached_lessons rely on them.
          await customStatement('PRAGMA foreign_keys = ON');
        },
      );
}
