# app_api_client.model.SectionOutline

## Load the model package
```dart
import 'package:app_api_client/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **String** | Server-generated cuid identifying this section. | 
**position** | **int** | 1-based position within the course. | 
**title** | **String** |  | 
**totalDurationSeconds** | **int** | Sum of `Lesson.duration` across this section's lessons. | 
**lessons** | [**BuiltList&lt;LessonOutlineItem&gt;**](LessonOutlineItem.md) | Lessons sorted by position. | 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


