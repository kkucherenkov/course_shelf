# app_api_client.model.BookmarkDto

## Load the model package
```dart
import 'package:app_api_client/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **String** | Server-generated cuid identifying this bookmark. | 
**lessonId** | **String** | cuid of the lesson this bookmark belongs to. | 
**positionSeconds** | **int** | Playback position in seconds where the bookmark is pinned. | 
**label** | **String** | Free-form label. Trimmed server-side; absent means the bookmark has no label. | [optional] 
**createdAt** | [**DateTime**](DateTime.md) | ISO-8601 instant when the bookmark was created. | 
**updatedAt** | [**DateTime**](DateTime.md) | ISO-8601 instant when the bookmark was last updated. | 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


