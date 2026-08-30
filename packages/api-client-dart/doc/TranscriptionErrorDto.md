# app_api_client.model.TranscriptionErrorDto

## Load the model package
```dart
import 'package:app_api_client/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**lessonId** | **String** | cuid of the lesson whose transcription failed. | 
**message** | **String** | Human-readable description of what went wrong. | 
**code** | **String** | Machine-readable error key (e.g. `whisper-failed`, `audio-extract-failed`, `no-video-source`). | [optional] 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


