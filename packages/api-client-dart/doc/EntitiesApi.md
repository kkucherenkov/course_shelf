# app_api_client.api.EntitiesApi

## Load the API package
```dart
import 'package:app_api_client/api.dart';
```

All URIs are relative to *http://localhost:3000*

Method | HTTP request | Description
------------- | ------------- | -------------
[**getInstructor**](EntitiesApi.md#getinstructor) | **GET** /api/v1/catalog/instructors/{slug} | Get a single instructor by slug
[**getStudio**](EntitiesApi.md#getstudio) | **GET** /api/v1/catalog/studios/{slug} | Get a single studio by slug
[**getTag**](EntitiesApi.md#gettag) | **GET** /api/v1/catalog/tags/{slug} | Get a single tag by slug
[**listInstructors**](EntitiesApi.md#listinstructors) | **GET** /api/v1/catalog/instructors | List instructors with optional search
[**listStudios**](EntitiesApi.md#liststudios) | **GET** /api/v1/catalog/studios | List studios with optional search
[**listTags**](EntitiesApi.md#listtags) | **GET** /api/v1/catalog/tags | List tags with optional search and category filter
[**upsertInstructor**](EntitiesApi.md#upsertinstructor) | **POST** /api/v1/admin/instructors | Create or update an instructor
[**upsertStudio**](EntitiesApi.md#upsertstudio) | **POST** /api/v1/admin/studios | Create or update a studio
[**upsertTag**](EntitiesApi.md#upserttag) | **POST** /api/v1/admin/tags | Create or update a tag


# **getInstructor**
> InstructorDetailDto getInstructor(slug)

Get a single instructor by slug

Returns the instructor details plus a list of their associated courses.

### Example
```dart
import 'package:app_api_client/api.dart';

final api = AppApiClient().getEntitiesApi();
final String slug = slug_example; // String | URL-safe slug identifying the instructor.

try {
    final response = api.getInstructor(slug);
    print(response);
} on DioException catch (e) {
    print('Exception when calling EntitiesApi->getInstructor: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **slug** | **String**| URL-safe slug identifying the instructor. | 

### Return type

[**InstructorDetailDto**](InstructorDetailDto.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json, application/problem+json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getStudio**
> StudioDetailDto getStudio(slug)

Get a single studio by slug

Returns the studio details plus a list of their associated courses.

### Example
```dart
import 'package:app_api_client/api.dart';

final api = AppApiClient().getEntitiesApi();
final String slug = slug_example; // String | URL-safe slug identifying the studio.

try {
    final response = api.getStudio(slug);
    print(response);
} on DioException catch (e) {
    print('Exception when calling EntitiesApi->getStudio: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **slug** | **String**| URL-safe slug identifying the studio. | 

### Return type

[**StudioDetailDto**](StudioDetailDto.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json, application/problem+json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getTag**
> TagDetailDto getTag(slug)

Get a single tag by slug

Returns the tag details plus a list of associated courses.

### Example
```dart
import 'package:app_api_client/api.dart';

final api = AppApiClient().getEntitiesApi();
final String slug = slug_example; // String | URL-safe slug identifying the tag.

try {
    final response = api.getTag(slug);
    print(response);
} on DioException catch (e) {
    print('Exception when calling EntitiesApi->getTag: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **slug** | **String**| URL-safe slug identifying the tag. | 

### Return type

[**TagDetailDto**](TagDetailDto.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json, application/problem+json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **listInstructors**
> InstructorListDto listInstructors(offset, limit, search)

List instructors with optional search

Returns a paginated list of instructors. The optional `search` parameter performs a case-insensitive substring match on `displayName`. Results are ordered by `displayName` ascending. 

### Example
```dart
import 'package:app_api_client/api.dart';

final api = AppApiClient().getEntitiesApi();
final int offset = 56; // int | Number of items to skip (zero-based).
final int limit = 56; // int | Maximum number of items to return.
final String search = search_example; // String | Case-insensitive substring filter on `displayName`.

try {
    final response = api.listInstructors(offset, limit, search);
    print(response);
} on DioException catch (e) {
    print('Exception when calling EntitiesApi->listInstructors: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **offset** | **int**| Number of items to skip (zero-based). | [optional] [default to 0]
 **limit** | **int**| Maximum number of items to return. | [optional] [default to 20]
 **search** | **String**| Case-insensitive substring filter on `displayName`. | [optional] 

### Return type

[**InstructorListDto**](InstructorListDto.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json, application/problem+json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **listStudios**
> StudioListDto listStudios(offset, limit, search)

List studios with optional search

Returns a paginated list of studios. The optional `search` parameter performs a case-insensitive substring match on `displayName`. Results are ordered by `displayName` ascending. 

### Example
```dart
import 'package:app_api_client/api.dart';

final api = AppApiClient().getEntitiesApi();
final int offset = 56; // int | Number of items to skip (zero-based).
final int limit = 56; // int | Maximum number of items to return.
final String search = search_example; // String | Case-insensitive substring filter on `displayName`.

try {
    final response = api.listStudios(offset, limit, search);
    print(response);
} on DioException catch (e) {
    print('Exception when calling EntitiesApi->listStudios: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **offset** | **int**| Number of items to skip (zero-based). | [optional] [default to 0]
 **limit** | **int**| Maximum number of items to return. | [optional] [default to 20]
 **search** | **String**| Case-insensitive substring filter on `displayName`. | [optional] 

### Return type

[**StudioListDto**](StudioListDto.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json, application/problem+json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **listTags**
> TagListDto listTags(offset, limit, search, category)

List tags with optional search and category filter

Returns a paginated list of tags. The optional `search` parameter performs a case-insensitive substring match on `displayName`. The optional `category` parameter filters by exact category value. Results are ordered by `displayName` ascending. 

### Example
```dart
import 'package:app_api_client/api.dart';

final api = AppApiClient().getEntitiesApi();
final int offset = 56; // int | Number of items to skip (zero-based).
final int limit = 56; // int | Maximum number of items to return.
final String search = search_example; // String | Case-insensitive substring filter on `displayName`.
final String category = category_example; // String | Exact match filter on `category`. Omit to return tags from all categories.

try {
    final response = api.listTags(offset, limit, search, category);
    print(response);
} on DioException catch (e) {
    print('Exception when calling EntitiesApi->listTags: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **offset** | **int**| Number of items to skip (zero-based). | [optional] [default to 0]
 **limit** | **int**| Maximum number of items to return. | [optional] [default to 20]
 **search** | **String**| Case-insensitive substring filter on `displayName`. | [optional] 
 **category** | **String**| Exact match filter on `category`. Omit to return tags from all categories. | [optional] 

### Return type

[**TagListDto**](TagListDto.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json, application/problem+json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **upsertInstructor**
> InstructorDto upsertInstructor(upsertInstructorRequest)

Create or update an instructor

Creates a new instructor record or updates an existing one (matched by slug or an externalId collision). Returns 409 when the provided slug already exists and belongs to a *different* instructor than would be matched by externalIds. Requires admin role. 

### Example
```dart
import 'package:app_api_client/api.dart';

final api = AppApiClient().getEntitiesApi();
final UpsertInstructorRequest upsertInstructorRequest = {"displayName":"Andrei Neagoie","slug":"andrei-neagoie","externalIds":[{"source":"udemy","externalId":"udemy:instructor:42","url":"https://udemy.com/user/42"}]}; // UpsertInstructorRequest | 

try {
    final response = api.upsertInstructor(upsertInstructorRequest);
    print(response);
} on DioException catch (e) {
    print('Exception when calling EntitiesApi->upsertInstructor: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **upsertInstructorRequest** | [**UpsertInstructorRequest**](UpsertInstructorRequest.md)|  | 

### Return type

[**InstructorDto**](InstructorDto.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json, application/problem+json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **upsertStudio**
> StudioDto upsertStudio(upsertStudioRequest)

Create or update a studio

Creates a new studio record or updates an existing one (matched by slug or externalId collision). Returns 409 when the slug is taken by a different studio. Requires admin role. 

### Example
```dart
import 'package:app_api_client/api.dart';

final api = AppApiClient().getEntitiesApi();
final UpsertStudioRequest upsertStudioRequest = {"displayName":"Zero To Mastery","slug":"zero-to-mastery","externalIds":[{"source":"udemy","externalId":"udemy:organization:ztm","url":"https://udemy.com/organization/ztm"}]}; // UpsertStudioRequest | 

try {
    final response = api.upsertStudio(upsertStudioRequest);
    print(response);
} on DioException catch (e) {
    print('Exception when calling EntitiesApi->upsertStudio: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **upsertStudioRequest** | [**UpsertStudioRequest**](UpsertStudioRequest.md)|  | 

### Return type

[**StudioDto**](StudioDto.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json, application/problem+json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **upsertTag**
> TagDto upsertTag(upsertTagRequest)

Create or update a tag

Creates a new tag or updates an existing one (matched by slug or externalId collision). Returns 409 when the slug is taken by a different tag. Requires admin role. 

### Example
```dart
import 'package:app_api_client/api.dart';

final api = AppApiClient().getEntitiesApi();
final UpsertTagRequest upsertTagRequest = {"displayName":"JavaScript","slug":"javascript","category":"language"}; // UpsertTagRequest | 

try {
    final response = api.upsertTag(upsertTagRequest);
    print(response);
} on DioException catch (e) {
    print('Exception when calling EntitiesApi->upsertTag: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **upsertTagRequest** | [**UpsertTagRequest**](UpsertTagRequest.md)|  | 

### Return type

[**TagDto**](TagDto.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json, application/problem+json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

