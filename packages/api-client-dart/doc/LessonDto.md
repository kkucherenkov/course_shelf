# app_api_client.model.LessonDto

## Load the model package
```dart
import 'package:app_api_client/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **String** | Server-generated cuid identifying this lesson. | 
**courseId** | **String** | cuid of the course this lesson belongs to. | 
**sectionId** | **String** | cuid of the section this lesson belongs to. | 
**position** | **int** | 1-based position within the section. | 
**title** | **String** |  | 
**durationSeconds** | **int** | Video duration in seconds. Populated by E06-F02-S02 (ffprobe). `undefined` until then. | [optional] 
**materials** | [**BuiltList&lt;MaterialDto&gt;**](MaterialDto.md) | Sidecar materials (PDF / Markdown / text / image). Empty array when none. | 
**subtitles** | [**BuiltList&lt;SubtitleDto&gt;**](SubtitleDto.md) | Available subtitle tracks. Empty array when none. | 
**progress** | [**LessonProgress**](LessonProgress.md) |  | 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


