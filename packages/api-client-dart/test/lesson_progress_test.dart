import 'package:test/test.dart';
import 'package:app_api_client/app_api_client.dart';

// tests for LessonProgress
void main() {
  final instance = LessonProgressBuilder();
  // TODO add properties to the builder and call build()

  group(LessonProgress, () {
    // Completion percent. v1 always returns 0 — populated once the LessonProgress projector lands (E10-F01-S01).
    // num percent
    test('to test the property `percent`', () async {
      // TODO
    });

    // Whether the lesson is marked as completed.
    // bool completed
    test('to test the property `completed`', () async {
      // TODO
    });

    // Last reported watched position in seconds. v1 always returns 0 — populated by the LessonProgress projector (E10-F01-S01).
    // int lastSeenAtSeconds
    test('to test the property `lastSeenAtSeconds`', () async {
      // TODO
    });

  });
}
