# app_api_client.api.AccessApi

## Load the API package
```dart
import 'package:app_api_client/api.dart';
```

All URIs are relative to *http://localhost:3000*

Method | HTTP request | Description
------------- | ------------- | -------------
[**listGrantsByUser**](AccessApi.md#listgrantsbyuser) | **GET** /api/v1/access/grants | List a user&#39;s access grants
[**registerGrant**](AccessApi.md#registergrant) | **POST** /api/v1/access/grants | Grant a user READ access to a library or course
[**revokeGrant**](AccessApi.md#revokegrant) | **DELETE** /api/v1/access/grants/{id} | Revoke an access grant


# **listGrantsByUser**
> AccessGrantListDto listGrantsByUser(userId)

List a user's access grants

Returns every grant issued to the given user, both library- and course-scoped.

### Example
```dart
import 'package:app_api_client/api.dart';

final api = AppApiClient().getAccessApi();
final String userId = userId_example; // String | Better Auth user id whose grants should be returned.

try {
    final response = api.listGrantsByUser(userId);
    print(response);
} on DioException catch (e) {
    print('Exception when calling AccessApi->listGrantsByUser: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **userId** | **String**| Better Auth user id whose grants should be returned. | 

### Return type

[**AccessGrantListDto**](AccessGrantListDto.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json, application/problem+json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **registerGrant**
> AccessGrantDto registerGrant(registerGrantRequest)

Grant a user READ access to a library or course

Idempotent on (userId, target). Returns 409 if the same grant already exists. Only admins (`session.user.role === 'admin'`) may call this; other authenticated users get 403. 

### Example
```dart
import 'package:app_api_client/api.dart';

final api = AppApiClient().getAccessApi();
final RegisterGrantRequest registerGrantRequest = {"userId":"clxvusr0000000000000000001","target":{"kind":"library","libraryId":"clxvp1234567890abcdefghij"},"level":"READ"}; // RegisterGrantRequest | 

try {
    final response = api.registerGrant(registerGrantRequest);
    print(response);
} on DioException catch (e) {
    print('Exception when calling AccessApi->registerGrant: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **registerGrantRequest** | [**RegisterGrantRequest**](RegisterGrantRequest.md)|  | 

### Return type

[**AccessGrantDto**](AccessGrantDto.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json, application/problem+json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **revokeGrant**
> revokeGrant(id)

Revoke an access grant

Permanently removes the grant identified by `id`. The affected user immediately loses the access level the grant provided.

### Example
```dart
import 'package:app_api_client/api.dart';

final api = AppApiClient().getAccessApi();
final String id = id_example; // String | Server-generated cuid identifying the grant to revoke.

try {
    api.revokeGrant(id);
} on DioException catch (e) {
    print('Exception when calling AccessApi->revokeGrant: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **String**| Server-generated cuid identifying the grant to revoke. | 

### Return type

void (empty response body)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/problem+json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

