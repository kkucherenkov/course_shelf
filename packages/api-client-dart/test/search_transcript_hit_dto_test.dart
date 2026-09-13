import 'package:test/test.dart';
import 'package:app_api_client/app_api_client.dart';

// tests for SearchTranscriptHitDto
void main() {
  final instance = SearchTranscriptHitDtoBuilder();
  // TODO add properties to the builder and call build()

  group(SearchTranscriptHitDto, () {
    // String lessonId
    test('to test the property `lessonId`', () async {
      // TODO
    });

    // Title of the lesson the cue belongs to.
    // String lessonTitle
    test('to test the property `lessonTitle`', () async {
      // TODO
    });

    // String courseId
    test('to test the property `courseId`', () async {
      // TODO
    });

    // Title of the parent course — included so the SPA can show breadcrumb context.
    // String courseTitle
    test('to test the property `courseTitle`', () async {
      // TODO
    });

    // Title of the parent section.
    // String sectionTitle
    test('to test the property `sectionTitle`', () async {
      // TODO
    });

    // BCP-47-ish language tag of the transcript the cue belongs to.
    // String language
    test('to test the property `language`', () async {
      // TODO
    });

    // Cue start time in milliseconds, for seeking straight to the moment.
    // int startMs
    test('to test the property `startMs`', () async {
      // TODO
    });

    // The cue text that matched the query.
    // String text
    test('to test the property `text`', () async {
      // TODO
    });

  });
}
