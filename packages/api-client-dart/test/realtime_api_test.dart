import 'package:test/test.dart';
import 'package:app_api_client/app_api_client.dart';


/// tests for RealtimeApi
void main() {
  final instance = AppApiClient().getRealtimeApi();

  group(RealtimeApi, () {
    // Issue a short-lived Centrifugo connection token
    //
    // Mints a short-lived HMAC-signed JWT that the client can use to connect to Centrifugo. Requires an active Better Auth session (cookie on web, bearer token on mobile). 
    //
    //Future<RealtimeToken> issueRealtimeToken() async
    test('test issueRealtimeToken', () async {
      // TODO
    });

  });
}
