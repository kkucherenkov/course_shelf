import 'package:test/test.dart';
import 'package:app_api_client/app_api_client.dart';

// tests for StreamUrlDto
void main() {
  final instance = StreamUrlDtoBuilder();
  // TODO add properties to the builder and call build()

  group(StreamUrlDto, () {
    // URL the player should request. Same-origin relative path (e.g. `/api/v1/stream/lessons/<id>?token=…`) — the browser resolves it against the SPA's API origin so the backend doesn't need to know its public hostname. Carries the signed token as the `token` query parameter so existing video-element implementations work without an Authorization header.
    // String url
    test('to test the property `url`', () async {
      // TODO
    });

    // Opaque signed token. Format is internal to the backend (currently a JWT-like compact form `header.payload.signature`); clients must round-trip it untouched.
    // String token
    test('to test the property `token`', () async {
      // TODO
    });

    // ISO-8601 timestamp at which the token + URL stop being accepted. Clients should request a fresh URL before this moment.
    // DateTime expiresAt
    test('to test the property `expiresAt`', () async {
      // TODO
    });

  });
}
