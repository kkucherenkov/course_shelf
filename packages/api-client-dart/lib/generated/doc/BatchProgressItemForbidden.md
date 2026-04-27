# app_api_client.model.BatchProgressItemForbidden

## Load the model package
```dart
import 'package:app_api_client/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**status** | **String** | Actor has no READ grant covering this lesson, OR the lesson does not exist. The two cases are collapsed deliberately to avoid existence leakage (no-oracle rule).  | 
**lessonId** | **String** | Echoes the input `lessonId` for client correlation. | 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


