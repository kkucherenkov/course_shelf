# app_api_client.model.ModelWeightDto

## Load the model package
```dart
import 'package:app_api_client/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**filename** | **String** |  | 
**sizeBytes** | **int** | File size in bytes, as reported by the filesystem. | 
**usableForQuizGeneration** | **bool** | True for a `.gguf` file (a llama.cpp weight, selectable as `GenerateQuizRequest.modelId`); false for whisper's `.bin`. | 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


