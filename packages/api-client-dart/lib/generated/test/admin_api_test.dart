import 'package:test/test.dart';
import 'package:app_api_client/app_api_client.dart';


/// tests for AdminApi
void main() {
  final instance = AppApiClient().getAdminApi();

  group(AdminApi, () {
    // Operational snapshot for the admin dashboard
    //
    // Returns counts of major entities (libraries, users, courses, lessons), a summary of the most recent scan (if any), and the count of scan errors collected in the last 24 hours. Read-only — no side effects. 
    //
    //Future<AdminDashboardDto> getAdminDashboard() async
    test('test getAdminDashboard', () async {
      // TODO
    });

  });
}
