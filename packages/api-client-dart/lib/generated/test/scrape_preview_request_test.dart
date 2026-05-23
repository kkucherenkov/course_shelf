import 'package:test/test.dart';
import 'package:app_api_client/app_api_client.dart';

// tests for ScrapePreviewRequest
void main() {
  final instance = ScrapePreviewRequestBuilder();
  // TODO add properties to the builder and call build()

  group(ScrapePreviewRequest, () {
    // Explicit scraper id (e.g. `youtube`, `udemy`, `json-ld`). Omit to auto-detect (kind=url) or default to json-ld (kind=fragment). Required for kind=name.
    // String source_
    test('to test the property `source_`', () async {
      // TODO
    });

    // ScraperKind kind
    test('to test the property `kind`', () async {
      // TODO
    });

    // Required when kind=url.
    // String url
    test('to test the property `url`', () async {
      // TODO
    });

    // Required when kind=name.
    // String query
    test('to test the property `query`', () async {
      // TODO
    });

    // Required when kind=fragment (raw HTML or JSON-LD string).
    // String fragment
    test('to test the property `fragment`', () async {
      // TODO
    });

  });
}
