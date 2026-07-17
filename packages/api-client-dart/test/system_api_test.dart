import 'package:test/test.dart';
import 'package:app_api_client/app_api_client.dart';


/// tests for SystemApi
void main() {
  final instance = AppApiClient().getSystemApi();

  group(SystemApi, () {
    // Service health probe
    //
    // Reports combined health status of the service and its runtime dependencies (database, cache, realtime bus). 
    //
    //Future<HealthStatus> getHealth() async
    test('test getHealth', () async {
      // TODO
    });

  });
}
