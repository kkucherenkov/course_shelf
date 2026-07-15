import 'package:drift/drift.dart';

import 'package:app_mobile/shared/db/tables/cached_courses.dart';
import 'package:app_mobile/shared/db/tables/cached_sections.dart';

/// Cached lesson, from `CourseOutlineDto.sections[].lessons`.
@DataClassName('CachedLesson')
class CachedLessons extends Table {
  @override
  String get tableName => 'cached_lessons';

  TextColumn get id => text()();

  TextColumn get sectionId =>
      text().references(CachedSections, #id, onDelete: KeyAction.cascade)();

  /// Denormalised so "all lessons in a course" is one indexed read rather than
  /// a join through sections — Home and the downloads queue both need it.
  TextColumn get courseId =>
      text().references(CachedCourses, #id, onDelete: KeyAction.cascade)();

  /// Ordering within the section.
  IntColumn get position => integer()();

  DateTimeColumn get cachedAt => dateTime()();

  /// The full lesson DTO as JSON.
  TextColumn get payload => text()();

  @override
  Set<Column> get primaryKey => {id};
}
