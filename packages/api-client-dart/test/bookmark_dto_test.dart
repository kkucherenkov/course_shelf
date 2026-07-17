import 'package:test/test.dart';
import 'package:app_api_client/app_api_client.dart';

// tests for BookmarkDto
void main() {
  final instance = BookmarkDtoBuilder();
  // TODO add properties to the builder and call build()

  group(BookmarkDto, () {
    // Server-generated cuid identifying this bookmark.
    // String id
    test('to test the property `id`', () async {
      // TODO
    });

    // cuid of the lesson this bookmark belongs to.
    // String lessonId
    test('to test the property `lessonId`', () async {
      // TODO
    });

    // Playback position in seconds where the bookmark is pinned.
    // int positionSeconds
    test('to test the property `positionSeconds`', () async {
      // TODO
    });

    // Free-form label. Trimmed server-side; absent means the bookmark has no label.
    // String label
    test('to test the property `label`', () async {
      // TODO
    });

    // ISO-8601 instant when the bookmark was created.
    // DateTime createdAt
    test('to test the property `createdAt`', () async {
      // TODO
    });

    // ISO-8601 instant when the bookmark was last updated.
    // DateTime updatedAt
    test('to test the property `updatedAt`', () async {
      // TODO
    });

  });
}
