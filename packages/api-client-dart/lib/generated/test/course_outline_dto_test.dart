import 'package:test/test.dart';
import 'package:app_api_client/app_api_client.dart';

// tests for CourseOutlineDto
void main() {
  final instance = CourseOutlineDtoBuilder();
  // TODO add properties to the builder and call build()

  group(CourseOutlineDto, () {
    // CourseOutlineSummary course
    test('to test the property `course`', () async {
      // TODO
    });

    // Sections sorted by position.
    // BuiltList<SectionOutline> sections
    test('to test the property `sections`', () async {
      // TODO
    });

    // Course-level materials, deduplicated and aggregated across every lesson in the course. Empty array when no lesson carries materials.
    // BuiltList<CourseMaterialItem> materials
    test('to test the property `materials`', () async {
      // TODO
    });

  });
}
