# app_api_client.api.AccountApi

## Load the API package
```dart
import 'package:app_api_client/api.dart';
```

All URIs are relative to *http://localhost:3000*

Method | HTTP request | Description
------------- | ------------- | -------------
[**signOutOtherSessions**](AccountApi.md#signoutothersessions) | **POST** /api/v1/me/sign-out-others | Sign out from every device EXCEPT the current session
[**updateMe**](AccountApi.md#updateme) | **PATCH** /api/v1/me | Patch the calling user&#39;s own profile


# **signOutOtherSessions**
> signOutOtherSessions()

Sign out from every device EXCEPT the current session

Revokes every session row for the calling user other than the one attached to the request. Useful from the settings page's \"Sign out from all devices\" affordance — the user stays signed in on the device they just clicked from. Returns 204. 

### Example
```dart
import 'package:app_api_client/api.dart';

final api = AppApiClient().getAccountApi();

try {
    api.signOutOtherSessions();
} on DioException catch (e) {
    print('Exception when calling AccountApi->signOutOtherSessions: $e\n');
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

void (empty response body)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/problem+json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **updateMe**
> MeDto updateMe(updateMeRequest)

Patch the calling user's own profile

Currently only `displayName` is mutable through this endpoint. Email change and avatar upload are handled separately (and are not yet wired). At least one field must be present in the body. 

### Example
```dart
import 'package:app_api_client/api.dart';

final api = AppApiClient().getAccountApi();
final UpdateMeRequest updateMeRequest = {"displayName":"Elena"}; // UpdateMeRequest | 

try {
    final response = api.updateMe(updateMeRequest);
    print(response);
} on DioException catch (e) {
    print('Exception when calling AccountApi->updateMe: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **updateMeRequest** | [**UpdateMeRequest**](UpdateMeRequest.md)|  | 

### Return type

[**MeDto**](MeDto.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json, application/problem+json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

