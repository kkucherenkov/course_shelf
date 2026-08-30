# app_api_client.model.AdminTranscriptionListItem

## Load the model package
```dart
import 'package:app_api_client/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**transcriptionId** | **String** |  | 
**libraryId** | **String** |  | 
**libraryName** | **String** |  | 
**status** | [**TranscriptionStatus**](TranscriptionStatus.md) |  | 
**force** | **bool** | When true, the run redid existing generated transcripts — which is why its `lessonsTotal` and `lessonsTranscribed` are close together. | 
**startedAt** | [**DateTime**](DateTime.md) |  | 
**finishedAt** | [**DateTime**](DateTime.md) |  | 
**lessonsTotal** | **int** |  | 
**lessonsTranscribed** | **int** | Lessons for which this run produced a transcript, highlighted as a \"+N\" badge the way `coursesAdded` is for scans. | 
**errorsCount** | **int** | Number of error records attached to this run — the same number as the run's `lessonsFailed`. Fetch the run itself for the details. | 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


