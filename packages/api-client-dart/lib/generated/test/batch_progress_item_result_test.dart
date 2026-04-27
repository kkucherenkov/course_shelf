import 'package:test/test.dart';
import 'package:app_api_client/app_api_client.dart';

// tests for BatchProgressItemResult
void main() {
  final instance = BatchProgressItemResultBuilder();
  // TODO add properties to the builder and call build()

  group(BatchProgressItemResult, () {
    // Actor has no READ grant covering this lesson, OR the lesson does not exist. The two cases are collapsed deliberately to avoid existence leakage (no-oracle rule). 
    // String status
    test('to test the property `status`', () async {
      // TODO
    });

    // LessonProgressDto state
    test('to test the property `state`', () async {
      // TODO
    });

    // Echoes the input `lessonId` for client correlation.
    // String lessonId
    test('to test the property `lessonId`', () async {
      // TODO
    });

  });
}
