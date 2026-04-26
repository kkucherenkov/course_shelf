import 'package:test/test.dart';
import 'package:app_api_client/app_api_client.dart';


/// tests for StreamingApi
void main() {
  final instance = AppApiClient().getStreamingApi();

  group(StreamingApi, () {
    // Mint a short-lived signed URL for a lesson video
    //
    // Returns a URL pointing at `/api/v1/stream/lessons/{id}` with a signed query-param token bound to `(userId, lessonId, expiresAt)`. The token is HMAC-signed; the streaming endpoint verifies it without a database lookup. Default TTL is 15 minutes (configurable server-side). Clients must request a fresh URL when the previous one expires — refresh policy is up to the player. 
    //
    //Future<StreamUrlDto> issueStreamUrl(String id) async
    test('test issueStreamUrl', () async {
      // TODO
    });

  });
}
