import 'package:test/test.dart';
import 'package:app_api_client/app_api_client.dart';

// tests for RecordProgressRequest
void main() {
  final instance = RecordProgressRequestBuilder();
  // TODO add properties to the builder and call build()

  group(RecordProgressRequest, () {
    // Server-generated cuid identifying the lesson.
    // String lessonId
    test('to test the property `lessonId`', () async {
      // TODO
    });

    // Last reported watch position in seconds. Clamped server-side to `[0, durationSeconds]`.
    // int positionSeconds
    test('to test the property `positionSeconds`', () async {
      // TODO
    });

    // Lesson video duration in seconds. Clients pass the player's `duration` from the `loadedmetadata` event; it must match the server-side value once E06-F02-S02 (ffprobe) lands. v1 trusts the client value.
    // int durationSeconds
    test('to test the property `durationSeconds`', () async {
      // TODO
    });

    // ISO-8601 timestamp the client recorded the position. Out-of-order writes (older than the current `lastSeenAt`) are silently accepted and the response echoes the unchanged state.
    // DateTime clientUpdatedAt
    test('to test the property `clientUpdatedAt`', () async {
      // TODO
    });

  });
}
