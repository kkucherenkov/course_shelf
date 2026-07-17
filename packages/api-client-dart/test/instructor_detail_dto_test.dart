import 'package:test/test.dart';
import 'package:app_api_client/app_api_client.dart';

// tests for InstructorDetailDto
void main() {
  final instance = InstructorDetailDtoBuilder();
  // TODO add properties to the builder and call build()

  group(InstructorDetailDto, () {
    // InstructorDto instructor
    test('to test the property `instructor`', () async {
      // TODO
    });

    // Courses associated with this instructor, up to 20, sorted by title.
    // BuiltList<CourseDto> courses
    test('to test the property `courses`', () async {
      // TODO
    });

    // Total number of courses associated with this instructor (may exceed `courses.length`).
    // int coursesTotal
    test('to test the property `coursesTotal`', () async {
      // TODO
    });

  });
}
