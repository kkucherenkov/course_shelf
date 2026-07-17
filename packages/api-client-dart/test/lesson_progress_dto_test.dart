import 'package:test/test.dart';
import 'package:app_api_client/app_api_client.dart';

// tests for LessonProgressDto
void main() {
  final instance = LessonProgressDtoBuilder();
  // TODO add properties to the builder and call build()

  group(LessonProgressDto, () {
    // Server-generated cuid identifying the lesson.
    // String lessonId
    test('to test the property `lessonId`', () async {
      // TODO
    });

    // Last recorded watch position in seconds.
    // int positionSeconds
    test('to test the property `positionSeconds`', () async {
      // TODO
    });

    // Lesson video duration in seconds.
    // int durationSeconds
    test('to test the property `durationSeconds`', () async {
      // TODO
    });

    // Computed as `positionSeconds / durationSeconds * 100`. Clamped to 100 when position >= duration.
    // num percent
    test('to test the property `percent`', () async {
      // TODO
    });

    // True once the user crosses the 90 % threshold; never flips back to false.
    // bool completed
    test('to test the property `completed`', () async {
      // TODO
    });

    // ISO-8601 instant of the last accepted progress write.
    // DateTime lastSeenAt
    test('to test the property `lastSeenAt`', () async {
      // TODO
    });

    // Set the first time `completed` flips to true. Stable across subsequent writes. Absent when `completed` is false.
    // DateTime completedAt
    test('to test the property `completedAt`', () async {
      // TODO
    });

  });
}
