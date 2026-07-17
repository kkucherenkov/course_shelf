import 'package:test/test.dart';
import 'package:app_api_client/app_api_client.dart';

// tests for RecentlyCompletedItem
void main() {
  final instance = RecentlyCompletedItemBuilder();
  // TODO add properties to the builder and call build()

  group(RecentlyCompletedItem, () {
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

    // Slug of the parent library, included for the URL builder.
    // String librarySlug
    test('to test the property `librarySlug`', () async {
      // TODO
    });

    // Total lessons in the course (== lessons completed for this row).
    // int lessonsTotal
    test('to test the property `lessonsTotal`', () async {
      // TODO
    });

    // Time the requester finished the last lesson — `CourseProgressReadModel.lastSeenAt` at the moment percent hit 100.
    // DateTime completedAt
    test('to test the property `completedAt`', () async {
      // TODO
    });

  });
}
