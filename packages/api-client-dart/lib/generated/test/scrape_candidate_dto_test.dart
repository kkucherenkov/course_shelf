import 'package:test/test.dart';
import 'package:app_api_client/app_api_client.dart';

// tests for ScrapeCandidateDto
void main() {
  final instance = ScrapeCandidateDtoBuilder();
  // TODO add properties to the builder and call build()

  group(ScrapeCandidateDto, () {
    // Id of the scraper that produced this candidate (e.g. `youtube`, `json-ld`).
    // String source_
    test('to test the property `source_`', () async {
      // TODO
    });

    // URL of the upstream resource that was fetched, if applicable.
    // String sourceUrl
    test('to test the property `sourceUrl`', () async {
      // TODO
    });

    // Optional confidence score in the range [0, 1].
    // double confidence
    test('to test the property `confidence`', () async {
      // TODO
    });

    // ScrapedCourseFragmentDto fragment
    test('to test the property `fragment`', () async {
      // TODO
    });

  });
}
