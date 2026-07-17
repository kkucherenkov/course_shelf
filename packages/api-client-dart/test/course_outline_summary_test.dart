import 'package:test/test.dart';
import 'package:app_api_client/app_api_client.dart';

// tests for CourseOutlineSummary
void main() {
  final instance = CourseOutlineSummaryBuilder();
  // TODO add properties to the builder and call build()

  group(CourseOutlineSummary, () {
    // Server-generated cuid identifying the course.
    // String id
    test('to test the property `id`', () async {
      // TODO
    });

    // String title
    test('to test the property `title`', () async {
      // TODO
    });

    // String slug
    test('to test the property `slug`', () async {
      // TODO
    });

    // Long-form description rendered under the title.
    // String description
    test('to test the property `description`', () async {
      // TODO
    });

    // Visible \"by …\" label. Optional — may be null until the catalog DTO grows the field.
    // String instructor
    test('to test the property `instructor`', () async {
      // TODO
    });

    // Slug of the parent library, included for breadcrumbs. Optional because Library has no slug field yet (same caveat as ContinueWatchingItem).
    // String librarySlug
    test('to test the property `librarySlug`', () async {
      // TODO
    });

    // int lessonsTotal
    test('to test the property `lessonsTotal`', () async {
      // TODO
    });

    // Sum of `Lesson.duration` across the course (whole seconds).
    // int totalDurationSeconds
    test('to test the property `totalDurationSeconds`', () async {
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
