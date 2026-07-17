import 'package:test/test.dart';
import 'package:app_api_client/app_api_client.dart';

// tests for BatchProgressItemStale
void main() {
  final instance = BatchProgressItemStaleBuilder();
  // TODO add properties to the builder and call build()

  group(BatchProgressItemStale, () {
    // The client's `clientUpdatedAt` was older than the server's `lastSeenAt` for this lesson. The write was absorbed but the server already had newer state — the client should overwrite its local cache from `state`. 
    // String status
    test('to test the property `status`', () async {
      // TODO
    });

    // LessonProgressDto state
    test('to test the property `state`', () async {
      // TODO
    });

  });
}
