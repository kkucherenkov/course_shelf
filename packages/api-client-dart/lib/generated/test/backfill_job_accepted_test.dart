import 'package:test/test.dart';
import 'package:app_api_client/app_api_client.dart';

// tests for BackfillJobAccepted
void main() {
  final instance = BackfillJobAcceptedBuilder();
  // TODO add properties to the builder and call build()

  group(BackfillJobAccepted, () {
    // Unique cuid identifying the background job. Subscribe to `maintenance:backfill:{jobId}` on Centrifugo for progress events.
    // String jobId
    test('to test the property `jobId`', () async {
      // TODO
    });

  });
}
