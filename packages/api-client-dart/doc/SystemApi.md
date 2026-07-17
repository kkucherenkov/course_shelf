# app_api_client.api.SystemApi

## Load the API package
```dart
import 'package:app_api_client/api.dart';
```

All URIs are relative to *http://localhost:3000*

Method | HTTP request | Description
------------- | ------------- | -------------
[**getHealth**](SystemApi.md#gethealth) | **GET** /api/v1/health | Service health probe


# **getHealth**
> HealthStatus getHealth()

Service health probe

Reports combined health status of the service and its runtime dependencies (database, cache, realtime bus). 

### Example
```dart
import 'package:app_api_client/api.dart';

final api = AppApiClient().getSystemApi();

try {
    final response = api.getHealth();
    print(response);
} on DioException catch (e) {
    print('Exception when calling SystemApi->getHealth: $e\n');
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**HealthStatus**](HealthStatus.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

