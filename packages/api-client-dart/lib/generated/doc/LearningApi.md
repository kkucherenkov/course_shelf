# app_api_client.api.LearningApi

## Load the API package
```dart
import 'package:app_api_client/api.dart';
```

All URIs are relative to *http://localhost:3000*

Method | HTTP request | Description
------------- | ------------- | -------------
[**createBookmark**](LearningApi.md#createbookmark) | **POST** /api/v1/lessons/{lessonId}/bookmarks | Create a bookmark on a lesson
[**deleteBookmark**](LearningApi.md#deletebookmark) | **DELETE** /api/v1/bookmarks/{id} | Delete a bookmark
[**deleteNote**](LearningApi.md#deletenote) | **DELETE** /api/v1/notes/{lessonId} | Clear the requester&#39;s note for a lesson
[**getLessonProgress**](LearningApi.md#getlessonprogress) | **GET** /api/v1/progress/{lessonId} | Get the requester&#39;s progress on a lesson
[**getNote**](LearningApi.md#getnote) | **GET** /api/v1/notes/{lessonId} | Get the requester&#39;s note for a lesson
[**listLessonBookmarks**](LearningApi.md#listlessonbookmarks) | **GET** /api/v1/lessons/{lessonId}/bookmarks | List the requester&#39;s bookmarks for a lesson
[**recordLessonProgress**](LearningApi.md#recordlessonprogress) | **POST** /api/v1/progress | Record (upsert) the requester&#39;s progress on a lesson
[**updateBookmark**](LearningApi.md#updatebookmark) | **PATCH** /api/v1/bookmarks/{id} | Update a bookmark&#39;s position or label
[**upsertNote**](LearningApi.md#upsertnote) | **PUT** /api/v1/notes | Upsert the requester&#39;s note for a lesson


# **createBookmark**
> BookmarkDto createBookmark(lessonId, createBookmarkRequest)

Create a bookmark on a lesson

Bookmarks are personal — even your own admin role does not surface them in listings for other users. The body carries `positionSeconds` and an optional `label`. 

### Example
```dart
import 'package:app_api_client/api.dart';

final api = AppApiClient().getLearningApi();
final String lessonId = lessonId_example; // String | Server-generated cuid identifying the lesson.
final CreateBookmarkRequest createBookmarkRequest = {"positionSeconds":187,"label":"Aggregates intro"}; // CreateBookmarkRequest | 

try {
    final response = api.createBookmark(lessonId, createBookmarkRequest);
    print(response);
} on DioException catch (e) {
    print('Exception when calling LearningApi->createBookmark: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **lessonId** | **String**| Server-generated cuid identifying the lesson. | 
 **createBookmarkRequest** | [**CreateBookmarkRequest**](CreateBookmarkRequest.md)|  | 

### Return type

[**BookmarkDto**](BookmarkDto.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json, application/problem+json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **deleteBookmark**
> deleteBookmark(id)

Delete a bookmark

Owner-only. Admins may delete any bookmark for moderation.

### Example
```dart
import 'package:app_api_client/api.dart';

final api = AppApiClient().getLearningApi();
final String id = id_example; // String | Server-generated cuid identifying the bookmark to delete.

try {
    api.deleteBookmark(id);
} on DioException catch (e) {
    print('Exception when calling LearningApi->deleteBookmark: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **String**| Server-generated cuid identifying the bookmark to delete. | 

### Return type

void (empty response body)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/problem+json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **deleteNote**
> deleteNote(lessonId)

Clear the requester's note for a lesson

Idempotent: returns 204 even when no note exists. Owner-only — there is no concept of admin moderation for notes (notes are personal). 

### Example
```dart
import 'package:app_api_client/api.dart';

final api = AppApiClient().getLearningApi();
final String lessonId = lessonId_example; // String | Server-generated cuid identifying the lesson.

try {
    api.deleteNote(lessonId);
} on DioException catch (e) {
    print('Exception when calling LearningApi->deleteNote: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **lessonId** | **String**| Server-generated cuid identifying the lesson. | 

### Return type

void (empty response body)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/problem+json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

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

# **getNote**
> NoteDto getNote(lessonId)

Get the requester's note for a lesson

Returns the authenticated user's note for the given lesson. 403 is returned both when the requester has no READ grant covering the lesson and when the lesson does not exist — preventing existence leakage. 404 is returned only when the lesson exists but no note has been written yet. 

### Example
```dart
import 'package:app_api_client/api.dart';

final api = AppApiClient().getLearningApi();
final String lessonId = lessonId_example; // String | Server-generated cuid identifying the lesson.

try {
    final response = api.getNote(lessonId);
    print(response);
} on DioException catch (e) {
    print('Exception when calling LearningApi->getNote: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **lessonId** | **String**| Server-generated cuid identifying the lesson. | 

### Return type

[**NoteDto**](NoteDto.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json, application/problem+json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **listLessonBookmarks**
> BookmarkListDto listLessonBookmarks(lessonId)

List the requester's bookmarks for a lesson

Returns all bookmarks the authenticated user has created for the given lesson, sorted ascending by `positionSeconds`. An empty `items` array is returned when no bookmarks exist yet.

### Example
```dart
import 'package:app_api_client/api.dart';

final api = AppApiClient().getLearningApi();
final String lessonId = lessonId_example; // String | Server-generated cuid identifying the lesson.

try {
    final response = api.listLessonBookmarks(lessonId);
    print(response);
} on DioException catch (e) {
    print('Exception when calling LearningApi->listLessonBookmarks: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **lessonId** | **String**| Server-generated cuid identifying the lesson. | 

### Return type

[**BookmarkListDto**](BookmarkListDto.md)

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

# **updateBookmark**
> BookmarkDto updateBookmark(id, updateBookmarkRequest)

Update a bookmark's position or label

Owner-only. At least one of `positionSeconds` / `label` must be present. Pass `label: null` to clear an existing label. The server returns 400 on empty patches (no fields provided). 

### Example
```dart
import 'package:app_api_client/api.dart';

final api = AppApiClient().getLearningApi();
final String id = id_example; // String | Server-generated cuid identifying the bookmark to update.
final UpdateBookmarkRequest updateBookmarkRequest = {"positionSeconds":210,"label":"Aggregate boundaries explained"}; // UpdateBookmarkRequest | 

try {
    final response = api.updateBookmark(id, updateBookmarkRequest);
    print(response);
} on DioException catch (e) {
    print('Exception when calling LearningApi->updateBookmark: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **String**| Server-generated cuid identifying the bookmark to update. | 
 **updateBookmarkRequest** | [**UpdateBookmarkRequest**](UpdateBookmarkRequest.md)|  | 

### Return type

[**BookmarkDto**](BookmarkDto.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json, application/problem+json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **upsertNote**
> NoteDto upsertNote(upsertNoteRequest)

Upsert the requester's note for a lesson

Exactly one note exists per `(userId, lessonId)`. PUT semantics: replaces the existing note's body if any, otherwise creates a new one. Markdown is stored verbatim — the server does not render or sanitise. 

### Example
```dart
import 'package:app_api_client/api.dart';

final api = AppApiClient().getLearningApi();
final UpsertNoteRequest upsertNoteRequest = {"lessonId":"clxvles0000000000000000001","body":"## Aggregates\n\nKey insight: aggregates enforce invariants across their boundary."}; // UpsertNoteRequest | 

try {
    final response = api.upsertNote(upsertNoteRequest);
    print(response);
} on DioException catch (e) {
    print('Exception when calling LearningApi->upsertNote: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **upsertNoteRequest** | [**UpsertNoteRequest**](UpsertNoteRequest.md)|  | 

### Return type

[**NoteDto**](NoteDto.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json, application/problem+json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

