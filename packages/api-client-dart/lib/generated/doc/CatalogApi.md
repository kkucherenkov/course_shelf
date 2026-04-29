# app_api_client.api.CatalogApi

## Load the API package
```dart
import 'package:app_api_client/api.dart';
```

All URIs are relative to *http://localhost:3000*

Method | HTTP request | Description
------------- | ------------- | -------------
[**getContinueWatching**](CatalogApi.md#getcontinuewatching) | **GET** /api/v1/home/continue-watching | List courses the requester is in the middle of
[**getCourse**](CatalogApi.md#getcourse) | **GET** /api/v1/courses/{id} | Get a single course
[**getCourseOutline**](CatalogApi.md#getcourseoutline) | **GET** /api/v1/courses/{id}/outline | Full course outline — sections, lessons (lite), and aggregated materials
[**getLatestLibraryScan**](CatalogApi.md#getlatestlibraryscan) | **GET** /api/v1/libraries/{id}/scans/latest | Get the most recent scan for a library
[**getLesson**](CatalogApi.md#getlesson) | **GET** /api/v1/lessons/{id} | Get a lesson with its materials and subtitles
[**getLibrary**](CatalogApi.md#getlibrary) | **GET** /api/v1/libraries/{id} | Get a library by id
[**getRecentlyAdded**](CatalogApi.md#getrecentlyadded) | **GET** /api/v1/home/recently-added | Courses recently added to the requester&#39;s libraries
[**getRecentlyCompleted**](CatalogApi.md#getrecentlycompleted) | **GET** /api/v1/home/recently-completed | Courses the requester finished most recently
[**getYourWeek**](CatalogApi.md#getyourweek) | **GET** /api/v1/home/your-week | Roll-up of the requester&#39;s last seven days
[**listCourses**](CatalogApi.md#listcourses) | **GET** /api/v1/courses | List courses (optionally filtered by library)
[**listLibraries**](CatalogApi.md#listlibraries) | **GET** /api/v1/libraries | List all registered libraries
[**registerLibrary**](CatalogApi.md#registerlibrary) | **POST** /api/v1/libraries | Register a new library
[**removeLibrary**](CatalogApi.md#removelibrary) | **DELETE** /api/v1/libraries/{id} | Hard-delete a library and every dependent row
[**runLibraryScan**](CatalogApi.md#runlibraryscan) | **POST** /api/v1/libraries/{id}/scans | Trigger a scan of a library
[**updateCourse**](CatalogApi.md#updatecourse) | **PATCH** /api/v1/courses/{id} | Update course metadata
[**updateLibrary**](CatalogApi.md#updatelibrary) | **PATCH** /api/v1/libraries/{id} | Rename a library


# **getContinueWatching**
> ContinueWatchingDto getContinueWatching(limit)

List courses the requester is in the middle of

Returns the requester's courses ordered by recency (most-recently-watched first), capped by `limit`. Reads from a denormalised `CourseProgressReadModel` projection that's updated by `LessonCompleted` and `LessonProgressRecorded` events. Empty array for new users. 

### Example
```dart
import 'package:app_api_client/api.dart';

final api = AppApiClient().getCatalogApi();
final int limit = 56; // int | How many items the home row needs.

try {
    final response = api.getContinueWatching(limit);
    print(response);
} on DioException catch (e) {
    print('Exception when calling CatalogApi->getContinueWatching: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **limit** | **int**| How many items the home row needs. | [optional] [default to 10]

### Return type

[**ContinueWatchingDto**](ContinueWatchingDto.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json, application/problem+json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getCourse**
> CourseDto getCourse(id)

Get a single course

Returns the full CourseDto for one course by its server-generated cuid. Non-admins must hold a READ AccessGrant on the course's library.

### Example
```dart
import 'package:app_api_client/api.dart';

final api = AppApiClient().getCatalogApi();
final String id = id_example; // String | Server-generated cuid identifying the course.

try {
    final response = api.getCourse(id);
    print(response);
} on DioException catch (e) {
    print('Exception when calling CatalogApi->getCourse: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **String**| Server-generated cuid identifying the course. | 

### Return type

[**CourseDto**](CourseDto.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json, application/problem+json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getCourseOutline**
> CourseOutlineDto getCourseOutline(id)

Full course outline — sections, lessons (lite), and aggregated materials

Single round-trip endpoint feeding the Course detail page. Returns the course summary, every section with its lesson list (lightweight: title, duration, hasMaterials, per-user progress), and a flat list of course-level materials aggregated across all lessons. The dedicated outline avoids N+1 page fetches and never returns full LessonDtos (which would inflate the payload with subtitle tracks the page does not render).  Reads `Course` + `Section` + `Lesson` + `Material` + `LessonProgress` (filtered to the requester) + `CourseProgressReadModel` (for the aggregate progress percent). 

### Example
```dart
import 'package:app_api_client/api.dart';

final api = AppApiClient().getCatalogApi();
final String id = id_example; // String | Server-generated cuid identifying the course.

try {
    final response = api.getCourseOutline(id);
    print(response);
} on DioException catch (e) {
    print('Exception when calling CatalogApi->getCourseOutline: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **String**| Server-generated cuid identifying the course. | 

### Return type

[**CourseOutlineDto**](CourseOutlineDto.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json, application/problem+json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getLatestLibraryScan**
> ScanDto getLatestLibraryScan(id)

Get the most recent scan for a library

Returns the latest scan record regardless of status (running, succeeded, failed, cancelled).

### Example
```dart
import 'package:app_api_client/api.dart';

final api = AppApiClient().getCatalogApi();
final String id = id_example; // String | Server-generated cuid identifying the library.

try {
    final response = api.getLatestLibraryScan(id);
    print(response);
} on DioException catch (e) {
    print('Exception when calling CatalogApi->getLatestLibraryScan: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **String**| Server-generated cuid identifying the library. | 

### Return type

[**ScanDto**](ScanDto.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json, application/problem+json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getLesson**
> LessonDto getLesson(id)

Get a lesson with its materials and subtitles

Returns lesson metadata, sidecar materials (PDF / Markdown / text / image), and available subtitle tracks. Raw filesystem paths are intentionally absent from the response (NFR-S-01); the player obtains a signed stream token for the lesson video and the material/subtitle blobs separately. 

### Example
```dart
import 'package:app_api_client/api.dart';

final api = AppApiClient().getCatalogApi();
final String id = id_example; // String | Server-generated cuid identifying the lesson.

try {
    final response = api.getLesson(id);
    print(response);
} on DioException catch (e) {
    print('Exception when calling CatalogApi->getLesson: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **String**| Server-generated cuid identifying the lesson. | 

### Return type

[**LessonDto**](LessonDto.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json, application/problem+json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getLibrary**
> LibraryDto getLibrary(id)

Get a library by id

Returns a single library by its server-generated identifier.

### Example
```dart
import 'package:app_api_client/api.dart';

final api = AppApiClient().getCatalogApi();
final String id = id_example; // String | Server-generated cuid identifying the library.

try {
    final response = api.getLibrary(id);
    print(response);
} on DioException catch (e) {
    print('Exception when calling CatalogApi->getLibrary: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **String**| Server-generated cuid identifying the library. | 

### Return type

[**LibraryDto**](LibraryDto.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json, application/problem+json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getRecentlyAdded**
> RecentlyAddedDto getRecentlyAdded(limit)

Courses recently added to the requester's libraries

Returns courses ordered by `createdAt` (most recent first), capped by `limit`. Sourced from the `Course` table directly — no completion filter is applied (a brand-new user sees their library's recent intake even before any progress events). 

### Example
```dart
import 'package:app_api_client/api.dart';

final api = AppApiClient().getCatalogApi();
final int limit = 56; // int | How many items the home row needs.

try {
    final response = api.getRecentlyAdded(limit);
    print(response);
} on DioException catch (e) {
    print('Exception when calling CatalogApi->getRecentlyAdded: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **limit** | **int**| How many items the home row needs. | [optional] [default to 10]

### Return type

[**RecentlyAddedDto**](RecentlyAddedDto.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json, application/problem+json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getRecentlyCompleted**
> RecentlyCompletedDto getRecentlyCompleted(limit)

Courses the requester finished most recently

Returns courses where the requester completed the last lesson (`lessonsCompleted == lessonsTotal`), ordered by `lastSeenAt DESC` (which equals completion time for finished courses). Reads from the `CourseProgressReadModel` projection. 

### Example
```dart
import 'package:app_api_client/api.dart';

final api = AppApiClient().getCatalogApi();
final int limit = 56; // int | How many items the home row needs.

try {
    final response = api.getRecentlyCompleted(limit);
    print(response);
} on DioException catch (e) {
    print('Exception when calling CatalogApi->getRecentlyCompleted: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **limit** | **int**| How many items the home row needs. | [optional] [default to 10]

### Return type

[**RecentlyCompletedDto**](RecentlyCompletedDto.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json, application/problem+json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getYourWeek**
> YourWeekDto getYourWeek()

Roll-up of the requester's last seven days

Total minutes watched and lessons completed by the requester over the trailing seven days. `range.from` is `now - 7d`, `range.to` is `now`, both ISO-8601 with offset. Both counters are zero for new users. Sourced from `LessonProgress` (sum of completion-time contributions) and `CourseProgressReadModel.lessonsCompleted`. 

### Example
```dart
import 'package:app_api_client/api.dart';

final api = AppApiClient().getCatalogApi();

try {
    final response = api.getYourWeek();
    print(response);
} on DioException catch (e) {
    print('Exception when calling CatalogApi->getYourWeek: $e\n');
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**YourWeekDto**](YourWeekDto.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json, application/problem+json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **listCourses**
> CourseListDto listCourses(libraryId)

List courses (optionally filtered by library)

Returns courses the requester can see. Non-admins see only courses inside libraries they have a READ AccessGrant for; admins see all. 

### Example
```dart
import 'package:app_api_client/api.dart';

final api = AppApiClient().getCatalogApi();
final String libraryId = libraryId_example; // String | Filter to a single library; omit for everything visible.

try {
    final response = api.listCourses(libraryId);
    print(response);
} on DioException catch (e) {
    print('Exception when calling CatalogApi->listCourses: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **libraryId** | **String**| Filter to a single library; omit for everything visible. | [optional] 

### Return type

[**CourseListDto**](CourseListDto.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json, application/problem+json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **listLibraries**
> LibraryListDto listLibraries()

List all registered libraries

Returns all libraries the requester has READ access to. Admins see everything. 

### Example
```dart
import 'package:app_api_client/api.dart';

final api = AppApiClient().getCatalogApi();

try {
    final response = api.listLibraries();
    print(response);
} on DioException catch (e) {
    print('Exception when calling CatalogApi->listLibraries: $e\n');
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**LibraryListDto**](LibraryListDto.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json, application/problem+json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **registerLibrary**
> LibraryDto registerLibrary(registerLibraryRequest)

Register a new library

Persists a new library pointing at an absolute filesystem path. Idempotent on rootPath: a 409 is returned if a library with the same rootPath already exists. 

### Example
```dart
import 'package:app_api_client/api.dart';

final api = AppApiClient().getCatalogApi();
final RegisterLibraryRequest registerLibraryRequest = {"name":"Conference Recordings","rootPath":"/srv/courses/conference"}; // RegisterLibraryRequest | 

try {
    final response = api.registerLibrary(registerLibraryRequest);
    print(response);
} on DioException catch (e) {
    print('Exception when calling CatalogApi->registerLibrary: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **registerLibraryRequest** | [**RegisterLibraryRequest**](RegisterLibraryRequest.md)|  | 

### Return type

[**LibraryDto**](LibraryDto.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json, application/problem+json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **removeLibrary**
> removeLibrary(id)

Hard-delete a library and every dependent row

Admin-only destructive operation. Cascades through scans, courses (with sections/lessons/materials/subtitles), per-user progress, bookmarks, notes, and access grants. Files on disk are NOT touched — the library only exists in the DB; deletion just unlinks the folder from CourseShelf.  The cascade lives in a single Prisma `$transaction` so partial failures roll back. Idempotent: deleting an already-deleted id returns 404. 

### Example
```dart
import 'package:app_api_client/api.dart';

final api = AppApiClient().getCatalogApi();
final String id = id_example; // String | Server-generated cuid identifying the library.

try {
    api.removeLibrary(id);
} on DioException catch (e) {
    print('Exception when calling CatalogApi->removeLibrary: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **String**| Server-generated cuid identifying the library. | 

### Return type

void (empty response body)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/problem+json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **runLibraryScan**
> ScanDto runLibraryScan(id)

Trigger a scan of a library

Walks the library tree, recognises Course / Section / Lesson layout, and records discoveries on a Scan aggregate. Returns 202 immediately with `status: running`; clients poll `GET /libraries/{id}/scans/latest`. A second scan with no filesystem changes is observably a no-op (`filesAdded` and `filesUpdated` are zero). 

### Example
```dart
import 'package:app_api_client/api.dart';

final api = AppApiClient().getCatalogApi();
final String id = id_example; // String | Server-generated cuid identifying the library to scan.

try {
    final response = api.runLibraryScan(id);
    print(response);
} on DioException catch (e) {
    print('Exception when calling CatalogApi->runLibraryScan: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **String**| Server-generated cuid identifying the library to scan. | 

### Return type

[**ScanDto**](ScanDto.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json, application/problem+json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **updateCourse**
> CourseDto updateCourse(id, updateCourseRequest)

Update course metadata

Admin-only. Updates any combination of title / description / slug. Slug must be unique within the same library. At least one of `title`, `description`, or `slug` must be present (server-side validation rule — OpenAPI cannot express \"at-least-one\" natively). 

### Example
```dart
import 'package:app_api_client/api.dart';

final api = AppApiClient().getCatalogApi();
final String id = id_example; // String | Server-generated cuid identifying the course to update.
final UpdateCourseRequest updateCourseRequest = {"title":"Pragmatic Clean Architecture (2nd ed.)","slug":"pragmatic-clean-architecture-2nd-ed"}; // UpdateCourseRequest | 

try {
    final response = api.updateCourse(id, updateCourseRequest);
    print(response);
} on DioException catch (e) {
    print('Exception when calling CatalogApi->updateCourse: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **String**| Server-generated cuid identifying the course to update. | 
 **updateCourseRequest** | [**UpdateCourseRequest**](UpdateCourseRequest.md)|  | 

### Return type

[**CourseDto**](CourseDto.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json, application/problem+json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **updateLibrary**
> LibraryDto updateLibrary(id, updateLibraryRequest)

Rename a library

Admin-only mutation. Currently only the `name` field is mutable — changing `rootPath` would invalidate every scan and break stream URLs minted before the change, so it is intentionally not exposed here. Re-create the library if the disk path needs to change. 

### Example
```dart
import 'package:app_api_client/api.dart';

final api = AppApiClient().getCatalogApi();
final String id = id_example; // String | Server-generated cuid identifying the library.
final UpdateLibraryRequest updateLibraryRequest = {"name":"Conference Recordings (2026)"}; // UpdateLibraryRequest | 

try {
    final response = api.updateLibrary(id, updateLibraryRequest);
    print(response);
} on DioException catch (e) {
    print('Exception when calling CatalogApi->updateLibrary: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **String**| Server-generated cuid identifying the library. | 
 **updateLibraryRequest** | [**UpdateLibraryRequest**](UpdateLibraryRequest.md)|  | 

### Return type

[**LibraryDto**](LibraryDto.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json, application/problem+json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

