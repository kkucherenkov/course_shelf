import 'package:test/test.dart';
import 'package:app_api_client/app_api_client.dart';

// tests for StudioRef
void main() {
  final instance = StudioRefBuilder();
  // TODO add properties to the builder and call build()

  group(StudioRef, () {
    // Server-generated cuid of the studio.
    // String id
    test('to test the property `id`', () async {
      // TODO
    });

    // URL-safe slug. 1–100 chars, lowercase ASCII letters, digits, and hyphens; cannot start or end with a hyphen. Shared by Instructor, Studio, and Tag aggregates.
    // String slug
    test('to test the property `slug`', () async {
      // TODO
    });

    // String displayName
    test('to test the property `displayName`', () async {
      // TODO
    });

  });
}
