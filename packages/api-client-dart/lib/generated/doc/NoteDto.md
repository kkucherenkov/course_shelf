# app_api_client.model.NoteDto

## Load the model package
```dart
import 'package:app_api_client/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **String** | Server-generated cuid identifying this note. | 
**lessonId** | **String** | cuid of the lesson this note belongs to. | 
**body** | **String** | Plain Markdown stored verbatim. Server does not render. | 
**createdAt** | [**DateTime**](DateTime.md) | ISO-8601 instant when the note was first created. | 
**updatedAt** | [**DateTime**](DateTime.md) | ISO-8601 instant when the note body was last replaced. | 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


