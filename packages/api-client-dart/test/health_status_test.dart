import 'package:test/test.dart';
import 'package:app_api_client/app_api_client.dart';

// tests for HealthStatus
void main() {
  final instance = HealthStatusBuilder();
  // TODO add properties to the builder and call build()

  group(HealthStatus, () {
    // DependencyStatus status
    test('to test the property `status`', () async {
      // TODO
    });

    // Semantic version of the running backend build
    // String version
    test('to test the property `version`', () async {
      // TODO
    });

    // Seconds since the backend process started
    // int uptimeSeconds
    test('to test the property `uptimeSeconds`', () async {
      // TODO
    });

    // HealthStatusDependencies dependencies
    test('to test the property `dependencies`', () async {
      // TODO
    });

  });
}
