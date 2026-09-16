# app_api_client.model.QuizQuestionDto

## Load the model package
```dart
import 'package:app_api_client/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**prompt** | **String** | The question text. | 
**options** | **BuiltList&lt;String&gt;** | Exactly four answer options. | 
**correctOptionIndex** | **int** | Index into `options` of the correct answer. | 
**cueStartMs** | **int** | Start timestamp (ms) of the transcript window this question was generated from — assigned by the window, not the model, so it cannot be hallucinated. | 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


