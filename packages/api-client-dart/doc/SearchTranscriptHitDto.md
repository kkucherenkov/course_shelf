# app_api_client.model.SearchTranscriptHitDto

## Load the model package
```dart
import 'package:app_api_client/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**lessonId** | **String** |  | 
**lessonTitle** | **String** | Title of the lesson the cue belongs to. | 
**courseId** | **String** |  | 
**courseTitle** | **String** | Title of the parent course — included so the SPA can show breadcrumb context. | 
**sectionTitle** | **String** | Title of the parent section. | 
**language** | **String** | BCP-47-ish language tag of the transcript the cue belongs to. | 
**startMs** | **int** | Cue start time in milliseconds, for seeking straight to the moment. | 
**text** | **String** | The cue text that matched the query. | 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


