# app_api_client.api.IdentifyApi

## Load the API package
```dart
import 'package:app_api_client/api.dart';
```

All URIs are relative to *http://localhost:3000*

Method | HTTP request | Description
------------- | ------------- | -------------
[**applyIdentifyResult**](IdentifyApi.md#applyidentifyresult) | **POST** /api/v1/admin/identify-tasks/{id}/apply | Apply a proposed identify task to its course
[**discardIdentifyTask**](IdentifyApi.md#discardidentifytask) | **POST** /api/v1/admin/identify-tasks/{id}/discard | Discard a proposed identify task
[**getIdentifyTask**](IdentifyApi.md#getidentifytask) | **GET** /api/v1/admin/identify-tasks/{id} | Get one identify task
[**listIdentifyTasks**](IdentifyApi.md#listidentifytasks) | **GET** /api/v1/admin/identify-tasks | List identify tasks
[**runIdentifyTask**](IdentifyApi.md#runidentifytask) | **POST** /api/v1/admin/courses/{id}/identify | Create an identify proposal for a course


# **applyIdentifyResult**
> IdentifyTaskDto applyIdentifyResult(id, applyIdentifyRequest)

Apply a proposed identify task to its course

Merges the scraped fragment into the course per the (optionally overridden) merge policy, resolving names to entities. Requires admin role.

### Example
```dart
import 'package:app_api_client/api.dart';

final api = AppApiClient().getIdentifyApi();
final String id = id_example; // String | 
final ApplyIdentifyRequest applyIdentifyRequest = {"mergePolicy":{"title":"overwrite"}}; // ApplyIdentifyRequest | 

try {
    final response = api.applyIdentifyResult(id, applyIdentifyRequest);
    print(response);
} on DioException catch (e) {
    print('Exception when calling IdentifyApi->applyIdentifyResult: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **String**|  | 
 **applyIdentifyRequest** | [**ApplyIdentifyRequest**](ApplyIdentifyRequest.md)|  | [optional] 

### Return type

[**IdentifyTaskDto**](IdentifyTaskDto.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json, application/problem+json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **discardIdentifyTask**
> IdentifyTaskDto discardIdentifyTask(id)

Discard a proposed identify task

Marks the task as discarded; no changes are written to the course. Requires admin role.

### Example
```dart
import 'package:app_api_client/api.dart';

final api = AppApiClient().getIdentifyApi();
final String id = id_example; // String | 

try {
    final response = api.discardIdentifyTask(id);
    print(response);
} on DioException catch (e) {
    print('Exception when calling IdentifyApi->discardIdentifyTask: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **String**|  | 

### Return type

[**IdentifyTaskDto**](IdentifyTaskDto.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json, application/problem+json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getIdentifyTask**
> IdentifyTaskDto getIdentifyTask(id)

Get one identify task

Returns a single identify task by id. Requires admin role.

### Example
```dart
import 'package:app_api_client/api.dart';

final api = AppApiClient().getIdentifyApi();
final String id = id_example; // String | 

try {
    final response = api.getIdentifyTask(id);
    print(response);
} on DioException catch (e) {
    print('Exception when calling IdentifyApi->getIdentifyTask: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **String**|  | 

### Return type

[**IdentifyTaskDto**](IdentifyTaskDto.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json, application/problem+json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **listIdentifyTasks**
> IdentifyTaskListDto listIdentifyTasks(status, courseId)

List identify tasks

Returns identify tasks ordered newest-first. Optionally filtered by status and/or courseId. Requires admin role.

### Example
```dart
import 'package:app_api_client/api.dart';

final api = AppApiClient().getIdentifyApi();
final IdentifyTaskStatus status = ; // IdentifyTaskStatus | 
final String courseId = courseId_example; // String | 

try {
    final response = api.listIdentifyTasks(status, courseId);
    print(response);
} on DioException catch (e) {
    print('Exception when calling IdentifyApi->listIdentifyTasks: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **status** | [**IdentifyTaskStatus**](.md)|  | [optional] 
 **courseId** | **String**|  | [optional] 

### Return type

[**IdentifyTaskListDto**](IdentifyTaskListDto.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json, application/problem+json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **runIdentifyTask**
> IdentifyTaskDto runIdentifyTask(id, runIdentifyRequest)

Create an identify proposal for a course

Persists a chosen scraped fragment as a `proposed` IdentifyTask. Nothing is written to the course until the task is applied. Requires admin role.

### Example
```dart
import 'package:app_api_client/api.dart';

final api = AppApiClient().getIdentifyApi();
final String id = id_example; // String | 
final RunIdentifyRequest runIdentifyRequest = {"source":"youtube","sourceUrl":"https://www.youtube.com/playlist?list=PL123","fragment":{"title":"Rust Course","studioName":"Rustacean","externalIds":[{"source":"youtube","externalId":"youtube:playlist:PL123"}]}}; // RunIdentifyRequest | 

try {
    final response = api.runIdentifyTask(id, runIdentifyRequest);
    print(response);
} on DioException catch (e) {
    print('Exception when calling IdentifyApi->runIdentifyTask: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **String**|  | 
 **runIdentifyRequest** | [**RunIdentifyRequest**](RunIdentifyRequest.md)|  | 

### Return type

[**IdentifyTaskDto**](IdentifyTaskDto.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json, application/problem+json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

