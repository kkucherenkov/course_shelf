import 'package:test/test.dart';
import 'package:app_api_client/app_api_client.dart';

// tests for CourseDto
void main() {
  final instance = CourseDtoBuilder();
  // TODO add properties to the builder and call build()

  group(CourseDto, () {
    // Server-generated cuid identifying this course.
    // String id
    test('to test the property `id`', () async {
      // TODO
    });

    // cuid of the library this course belongs to.
    // String libraryId
    test('to test the property `libraryId`', () async {
      // TODO
    });

    // URL-safe slug. 1–100 chars, lowercase ASCII letters, digits, and hyphens; cannot start or end with a hyphen. Unique within a library.
    // String slug
    test('to test the property `slug`', () async {
      // TODO
    });

    // String title
    test('to test the property `title`', () async {
      // TODO
    });

    // String description
    test('to test the property `description`', () async {
      // TODO
    });

    // Sections sorted ascending by position.
    // BuiltList<SectionDto> sections
    test('to test the property `sections`', () async {
      // TODO
    });

    // CourseProgress progress
    test('to test the property `progress`', () async {
      // TODO
    });

    // DateTime createdAt
    test('to test the property `createdAt`', () async {
      // TODO
    });

    // DateTime updatedAt
    test('to test the property `updatedAt`', () async {
      // TODO
    });

  });
}
