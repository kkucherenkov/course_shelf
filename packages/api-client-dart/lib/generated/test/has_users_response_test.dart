import 'package:test/test.dart';
import 'package:app_api_client/app_api_client.dart';

// tests for HasUsersResponse
void main() {
  final instance = HasUsersResponseBuilder();
  // TODO add properties to the builder and call build()

  group(HasUsersResponse, () {
    // True iff `users` table count > 0. The web SPA caches this for the session lifetime and re-checks only when the user explicitly signs out + back in. 
    // bool hasUsers
    test('to test the property `hasUsers`', () async {
      // TODO
    });

  });
}
