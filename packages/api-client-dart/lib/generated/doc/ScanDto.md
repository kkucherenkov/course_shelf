# app_api_client.model.ScanDto

## Load the model package
```dart
import 'package:app_api_client/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **String** | Server-generated cuid identifying this scan. | 
**libraryId** | **String** | cuid of the library that was scanned. | 
**status** | [**ScanStatus**](ScanStatus.md) |  | 
**startedAt** | [**DateTime**](DateTime.md) | ISO-8601 instant when the scan was started. | 
**finishedAt** | [**DateTime**](DateTime.md) | Set on terminal status (`succeeded` / `failed` / `cancelled`). Absent while `status: running`. | [optional] 
**filesScanned** | **int** | Total number of filesystem entries inspected. | 
**filesAdded** | **int** | Files that did not exist in the catalog before this scan. | 
**filesUpdated** | **int** | Files whose metadata changed since the last scan. | 
**coursesDiscovered** | **int** | Course roots detected during this scan. | 
**errors** | [**BuiltList&lt;ScanError&gt;**](ScanError.md) | Non-fatal per-file errors encountered during the scan. | 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


