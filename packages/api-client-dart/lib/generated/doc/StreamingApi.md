# app_api_client.api.StreamingApi

## Load the API package
```dart
import 'package:app_api_client/api.dart';
```

All URIs are relative to *http://localhost:3000*

Method | HTTP request | Description
------------- | ------------- | -------------
[**issueStreamUrl**](StreamingApi.md#issuestreamurl) | **GET** /api/v1/lessons/{id}/stream-url | Mint a short-lived signed URL for a lesson video


# **issueStreamUrl**
> StreamUrlDto issueStreamUrl(id)

Mint a short-lived signed URL for a lesson video

Returns a URL pointing at `/api/v1/stream/lessons/{id}` with a signed query-param token bound to `(userId, lessonId, expiresAt)`. The token is HMAC-signed; the streaming endpoint verifies it without a database lookup. Default TTL is 15 minutes (configurable server-side). Clients must request a fresh URL when the previous one expires — refresh policy is up to the player. 

### Example
```dart
import 'package:app_api_client/api.dart';

final api = AppApiClient().getStreamingApi();
final String id = id_example; // String | Server-generated cuid identifying the lesson.

try {
    final response = api.issueStreamUrl(id);
    print(response);
} on DioException catch (e) {
    print('Exception when calling StreamingApi->issueStreamUrl: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **String**| Server-generated cuid identifying the lesson. | 

### Return type

[**StreamUrlDto**](StreamUrlDto.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json, application/problem+json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

