import 'package:test/test.dart';
import 'package:app_api_client/app_api_client.dart';

// tests for ExternalIdRef
void main() {
  final instance = ExternalIdRefBuilder();
  // TODO add properties to the builder and call build()

  group(ExternalIdRef, () {
    // Namespace identifying the external system (e.g. `udemy`, `youtube`). Scrapers are responsible for namespacing their ids (e.g. `youtube:playlist:PLxxx` vs `youtube:channel:UCyyy`).
    // String source_
    test('to test the property `source_`', () async {
      // TODO
    });

    // Identifier within the source system.
    // String externalId
    test('to test the property `externalId`', () async {
      // TODO
    });

    // Optional canonical URL of the entity on the source platform.
    // String url
    test('to test the property `url`', () async {
      // TODO
    });

  });
}
