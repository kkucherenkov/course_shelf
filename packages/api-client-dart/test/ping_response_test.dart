import 'package:test/test.dart';
import 'package:app_api_client/app_api_client.dart';

// tests for PingResponse
void main() {
  final instance = PingResponseBuilder();
  // TODO add properties to the builder and call build()

  group(PingResponse, () {
    // User id (UUID v4) — Better Auth's internal identifier.
    // String id
    test('to test the property `id`', () async {
      // TODO
    });

    // Role string from Better Auth's `additionalFields.role`. Default `USER` for fresh sign-ups; admin tooling may assign others. 
    // String role
    test('to test the property `role`', () async {
      // TODO
    });

    // Optional friendly label set by the user in their profile.
    // String displayName
    test('to test the property `displayName`', () async {
      // TODO
    });

  });
}
