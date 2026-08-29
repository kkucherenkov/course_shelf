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
[**streamLessonSubtitle**](StreamingApi.md#streamlessonsubtitle) | **GET** /api/v1/stream/lessons/{id}/subtitles/{language} | Serve a lesson&#39;s subtitle track as WebVTT
[**streamLessonVideo**](StreamingApi.md#streamlessonvideo) | **GET** /api/v1/stream/lessons/{id} | Stream a lesson&#39;s video, with byte-range support
[**streamMaterial**](StreamingApi.md#streammaterial) | **GET** /api/v1/stream/materials/{materialId} | Download a lesson material


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

# **streamLessonSubtitle**
> String streamLessonSubtitle(id, language, token)

Serve a lesson's subtitle track as WebVTT

Always `text/vtt`, whatever the source was: an `.srt` sidecar is converted on the fly and the result cached next to it as `*.cache.vtt` (which the scanner then knows to ignore).  Same token as the video endpoint — a `<track>` element cannot send an Authorization header either. 

### Example
```dart
import 'package:app_api_client/api.dart';

final api = AppApiClient().getStreamingApi();
final String id = id_example; // String | Lesson cuid.
final String language = language_example; // String | Language code as discovered by the scan, e.g. `en`.
final String token = token_example; // String | 

try {
    final response = api.streamLessonSubtitle(id, language, token);
    print(response);
} on DioException catch (e) {
    print('Exception when calling StreamingApi->streamLessonSubtitle: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **String**| Lesson cuid. | 
 **language** | **String**| Language code as discovered by the scan, e.g. `en`. | 
 **token** | **String**|  | 

### Return type

**String**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: text/vtt, application/problem+json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **streamLessonVideo**
> Uint8List streamLessonVideo(id, token, range)

Stream a lesson's video, with byte-range support

Progressive HTTP delivery — no HLS, no DASH, no transcoding (ADR-0009). Honours `Range`, so seeking is a 206 rather than a re-download.  Authenticated by the `token` query parameter minted by `GET /api/v1/lessons/{id}/stream-url`, not by a session: a `<video>` element cannot send an Authorization header. The token is bound to `(userId, lessonId, expiresAt)` and lives 15 minutes by default.  Responds with `Cross-Origin-Resource-Policy: cross-origin` so the SPA can embed it from the proxy origin, the bare Nuxt origin, or a production domain. 

### Example
```dart
import 'package:app_api_client/api.dart';

final api = AppApiClient().getStreamingApi();
final String id = id_example; // String | Lesson cuid.
final String token = token_example; // String | Signed stream token from `issueStreamUrl`.
final String range = range_example; // String | Standard byte range, e.g. `bytes=0-1048575`.

try {
    final response = api.streamLessonVideo(id, token, range);
    print(response);
} on DioException catch (e) {
    print('Exception when calling StreamingApi->streamLessonVideo: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **String**| Lesson cuid. | 
 **token** | **String**| Signed stream token from `issueStreamUrl`. | 
 **range** | **String**| Standard byte range, e.g. `bytes=0-1048575`. | [optional] 

### Return type

[**Uint8List**](Uint8List.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/octet-stream, application/problem+json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **streamMaterial**
> Uint8List streamMaterial(materialId, token)

Download a lesson material

Serves a course material (PDF, slides, an image) as an attachment.  Uses a **material-scoped** token from `GET /api/v1/lessons/{lessonId}/materials/{materialId}/download-url`, distinct from the video token: it embeds the owning `lessonId`, and the handler re-checks that the material still belongs to that lesson — token binding plus a database check, rather than either alone. 

### Example
```dart
import 'package:app_api_client/api.dart';

final api = AppApiClient().getStreamingApi();
final String materialId = materialId_example; // String | Material cuid.
final String token = token_example; // String | Signed material token from `issueMaterialDownloadUrl`.

try {
    final response = api.streamMaterial(materialId, token);
    print(response);
} on DioException catch (e) {
    print('Exception when calling StreamingApi->streamMaterial: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **materialId** | **String**| Material cuid. | 
 **token** | **String**| Signed material token from `issueMaterialDownloadUrl`. | 

### Return type

[**Uint8List**](Uint8List.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/octet-stream, application/problem+json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

