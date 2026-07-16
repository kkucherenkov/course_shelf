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
      into(cachedCourses).insertOnConflictUpdate(_normalizeCourseUtc(course));

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
        b.insertAll(cachedSections, sections.map(_normalizeSectionUtc));
        b.insertAll(cachedLessons, lessons.map(_normalizeLessonUtc));
      });
    });
  }

  Future<List<CachedLesson>> lessonsForCourse(String courseId) =>
      (select(cachedLessons)
            ..where((t) => t.courseId.equals(courseId))
            ..orderBy([(t) => OrderingTerm(expression: t.position)]))
          .get();
}

/// Drift's TEXT datetime encoding (`store_date_time_values_as_text: true`)
/// gives UTC and local `DateTime`s different string shapes — UTC ends in
/// `Z`, local has a leading space and a trailing `+HH:MM` offset. `cachedAt`
/// (and `CachedCourse.updatedAt`, used for staleness comparison) are TTL/
/// comparison inputs for E18/E19, and any `WHERE`/`ORDER BY` built on a mixed
/// -shape column would compare or sort lexicographically instead of
/// chronologically. Normalizing every write to UTC — same pattern as the
/// outbox DAOs — keeps these columns single-shaped.
CachedCoursesCompanion _normalizeCourseUtc(CachedCoursesCompanion course) =>
    course.copyWith(
      updatedAt: course.updatedAt.present
          ? Value(course.updatedAt.value.toUtc())
          : course.updatedAt,
      cachedAt: course.cachedAt.present
          ? Value(course.cachedAt.value.toUtc())
          : course.cachedAt,
    );

CachedSectionsCompanion _normalizeSectionUtc(CachedSectionsCompanion section) =>
    section.copyWith(
      cachedAt: section.cachedAt.present
          ? Value(section.cachedAt.value.toUtc())
          : section.cachedAt,
    );

CachedLessonsCompanion _normalizeLessonUtc(CachedLessonsCompanion lesson) =>
    lesson.copyWith(
      cachedAt: lesson.cachedAt.present
          ? Value(lesson.cachedAt.value.toUtc())
          : lesson.cachedAt,
    );
