# app_api_client.model.TagDto

## Load the model package
```dart
import 'package:app_api_client/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **String** | Server-generated cuid. | 
**slug** | **String** | URL-safe slug. 1–100 characters, lowercase Unicode letters, digits, and hyphens; cannot start or end with a hyphen. Non-ASCII scripts are kept as themselves rather than transliterated, so `Андрей Нягой` slugs to `андрей-нягой` — an entity is only ever addressed by id, and the slug's jobs are uniqueness and human recognition. Values are NFC-normalised, so two encodings of the same visual name are the same slug. Shared by Instructor, Studio, and Tag aggregates. | 
**displayName** | **String** | Human-readable tag name. | 
**category** | **String** |  | [optional] 
**externalIds** | [**BuiltList&lt;ExternalIdRef&gt;**](ExternalIdRef.md) | External system references for this tag. | 
**coursesTotal** | **int** | Total number of courses linked to this tag. | 
**createdAt** | [**DateTime**](DateTime.md) |  | 
**updatedAt** | [**DateTime**](DateTime.md) |  | 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


