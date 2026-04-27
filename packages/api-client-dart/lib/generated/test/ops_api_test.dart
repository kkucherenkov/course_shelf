import 'package:test/test.dart';
import 'package:app_api_client/app_api_client.dart';


/// tests for OpsApi
void main() {
  final instance = AppApiClient().getOpsApi();

  group(OpsApi, () {
    // Verify the bearer token resolves a session
    //
    // Smoke-test endpoint for the authentication chain. Returns the requesting user's identity if the bearer token is valid; returns `401 Unauthorized` otherwise. Useful for clients that want to confirm their stored token is still good without making a real domain call. 
    //
    //Future<PingResponse> ping() async
    test('test ping', () async {
      // TODO
    });

  });
}
