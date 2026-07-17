import 'package:test/test.dart';
import 'package:app_api_client/app_api_client.dart';

// tests for ContinueWatchingItem
void main() {
  final instance = ContinueWatchingItemBuilder();
  // TODO add properties to the builder and call build()

  group(ContinueWatchingItem, () {
    // Server-generated cuid identifying the course.
    // String courseId
    test('to test the property `courseId`', () async {
      // TODO
    });

    // Display title of the course.
    // String courseTitle
    test('to test the property `courseTitle`', () async {
      // TODO
    });

    // Slug of the parent library, included for the URL builder. Optional because not every layout exposes a per-library slug yet.
    // String librarySlug
    test('to test the property `librarySlug`', () async {
      // TODO
    });

    // Course completion = `lessonsCompleted / lessonsTotal * 100`.
    // num percent
    test('to test the property `percent`', () async {
      // TODO
    });

    // Number of lessons the user has completed in this course.
    // int lessonsCompleted
    test('to test the property `lessonsCompleted`', () async {
      // TODO
    });

    // Total number of lessons in the course.
    // int lessonsTotal
    test('to test the property `lessonsTotal`', () async {
      // TODO
    });

    // Most recent moment any lesson in this course was watched (completed or not).
    // DateTime lastSeenAt
    test('to test the property `lastSeenAt`', () async {
      // TODO
    });

    // The lesson the player last reported a position on, used to wire the 'Resume' CTA.
    // String lastSeenLessonId
    test('to test the property `lastSeenLessonId`', () async {
      // TODO
    });

  });
}
