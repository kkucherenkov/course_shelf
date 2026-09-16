# app_api_client.model.FlashcardDto

## Load the model package
```dart
import 'package:app_api_client/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **String** | Server-generated cuid identifying this flashcard. | 
**lessonId** | **String** | cuid of the lesson this flashcard belongs to. | 
**front** | **String** | Prompt side. Trimmed server-side. | 
**back** | **String** | Answer side. Trimmed server-side. | 
**sourceCueId** | **String** | cuid of the TranscriptCue this card was made from, when created from a transcript line. Absent for manual and note-derived cards. | [optional] 
**easeFactor** | **double** | SM-2 ease factor. Starts at 2.5, floors at 1.3. | 
**intervalDays** | **int** | Days until the next scheduled review. 0 for a never-reviewed card. | 
**repetitions** | **int** | Consecutive passing reviews (grade >= 3) since the last lapse. | 
**dueAt** | [**DateTime**](DateTime.md) | ISO-8601 instant this card is next due for review. | 
**createdAt** | [**DateTime**](DateTime.md) | ISO-8601 instant when the flashcard was first created. | 
**updatedAt** | [**DateTime**](DateTime.md) | ISO-8601 instant when the flashcard was last updated. | 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


