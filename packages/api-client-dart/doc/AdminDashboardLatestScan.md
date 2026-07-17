# app_api_client.model.AdminDashboardLatestScan

## Load the model package
```dart
import 'package:app_api_client/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**scanId** | **String** | cuid identifying the scan. | 
**libraryId** | **String** | cuid of the library this scan ran against. | 
**status** | [**ScanStatus**](ScanStatus.md) |  | 
**startedAt** | [**DateTime**](DateTime.md) |  | 
**finishedAt** | [**DateTime**](DateTime.md) |  | 
**filesScanned** | **int** |  | 
**errorsCount** | **int** | Number of error records attached to this scan. | 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


