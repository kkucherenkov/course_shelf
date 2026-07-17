import 'package:test/test.dart';
import 'package:app_api_client/app_api_client.dart';

// tests for LessonDto
void main() {
  final instance = LessonDtoBuilder();
  // TODO add properties to the builder and call build()

  group(LessonDto, () {
    // Server-generated cuid identifying this lesson.
    // String id
    test('to test the property `id`', () async {
      // TODO
    });

    // cuid of the course this lesson belongs to.
    // String courseId
    test('to test the property `courseId`', () async {
      // TODO
    });

    // cuid of the section this lesson belongs to.
    // String sectionId
    test('to test the property `sectionId`', () async {
      // TODO
    });

    // 1-based position within the section.
    // int position
    test('to test the property `position`', () async {
      // TODO
    });

    // String title
    test('to test the property `title`', () async {
      // TODO
    });

    // Video duration in seconds. Populated by E06-F02-S02 (ffprobe). `undefined` until then.
    // int durationSeconds
    test('to test the property `durationSeconds`', () async {
      // TODO
    });

    // Sidecar materials (PDF / Markdown / text / image). Empty array when none.
    // BuiltList<MaterialDto> materials
    test('to test the property `materials`', () async {
      // TODO
    });

    // Available subtitle tracks. Empty array when none.
    // BuiltList<SubtitleDto> subtitles
    test('to test the property `subtitles`', () async {
      // TODO
    });

    // LessonProgress progress
    test('to test the property `progress`', () async {
      // TODO
    });

  });
}
