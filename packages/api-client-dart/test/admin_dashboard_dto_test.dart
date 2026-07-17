import 'package:test/test.dart';
import 'package:app_api_client/app_api_client.dart';

// tests for AdminDashboardDto
void main() {
  final instance = AdminDashboardDtoBuilder();
  // TODO add properties to the builder and call build()

  group(AdminDashboardDto, () {
    // ISO-8601 instant when the snapshot was assembled (server clock).
    // DateTime generatedAt
    test('to test the property `generatedAt`', () async {
      // TODO
    });

    // AdminDashboardDtoCounts counts
    test('to test the property `counts`', () async {
      // TODO
    });

    // AdminDashboardLatestScan latestScan
    test('to test the property `latestScan`', () async {
      // TODO
    });

    // Count of `ScanErrorRecord` rows whose parent scan started within the last 24 hours (rolling window from `generatedAt`). Uses the parent scan's `startedAt` because the error record itself has no timestamp; works because no scan is expected to outlive a single 24-hour window. 
    // int errorsLast24h
    test('to test the property `errorsLast24h`', () async {
      // TODO
    });

  });
}
