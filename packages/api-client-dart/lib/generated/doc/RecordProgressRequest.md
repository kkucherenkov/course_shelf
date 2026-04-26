# app_api_client.model.RecordProgressRequest

## Load the model package
```dart
import 'package:app_api_client/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**lessonId** | **String** | Server-generated cuid identifying the lesson. | 
**positionSeconds** | **int** | Last reported watch position in seconds. Clamped server-side to `[0, durationSeconds]`. | 
**durationSeconds** | **int** | Lesson video duration in seconds. Clients pass the player's `duration` from the `loadedmetadata` event; it must match the server-side value once E06-F02-S02 (ffprobe) lands. v1 trusts the client value. | 
**clientUpdatedAt** | [**DateTime**](DateTime.md) | ISO-8601 timestamp the client recorded the position. Out-of-order writes (older than the current `lastSeenAt`) are silently accepted and the response echoes the unchanged state. | 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


