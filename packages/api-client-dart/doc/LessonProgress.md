# app_api_client.model.LessonProgress

## Load the model package
```dart
import 'package:app_api_client/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**percent** | **num** | Completion percent. v1 always returns 0 — populated once the LessonProgress projector lands (E10-F01-S01). | 
**completed** | **bool** | Whether the lesson is marked as completed. | 
**lastSeenAtSeconds** | **int** | Last reported watched position in seconds. v1 always returns 0 — populated by the LessonProgress projector (E10-F01-S01). | 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


