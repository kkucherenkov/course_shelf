import 'package:test/test.dart';
import 'package:app_api_client/app_api_client.dart';

// tests for CourseDownloadEstimateDto
void main() {
  final instance = CourseDownloadEstimateDtoBuilder();
  // TODO add properties to the builder and call build()

  group(CourseDownloadEstimateDto, () {
    // Server-generated cuid of the course this estimate is for.
    // String courseId
    test('to test the property `courseId`', () async {
      // TODO
    });

    // Sum of Lesson.sizeBytes (bytes) across all accessible lessons in the course.
    // int totalBytes
    test('to test the property `totalBytes`', () async {
      // TODO
    });

    // Number of lessons included in the byte sum.
    // int lessonCount
    test('to test the property `lessonCount`', () async {
      // TODO
    });

  });
}
