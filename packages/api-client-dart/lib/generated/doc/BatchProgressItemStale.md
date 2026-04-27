# app_api_client.model.BatchProgressItemStale

## Load the model package
```dart
import 'package:app_api_client/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**status** | **String** | The client's `clientUpdatedAt` was older than the server's `lastSeenAt` for this lesson. The write was absorbed but the server already had newer state — the client should overwrite its local cache from `state`.  | 
**state** | [**LessonProgressDto**](LessonProgressDto.md) |  | 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


