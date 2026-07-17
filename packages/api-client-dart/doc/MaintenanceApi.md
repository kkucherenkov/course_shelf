# app_api_client.api.MaintenanceApi

## Load the API package
```dart
import 'package:app_api_client/api.dart';
```

All URIs are relative to *http://localhost:3000*

Method | HTTP request | Description
------------- | ------------- | -------------
[**startBackfillMetadata**](MaintenanceApi.md#startbackfillmetadata) | **POST** /api/v1/admin/maintenance/backfill-metadata | Trigger a background metadata backfill across the library


# **startBackfillMetadata**
> BackfillJobAccepted startBackfillMetadata(backfillMetadataRequest)

Trigger a background metadata backfill across the library

Enqueues a background job that walks every course in the specified library (or all libraries when `libraryId` is omitted), reads each course's `course.json`, and upserts instructor/studio/tag links and extended fields. Returns 202 immediately with a `jobId`; subscribe to the `maintenance:backfill:{jobId}` Centrifugo channel to track progress. Admin only. 

### Example
```dart
import 'package:app_api_client/api.dart';

final api = AppApiClient().getMaintenanceApi();
final BackfillMetadataRequest backfillMetadataRequest = {}; // BackfillMetadataRequest | 

try {
    final response = api.startBackfillMetadata(backfillMetadataRequest);
    print(response);
} on DioException catch (e) {
    print('Exception when calling MaintenanceApi->startBackfillMetadata: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **backfillMetadataRequest** | [**BackfillMetadataRequest**](BackfillMetadataRequest.md)|  | [optional] 

### Return type

[**BackfillJobAccepted**](BackfillJobAccepted.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json, application/problem+json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

