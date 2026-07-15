import 'package:drift/drift.dart';

import 'package:app_mobile/shared/db/app_database.dart';
import 'package:app_mobile/shared/db/tables/cached_courses.dart';
import 'package:app_mobile/shared/db/tables/cached_lessons.dart';
import 'package:app_mobile/shared/db/tables/cached_sections.dart';

part 'cached_catalog_dao.g.dart';

/// Reads and writes the cached catalog.
///
/// One DAO for all three tables: `GET /api/v1/courses/{id}/outline` returns
/// them together and no screen reads a section without its course, so splitting
/// them would produce three DAOs that are always called in concert.
@DriftAccessor(tables: [CachedCourses, CachedSections, CachedLessons])
class CachedCatalogDao extends DatabaseAccessor<AppDatabase>
    with _$CachedCatalogDaoMixin {
  CachedCatalogDao(super.db);

  Future<void> upsertCourse(CachedCoursesCompanion course) =>
      into(cachedCourses).insertOnConflictUpdate(course);

  Future<CachedCourse?> courseById(String id) =>
      (select(cachedCourses)..where((t) => t.id.equals(id)))
          .getSingleOrNull();

  Future<List<CachedCourse>> allCourses() => select(cachedCourses).get();

  Stream<List<CachedCourse>> watchCourses() => select(cachedCourses).watch();

  /// Replaces a course's whole outline atomically.
  ///
  /// The outline endpoint returns the full tree, so a partial write would leave
  /// the cache describing a course that never existed. Deleting first also
  /// drops sections/lessons the server removed — an upsert alone would leave
  /// them behind forever.
  Future<void> replaceOutline({
    required String courseId,
    required List<CachedSectionsCompanion> sections,
    required List<CachedLessonsCompanion> lessons,
  }) {
    return transaction(() async {
      await (delete(cachedLessons)..where((t) => t.courseId.equals(courseId)))
          .go();
      await (delete(cachedSections)..where((t) => t.courseId.equals(courseId)))
          .go();
      await batch((b) {
        b.insertAll(cachedSections, sections);
        b.insertAll(cachedLessons, lessons);
      });
    });
  }

  Future<List<CachedLesson>> lessonsForCourse(String courseId) =>
      (select(cachedLessons)
            ..where((t) => t.courseId.equals(courseId))
            ..orderBy([(t) => OrderingTerm(expression: t.position)]))
          .get();
}
