# app_api_client.model.GradeFlashcardRequest

## Load the model package
```dart
import 'package:app_api_client/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**grade** | **int** | 0 - complete blackout    3 - correct, serious difficulty 1 - incorrect, familiar  4 - correct, some hesitation 2 - incorrect, easy      5 - perfect recall Grades below 3 are a lapse: the repetition streak resets and the card is due again in 1 day.  | 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


