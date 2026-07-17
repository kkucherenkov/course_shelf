# app_api_client.api.RealtimeApi

## Load the API package
```dart
import 'package:app_api_client/api.dart';
```

All URIs are relative to *http://localhost:3000*

Method | HTTP request | Description
------------- | ------------- | -------------
[**issueRealtimeToken**](RealtimeApi.md#issuerealtimetoken) | **POST** /api/v1/realtime/token | Issue a short-lived Centrifugo connection token


# **issueRealtimeToken**
> RealtimeToken issueRealtimeToken()

Issue a short-lived Centrifugo connection token

Mints a short-lived HMAC-signed JWT that the client can use to connect to Centrifugo. Requires an active Better Auth session (cookie on web, bearer token on mobile). 

### Example
```dart
import 'package:app_api_client/api.dart';
// TODO Configure API key authorization: cookieAuth
//defaultApiClient.getAuthentication<ApiKeyAuth>('cookieAuth').apiKey = 'YOUR_API_KEY';
// uncomment below to setup prefix (e.g. Bearer) for API key, if needed
//defaultApiClient.getAuthentication<ApiKeyAuth>('cookieAuth').apiKeyPrefix = 'Bearer';

final api = AppApiClient().getRealtimeApi();

try {
    final response = api.issueRealtimeToken();
    print(response);
} on DioException catch (e) {
    print('Exception when calling RealtimeApi->issueRealtimeToken: $e\n');
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**RealtimeToken**](RealtimeToken.md)

### Authorization

[cookieAuth](../README.md#cookieAuth), [bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json, application/problem+json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

