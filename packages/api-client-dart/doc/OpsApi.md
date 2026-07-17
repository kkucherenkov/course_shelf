# app_api_client.api.OpsApi

## Load the API package
```dart
import 'package:app_api_client/api.dart';
```

All URIs are relative to *http://localhost:3000*

Method | HTTP request | Description
------------- | ------------- | -------------
[**ping**](OpsApi.md#ping) | **GET** /api/v1/ping | Verify the bearer token resolves a session


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

