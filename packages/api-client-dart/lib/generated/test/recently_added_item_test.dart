import 'package:test/test.dart';
import 'package:app_api_client/app_api_client.dart';

// tests for RecentlyAddedItem
void main() {
  final instance = RecentlyAddedItemBuilder();
  // TODO add properties to the builder and call build()

  group(RecentlyAddedItem, () {
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

    // Number of lessons in the course at intake time.
    // int lessonCount
    test('to test the property `lessonCount`', () async {
      // TODO
    });

    // Sum of `Lesson.duration` across the course, in whole seconds.
    // int totalDurationSeconds
    test('to test the property `totalDurationSeconds`', () async {
      // TODO
    });

    // Moment the course was added to its library.
    // DateTime createdAt
    test('to test the property `createdAt`', () async {
      // TODO
    });

  });
}
