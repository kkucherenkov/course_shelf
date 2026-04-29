import 'package:test/test.dart';
import 'package:app_api_client/app_api_client.dart';

// tests for MaterialDownloadUrlDto
void main() {
  final instance = MaterialDownloadUrlDtoBuilder();
  // TODO add properties to the builder and call build()

  group(MaterialDownloadUrlDto, () {
    // URL the browser should fetch. Same-origin relative path (e.g. `/api/v1/stream/materials/<id>?token=…`). Carries the signed token as the `token` query parameter so a direct `<a href download>` works without an Authorization header.
    // String url
    test('to test the property `url`', () async {
      // TODO
    });

    // Opaque signed token. Internal format is the same compact `header.payload.signature` shape as the video stream token, but the payload's scope claim differs so a video token can never be re-used to fetch a material (and vice versa). Round-trip untouched.
    // String token
    test('to test the property `token`', () async {
      // TODO
    });

    // ISO-8601 timestamp at which the token + URL stop being accepted. Default TTL is 5 minutes — clicking a download link should resolve immediately, so a long TTL is unnecessary.
    // DateTime expiresAt
    test('to test the property `expiresAt`', () async {
      // TODO
    });

  });
}
