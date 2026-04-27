# app_api_client.model.AdminDashboardDto

## Load the model package
```dart
import 'package:app_api_client/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**generatedAt** | [**DateTime**](DateTime.md) | ISO-8601 instant when the snapshot was assembled (server clock). | 
**counts** | [**AdminDashboardDtoCounts**](AdminDashboardDtoCounts.md) |  | 
**latestScan** | [**AdminDashboardLatestScan**](AdminDashboardLatestScan.md) |  | 
**errorsLast24h** | **int** | Count of `ScanErrorRecord` rows whose parent scan started within the last 24 hours (rolling window from `generatedAt`). Uses the parent scan's `startedAt` because the error record itself has no timestamp; works because no scan is expected to outlive a single 24-hour window.  | 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


