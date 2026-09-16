# app_api_client.model.CreateFlashcardRequest

## Load the model package
```dart
import 'package:app_api_client/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**front** | **String** | Prompt side. Trimmed server-side, so it must contain a non-whitespace character. | 
**back** | **String** | Answer side. Trimmed server-side, so it must contain a non-whitespace character. | 
**sourceCueId** | **String** | Optional cuid of the TranscriptCue this card is made from — set when the card was created from a transcript line, omitted for manual and note-derived cards. | [optional] 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


