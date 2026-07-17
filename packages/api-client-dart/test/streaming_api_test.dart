import 'package:test/test.dart';
import 'package:app_api_client/app_api_client.dart';


/// tests for StreamingApi
void main() {
  final instance = AppApiClient().getStreamingApi();

  group(StreamingApi, () {
    // Mint a short-lived signed URL to download a lesson material
    //
    // Returns a URL pointing at `/api/v1/stream/materials/{materialId}` with a signed query-param token bound to `(userId, materialId, expiresAt)`. The token is HMAC-signed with a different scope than the video stream token so a video token cannot be re-used to fetch a material (and vice versa). The streaming endpoint verifies the token without a database lookup. Default TTL is 5 minutes — short because clicking a download link should resolve immediately.  Authorization mirrors `issueStreamUrl`: the requester must have a READ grant on the parent library or course, or be an admin. 
    //
    //Future<MaterialDownloadUrlDto> issueMaterialDownloadUrl(String lessonId, String materialId) async
    test('test issueMaterialDownloadUrl', () async {
      // TODO
    });

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
