# app_api_client.model.SubtitleDto

## Load the model package
```dart
import 'package:app_api_client/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **String** | Server-generated cuid identifying this subtitle track. | 
**language** | **String** | BCP-47-ish language code parsed from the filename suffix (`Lesson.en.srt` → `en`). `und` when no suffix is present. | 
**label** | **String** | Human-readable label for the subtitle track (e.g. \"English\"). | 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


