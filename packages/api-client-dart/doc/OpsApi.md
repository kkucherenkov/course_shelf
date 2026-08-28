# app_api_client.api.OpsApi

## Load the API package
```dart
import 'package:app_api_client/api.dart';
```

All URIs are relative to *http://localhost:3000*

Method | HTTP request | Description
------------- | ------------- | -------------
[**createBackup**](OpsApi.md#createbackup) | **POST** /api/v1/admin/backups | Create a metadata database snapshot and return a signed download URL
[**ping**](OpsApi.md#ping) | **GET** /api/v1/ping | Verify the bearer token resolves a session


# **createBackup**
> BackupCreatedDto createBackup()

Create a metadata database snapshot and return a signed download URL

Runs `pg_dump` against the metadata database and writes a single compressed archive to the server's backup directory, then returns a short-lived signed URL for downloading it. Admin only.  The archive is `pg_dump --format=custom`, so it carries the schema and the data together and is restored with `pg_restore` — no separate schema export is needed.  **Course media is not included.** Only the metadata database is dumped; the video and material files under `COURSES_PATH` are the operator's to back up. A restored database referencing files that are no longer on disk will surface as missing lessons, not as a corrupt install.  The download itself is **not described in this specification**, for the same reason the lesson-streaming routes are not: it returns an opaque byte stream, and the `url` in the response is what the client follows. See `docs/adr/0002-spec-first-openapi.md`.  `pg_dump` refuses to dump a server newer than itself. When the bundled client's major version does not match the server's, this endpoint fails with 503 and a problem detail naming both versions rather than writing a partial archive. 

### Example
```dart
import 'package:app_api_client/api.dart';

final api = AppApiClient().getOpsApi();

try {
    final response = api.createBackup();
    print(response);
} on DioException catch (e) {
    print('Exception when calling OpsApi->createBackup: $e\n');
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**BackupCreatedDto**](BackupCreatedDto.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json, application/problem+json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **ping**
> PingResponse ping()

Verify the bearer token resolves a session

Smoke-test endpoint for the authentication chain. Returns the requesting user's identity if the bearer token is valid; returns `401 Unauthorized` otherwise. Useful for clients that want to confirm their stored token is still good without making a real domain call. 

### Example
```dart
import 'package:app_api_client/api.dart';

final api = AppApiClient().getOpsApi();

try {
    final response = api.ping();
    print(response);
} on DioException catch (e) {
    print('Exception when calling OpsApi->ping: $e\n');
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**PingResponse**](PingResponse.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json, application/problem+json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

