# app_api_client.api.StreamingApi

## Load the API package
```dart
import 'package:app_api_client/api.dart';
```

All URIs are relative to *http://localhost:3000*

Method | HTTP request | Description
------------- | ------------- | -------------
[**issueMaterialDownloadUrl**](StreamingApi.md#issuematerialdownloadurl) | **GET** /api/v1/lessons/{lessonId}/materials/{materialId}/download-url | Mint a short-lived signed URL to download a lesson material
[**issueStreamUrl**](StreamingApi.md#issuestreamurl) | **GET** /api/v1/lessons/{id}/stream-url | Mint a short-lived signed URL for a lesson video


# **issueMaterialDownloadUrl**
> MaterialDownloadUrlDto issueMaterialDownloadUrl(lessonId, materialId)

Mint a short-lived signed URL to download a lesson material

Returns a URL pointing at `/api/v1/stream/materials/{materialId}` with a signed query-param token bound to `(userId, materialId, expiresAt)`. The token is HMAC-signed with a different scope than the video stream token so a video token cannot be re-used to fetch a material (and vice versa). The streaming endpoint verifies the token without a database lookup. Default TTL is 5 minutes — short because clicking a download link should resolve immediately.  Authorization mirrors `issueStreamUrl`: the requester must have a READ grant on the parent library or course, or be an admin. 

### Example
```dart
import 'package:app_api_client/api.dart';

final api = AppApiClient().getStreamingApi();
final String lessonId = lessonId_example; // String | Server-generated cuid identifying the parent lesson.
final String materialId = materialId_example; // String | Server-generated cuid identifying the material.

try {
    final response = api.issueMaterialDownloadUrl(lessonId, materialId);
    print(response);
} on DioException catch (e) {
    print('Exception when calling StreamingApi->issueMaterialDownloadUrl: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **lessonId** | **String**| Server-generated cuid identifying the parent lesson. | 
 **materialId** | **String**| Server-generated cuid identifying the material. | 

### Return type

[**MaterialDownloadUrlDto**](MaterialDownloadUrlDto.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json, application/problem+json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

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

