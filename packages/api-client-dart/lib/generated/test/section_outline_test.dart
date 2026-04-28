import 'package:test/test.dart';
import 'package:app_api_client/app_api_client.dart';

// tests for SectionOutline
void main() {
  final instance = SectionOutlineBuilder();
  // TODO add properties to the builder and call build()

  group(SectionOutline, () {
    // Server-generated cuid identifying this section.
    // String id
    test('to test the property `id`', () async {
      // TODO
    });

    // 1-based position within the course.
    // int position
    test('to test the property `position`', () async {
      // TODO
    });

    // String title
    test('to test the property `title`', () async {
      // TODO
    });

    // Sum of `Lesson.duration` across this section's lessons.
    // int totalDurationSeconds
    test('to test the property `totalDurationSeconds`', () async {
      // TODO
    });

    // Lessons sorted by position.
    // BuiltList<LessonOutlineItem> lessons
    test('to test the property `lessons`', () async {
      // TODO
    });

  });
}
