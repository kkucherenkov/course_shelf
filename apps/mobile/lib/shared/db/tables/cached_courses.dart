import 'package:drift/drift.dart';

/// Cached `CourseDto`, as returned by `GET /api/v1/courses` and
/// `GET /api/v1/courses/{id}/outline`.
///
/// [payload] holds the generated DTO serialized to JSON. Only the columns a
/// screen filters or sorts on are promoted — re-modelling CourseDto's 20+
/// fields here would duplicate a schema `packages/api-client-dart` already
/// owns and rot silently the next time `openapi.yaml` changes.
@DataClassName('CachedCourse')
class CachedCourses extends Table {
  @override
  String get tableName => 'cached_courses';

  /// Server-generated cuid.
  TextColumn get id => text()();

  TextColumn get libraryId => text()();
  TextColumn get slug => text()();
  TextColumn get title => text()();

  /// `CourseDto.updatedAt` — server's value, used for staleness comparison.
  DateTimeColumn get updatedAt => dateTime()();

  /// When this row was written locally. E18/E19 own any TTL policy.
  DateTimeColumn get cachedAt => dateTime()();

  /// The full CourseDto as JSON.
  TextColumn get payload => text()();

  @override
  Set<Column> get primaryKey => {id};
}
