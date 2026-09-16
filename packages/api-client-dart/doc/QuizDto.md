# app_api_client.model.QuizDto

## Load the model package
```dart
import 'package:app_api_client/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **String** |  | 
**lessonId** | **String** |  | 
**courseId** | **String** |  | 
**status** | [**QuizStatus**](QuizStatus.md) |  | 
**modelFilename** | **String** | Filename of the .gguf weight this proposal was generated with — what lets an admin compare a 4B run against a 9B run of the same lesson. | 
**questions** | [**BuiltList&lt;QuizQuestionDto&gt;**](QuizQuestionDto.md) |  | 
**createdAt** | [**DateTime**](DateTime.md) |  | 
**completedAt** | [**DateTime**](DateTime.md) |  | [optional] 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


