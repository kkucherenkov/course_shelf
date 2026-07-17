import 'package:test/test.dart';
import 'package:app_api_client/app_api_client.dart';

// tests for RealtimeToken
void main() {
  final instance = RealtimeTokenBuilder();
  // TODO add properties to the builder and call build()

  group(RealtimeToken, () {
    // Short-lived HMAC-signed JWT for Centrifugo
    // String token
    test('to test the property `token`', () async {
      // TODO
    });

    // ISO-8601 instant when the token expires
    // DateTime expiresAt
    test('to test the property `expiresAt`', () async {
      // TODO
    });

  });
}
