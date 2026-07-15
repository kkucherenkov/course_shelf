import 'package:drift/drift.dart';

import 'package:app_mobile/shared/db/tables/cached_courses.dart';

/// Cached section, from `CourseOutlineDto.sections`.
@DataClassName('CachedSection')
class CachedSections extends Table {
  @override
  String get tableName => 'cached_sections';

  TextColumn get id => text()();

  TextColumn get courseId =>
      text().references(CachedCourses, #id, onDelete: KeyAction.cascade)();

  /// Ordering within the course outline.
  IntColumn get position => integer()();

  DateTimeColumn get cachedAt => dateTime()();

  /// The full section DTO as JSON.
  TextColumn get payload => text()();

  @override
  Set<Column> get primaryKey => {id};
}
