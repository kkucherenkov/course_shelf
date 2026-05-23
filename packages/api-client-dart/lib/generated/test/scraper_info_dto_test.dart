import 'package:test/test.dart';
import 'package:app_api_client/app_api_client.dart';

// tests for ScraperInfoDto
void main() {
  final instance = ScraperInfoDtoBuilder();
  // TODO add properties to the builder and call build()

  group(ScraperInfoDto, () {
    // Stable scraper identifier used as the `source` field in requests.
    // String id
    test('to test the property `id`', () async {
      // TODO
    });

    // Invocation kinds this scraper handles.
    // BuiltList<ScraperKind> supportedKinds
    test('to test the property `supportedKinds`', () async {
      // TODO
    });

    // True when all required credentials / config are present on this instance (e.g. YouTube requires an API key). Unconfigured scrapers are omitted from the registry entirely — this flag is always true for listed scrapers.
    // bool configured
    test('to test the property `configured`', () async {
      // TODO
    });

  });
}
