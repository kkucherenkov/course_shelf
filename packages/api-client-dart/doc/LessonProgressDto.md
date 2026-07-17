# app_api_client.model.LessonProgressDto

## Load the model package
```dart
import 'package:app_api_client/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**lessonId** | **String** | Server-generated cuid identifying the lesson. | 
**positionSeconds** | **int** | Last recorded watch position in seconds. | 
**durationSeconds** | **int** | Lesson video duration in seconds. | 
**percent** | **num** | Computed as `positionSeconds / durationSeconds * 100`. Clamped to 100 when position >= duration. | 
**completed** | **bool** | True once the user crosses the 90 % threshold; never flips back to false. | 
**lastSeenAt** | [**DateTime**](DateTime.md) | ISO-8601 instant of the last accepted progress write. | 
**completedAt** | [**DateTime**](DateTime.md) | Set the first time `completed` flips to true. Stable across subsequent writes. Absent when `completed` is false. | [optional] 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


