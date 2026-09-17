# app_api_client.model.GenerateQuizRequest

## Load the model package
```dart
import 'package:app_api_client/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**modelId** | **String** | Model to use — meaning depends on the deployment's text-generation provider (ADR-0012): a `.gguf` weight filename under the local provider (see `GET /admin/model-weights`), or a hosted provider's own model id under `openrouter`. Omitted uses the deployment's configured default. | [optional] 
**cleanupEnabled** | **bool** | Runs an ASR-typo cleanup pass on each transcript window before generating questions from it. The cleaned text is never written back to the transcript — only used for this run. Turning it off roughly halves generation time and is reasonable for already-clean author-provided subtitles. | [optional] [default to true]

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


