# app_api_client.api.CatalogApi

## Load the API package
```dart
import 'package:app_api_client/api.dart';
```

All URIs are relative to *http://localhost:3000*

Method | HTTP request | Description
------------- | ------------- | -------------
[**getLatestLibraryScan**](CatalogApi.md#getlatestlibraryscan) | **GET** /api/v1/libraries/{id}/scans/latest | Get the most recent scan for a library
[**getLibrary**](CatalogApi.md#getlibrary) | **GET** /api/v1/libraries/{id} | Get a library by id
[**listLibraries**](CatalogApi.md#listlibraries) | **GET** /api/v1/libraries | List all registered libraries
[**registerLibrary**](CatalogApi.md#registerlibrary) | **POST** /api/v1/libraries | Register a new library
[**runLibraryScan**](CatalogApi.md#runlibraryscan) | **POST** /api/v1/libraries/{id}/scans | Trigger a scan of a library


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

