import 'package:test/test.dart';
import 'package:app_api_client/app_api_client.dart';


/// tests for AccountApi
void main() {
  final instance = AppApiClient().getAccountApi();

  group(AccountApi, () {
    // Sign out from every device EXCEPT the current session
    //
    // Revokes every session row for the calling user other than the one attached to the request. Useful from the settings page's \"Sign out from all devices\" affordance — the user stays signed in on the device they just clicked from. Returns 204. 
    //
    //Future signOutOtherSessions() async
    test('test signOutOtherSessions', () async {
      // TODO
    });

    // Patch the calling user's own profile
    //
    // Currently only `displayName` is mutable through this endpoint. Email change and avatar upload are handled separately (and are not yet wired). At least one field must be present in the body. 
    //
    //Future<MeDto> updateMe(UpdateMeRequest updateMeRequest) async
    test('test updateMe', () async {
      // TODO
    });

  });
}
