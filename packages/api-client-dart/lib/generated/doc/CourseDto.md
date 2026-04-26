# app_api_client.model.CourseDto

## Load the model package
```dart
import 'package:app_api_client/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **String** | Server-generated cuid identifying this course. | 
**libraryId** | **String** | cuid of the library this course belongs to. | 
**slug** | **String** | URL-safe slug. 1–100 chars, lowercase ASCII letters, digits, and hyphens; cannot start or end with a hyphen. Unique within a library. | 
**title** | **String** |  | 
**description** | **String** |  | [optional] 
**sections** | [**BuiltList&lt;SectionDto&gt;**](SectionDto.md) | Sections sorted ascending by position. | 
**progress** | [**CourseProgress**](CourseProgress.md) |  | 
**createdAt** | [**DateTime**](DateTime.md) |  | 
**updatedAt** | [**DateTime**](DateTime.md) |  | 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


