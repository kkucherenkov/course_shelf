import 'package:test/test.dart';
import 'package:app_api_client/app_api_client.dart';

// tests for BackupCreatedDto
void main() {
  final instance = BackupCreatedDtoBuilder();
  // TODO add properties to the builder and call build()

  group(BackupCreatedDto, () {
    // Identifier of the archive on the server. Unguessable on its own, but possession of the id is not sufficient to download — the signed token is still required.
    // String id
    test('to test the property `id`', () async {
      // TODO
    });

    // When the dump completed.
    // DateTime createdAt
    test('to test the property `createdAt`', () async {
      // TODO
    });

    // Size of the archive on disk, in bytes.
    // int sizeBytes
    test('to test the property `sizeBytes`', () async {
      // TODO
    });

    // Same-origin relative path carrying the signed token as the `token` query parameter, so a plain `<a href download>` works without an Authorization header. This route is intentionally absent from this specification (opaque byte stream).
    // String url
    test('to test the property `url`', () async {
      // TODO
    });

    // Opaque signed token. Same compact `header.payload.signature` shape as the streaming tokens, but signed with a key derived under a different HKDF info string, so a stream token can never be replayed against a backup and vice versa. Round-trip untouched.
    // String token
    test('to test the property `token`', () async {
      // TODO
    });

    // When the token stops being accepted. The archive stays on disk after this moment — expiry revokes the link, not the file.
    // DateTime expiresAt
    test('to test the property `expiresAt`', () async {
      // TODO
    });

  });
}
