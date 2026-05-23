import 'package:test/test.dart';
import 'package:app_api_client/app_api_client.dart';

// tests for StudioDetailDto
void main() {
  final instance = StudioDetailDtoBuilder();
  // TODO add properties to the builder and call build()

  group(StudioDetailDto, () {
    // StudioDto studio
    test('to test the property `studio`', () async {
      // TODO
    });

    // Courses associated with this studio, up to 20, sorted by title.
    // BuiltList<CourseDto> courses
    test('to test the property `courses`', () async {
      // TODO
    });

    // Total number of courses associated with this studio (may exceed `courses.length`).
    // int coursesTotal
    test('to test the property `coursesTotal`', () async {
      // TODO
    });

  });
}
