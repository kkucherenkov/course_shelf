import 'package:test/test.dart';
import 'package:app_api_client/app_api_client.dart';


/// tests for AccessApi
void main() {
  final instance = AppApiClient().getAccessApi();

  group(AccessApi, () {
    // List a user's access grants
    //
    // Returns every grant issued to the given user, both library- and course-scoped.
    //
    //Future<AccessGrantListDto> listGrantsByUser(String userId) async
    test('test listGrantsByUser', () async {
      // TODO
    });

    // Grant a user READ access to a library or course
    //
    // Idempotent on (userId, target). Returns 409 if the same grant already exists. Only admins (`session.user.role === 'admin'`) may call this; other authenticated users get 403. 
    //
    //Future<AccessGrantDto> registerGrant(RegisterGrantRequest registerGrantRequest) async
    test('test registerGrant', () async {
      // TODO
    });

    // Revoke an access grant
    //
    // Permanently removes the grant identified by `id`. The affected user immediately loses the access level the grant provided.
    //
    //Future revokeGrant(String id) async
    test('test revokeGrant', () async {
      // TODO
    });

  });
}
