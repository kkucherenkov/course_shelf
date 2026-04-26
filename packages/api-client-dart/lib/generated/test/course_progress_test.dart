import 'package:test/test.dart';
import 'package:app_api_client/app_api_client.dart';

// tests for CourseProgress
void main() {
  final instance = CourseProgressBuilder();
  // TODO add properties to the builder and call build()

  group(CourseProgress, () {
    // Completion percent. v1 always returns 0 — populated once the LessonProgress projector lands (E10-F01-S01).
    // num percent
    test('to test the property `percent`', () async {
      // TODO
    });

    // int lessonsCompleted
    test('to test the property `lessonsCompleted`', () async {
      // TODO
    });

    // int lessonsTotal
    test('to test the property `lessonsTotal`', () async {
      // TODO
    });

  });
}
