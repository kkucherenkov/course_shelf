import 'package:test/test.dart';
import 'package:app_api_client/app_api_client.dart';

// tests for StudioDto
void main() {
  final instance = StudioDtoBuilder();
  // TODO add properties to the builder and call build()

  group(StudioDto, () {
    // Server-generated cuid.
    // String id
    test('to test the property `id`', () async {
      // TODO
    });

    // URL-safe slug. 1–100 chars, lowercase ASCII letters, digits, and hyphens; cannot start or end with a hyphen. Shared by Instructor, Studio, and Tag aggregates.
    // String slug
    test('to test the property `slug`', () async {
      // TODO
    });

    // Human-readable studio name.
    // String displayName
    test('to test the property `displayName`', () async {
      // TODO
    });

    // External system references for this studio.
    // BuiltList<ExternalIdRef> externalIds
    test('to test the property `externalIds`', () async {
      // TODO
    });

    // Total number of courses linked to this studio.
    // int coursesTotal
    test('to test the property `coursesTotal`', () async {
      // TODO
    });

    // DateTime createdAt
    test('to test the property `createdAt`', () async {
      // TODO
    });

    // DateTime updatedAt
    test('to test the property `updatedAt`', () async {
      // TODO
    });

  });
}
