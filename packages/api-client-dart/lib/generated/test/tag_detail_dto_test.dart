import 'package:test/test.dart';
import 'package:app_api_client/app_api_client.dart';

// tests for TagDetailDto
void main() {
  final instance = TagDetailDtoBuilder();
  // TODO add properties to the builder and call build()

  group(TagDetailDto, () {
    // TagDto tag
    test('to test the property `tag`', () async {
      // TODO
    });

    // Courses associated with this tag, up to 20, sorted by title.
    // BuiltList<CourseDto> courses
    test('to test the property `courses`', () async {
      // TODO
    });

    // Total number of courses associated with this tag (may exceed `courses.length`).
    // int coursesTotal
    test('to test the property `coursesTotal`', () async {
      // TODO
    });

  });
}
