# app_api_client.model.UpdateCourseRequest

## Load the model package
```dart
import 'package:app_api_client/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**title** | **String** |  | [optional] 
**description** | **String** |  | [optional] 
**slug** | **String** | URL-safe slug. 1–100 characters, lowercase Unicode letters, digits, and hyphens; cannot start or end with a hyphen. Unique within a library. Non-ASCII scripts are kept as themselves rather than transliterated, so `Графы и комбинаторика` slugs to `графы-и-комбинаторика` — a course is only ever addressed by id, and the slug's jobs are uniqueness within the library and human recognition. Values are NFC-normalised, so two encodings of the same visual title are the same slug. The shape is enforced by the server (the `Slug` value object), not by this schema: a `pattern` here would have to be a Unicode property expression, which the contract-test generator cannot build values for, and that made the gate fail at random depending on which operations a stateful scenario happened to chain. An invalid slug is answered 422 by the domain rather than 400 by the request validator. | [optional] 
**instructorIds** | **BuiltList&lt;String&gt;** |  | [optional] 
**studioIds** | **BuiltList&lt;String&gt;** |  | [optional] 
**tagIds** | **BuiltList&lt;String&gt;** |  | [optional] 
**level** | [**CourseLevel**](CourseLevel.md) |  | [optional] 
**language** | **String** |  | [optional] 
**releaseDate** | [**Date**](Date.md) |  | [optional] 
**posterUrl** | **String** |  | [optional] 
**ratingAverage** | **num** |  | [optional] 
**ratingCount** | **int** |  | [optional] 
**externalIds** | [**BuiltList&lt;ExternalIdRef&gt;**](ExternalIdRef.md) |  | [optional] 
**sourceUpdatedAt** | [**DateTime**](DateTime.md) |  | [optional] 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


