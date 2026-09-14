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
**slug** | **String** | URL-safe slug. 1–100 characters, lowercase Unicode letters, digits, and hyphens; cannot start or end with a hyphen. Unique within a library. Non-ASCII scripts are kept as themselves rather than transliterated, so `Графы и комбинаторика` slugs to `графы-и-комбинаторика` — a course is only ever addressed by id, and the slug's jobs are uniqueness within the library and human recognition. Values are NFC-normalised, so two encodings of the same visual title are the same slug. The shape is enforced by the server (the `Slug` value object), not by this schema: a `pattern` here would have to be a Unicode property expression, which the contract-test generator cannot build values for, and that made the gate fail at random depending on which operations a stateful scenario happened to chain. An invalid slug is answered 422 by the domain rather than 400 by the request validator. | 
**title** | **String** |  | 
**description** | **String** |  | [optional] 
**sections** | [**BuiltList&lt;SectionDto&gt;**](SectionDto.md) | Sections sorted ascending by position. | 
**progress** | [**CourseProgress**](CourseProgress.md) |  | 
**instructors** | [**BuiltList&lt;InstructorRef&gt;**](InstructorRef.md) | Instructors associated with this course. Empty array when none linked. | [optional] [default to ListBuilder()]
**studios** | [**BuiltList&lt;StudioRef&gt;**](StudioRef.md) | Studios associated with this course. Empty array when none linked. | [optional] [default to ListBuilder()]
**tags** | [**BuiltList&lt;TagRef&gt;**](TagRef.md) | Tags associated with this course. Empty array when none linked. | [optional] [default to ListBuilder()]
**level** | [**CourseLevel**](CourseLevel.md) |  | [optional] 
**language** | **String** |  | [optional] 
**releaseDate** | [**Date**](Date.md) |  | [optional] 
**posterUrl** | **String** |  | [optional] 
**ratingAverage** | **num** |  | [optional] 
**ratingCount** | **int** |  | [optional] 
**externalIds** | [**BuiltList&lt;ExternalIdRef&gt;**](ExternalIdRef.md) | External system references for this course. Empty array when none. | [optional] [default to ListBuilder()]
**sourceUpdatedAt** | [**DateTime**](DateTime.md) |  | [optional] 
**createdAt** | [**DateTime**](DateTime.md) |  | 
**updatedAt** | [**DateTime**](DateTime.md) |  | 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


