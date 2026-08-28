# app_api_client.model.BackupCreatedDto

## Load the model package
```dart
import 'package:app_api_client/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **String** | Identifier of the archive on the server. Unguessable on its own, but possession of the id is not sufficient to download — the signed token is still required. | 
**createdAt** | [**DateTime**](DateTime.md) | When the dump completed. | 
**sizeBytes** | **int** | Size of the archive on disk, in bytes. | 
**url** | **String** | Same-origin relative path carrying the signed token as the `token` query parameter, so a plain `<a href download>` works without an Authorization header. This route is intentionally absent from this specification (opaque byte stream). | 
**token** | **String** | Opaque signed token. Same compact `header.payload.signature` shape as the streaming tokens, but signed with a key derived under a different HKDF info string, so a stream token can never be replayed against a backup and vice versa. Round-trip untouched. | 
**expiresAt** | [**DateTime**](DateTime.md) | When the token stops being accepted. The archive stays on disk after this moment — expiry revokes the link, not the file. | 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


