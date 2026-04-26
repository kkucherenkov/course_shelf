# app_api_client.api.CatalogApi

## Load the API package
```dart
import 'package:app_api_client/api.dart';
```

All URIs are relative to *http://localhost:3000*

Method | HTTP request | Description
------------- | ------------- | -------------
[**getCourse**](CatalogApi.md#getcourse) | **GET** /api/v1/courses/{id} | Get a single course
[**getLatestLibraryScan**](CatalogApi.md#getlatestlibraryscan) | **GET** /api/v1/libraries/{id}/scans/latest | Get the most recent scan for a library
[**getLesson**](CatalogApi.md#getlesson) | **GET** /api/v1/lessons/{id} | Get a lesson with its materials and subtitles
[**getLibrary**](CatalogApi.md#getlibrary) | **GET** /api/v1/libraries/{id} | Get a library by id
[**listCourses**](CatalogApi.md#listcourses) | **GET** /api/v1/courses | List courses (optionally filtered by library)
[**listLibraries**](CatalogApi.md#listlibraries) | **GET** /api/v1/libraries | List all registered libraries
[**registerLibrary**](CatalogApi.md#registerlibrary) | **POST** /api/v1/libraries | Register a new library
[**runLibraryScan**](CatalogApi.md#runlibraryscan) | **POST** /api/v1/libraries/{id}/scans | Trigger a scan of a library
[**updateCourse**](CatalogApi.md#updatecourse) | **PATCH** /api/v1/courses/{id} | Update course metadata


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

