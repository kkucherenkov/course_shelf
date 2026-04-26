# app_api_client.api.LearningApi

## Load the API package
```dart
import 'package:app_api_client/api.dart';
```

All URIs are relative to *http://localhost:3000*

Method | HTTP request | Description
------------- | ------------- | -------------
[**getLessonProgress**](LearningApi.md#getlessonprogress) | **GET** /api/v1/progress/{lessonId} | Get the requester&#39;s progress on a lesson
[**recordLessonProgress**](LearningApi.md#recordlessonprogress) | **POST** /api/v1/progress | Record (upsert) the requester&#39;s progress on a lesson


# **getLessonProgress**
> LessonProgressDto getLessonProgress(lessonId)

Get the requester's progress on a lesson

Returns the current progress record for the requesting user on the given lesson. 403 is returned both when the requester has no READ grant covering the lesson **and** when the lesson does not exist — preventing existence leakage. 404 is returned only when the lesson exists but the requester has not yet recorded any progress. 

### Example
```dart
import 'package:app_api_client/api.dart';

final api = AppApiClient().getLearningApi();
final String lessonId = lessonId_example; // String | Server-generated cuid identifying the lesson.

try {
    final response = api.getLessonProgress(lessonId);
    print(response);
} on DioException catch (e) {
    print('Exception when calling LearningApi->getLessonProgress: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **lessonId** | **String**| Server-generated cuid identifying the lesson. | 

### Return type

[**LessonProgressDto**](LessonProgressDto.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json, application/problem+json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **recordLessonProgress**
> LessonProgressDto recordLessonProgress(recordProgressRequest)

Record (upsert) the requester's progress on a lesson

Last-write-wins on `clientUpdatedAt`: out-of-order writes (older timestamp than the current state) are silently accepted with the prior state echoed back. The first write that crosses 90 % completion sets `completed: true` and stamps `completedAt`; subsequent writes do not re-emit completion. Always returns the post-merge state — clients can use it to detect whether their write was the one that bumped the counter. 

### Example
```dart
import 'package:app_api_client/api.dart';

final api = AppApiClient().getLearningApi();
final RecordProgressRequest recordProgressRequest = {"lessonId":"clxvles0000000000000000001","positionSeconds":1080,"durationSeconds":1800,"clientUpdatedAt":"2026-04-25T14:32:00Z"}; // RecordProgressRequest | 

try {
    final response = api.recordLessonProgress(recordProgressRequest);
    print(response);
} on DioException catch (e) {
    print('Exception when calling LearningApi->recordLessonProgress: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **recordProgressRequest** | [**RecordProgressRequest**](RecordProgressRequest.md)|  | 

### Return type

[**LessonProgressDto**](LessonProgressDto.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json, application/problem+json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

