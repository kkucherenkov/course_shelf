# app_api_client.model.LessonOutlineItem

## Load the model package
```dart
import 'package:app_api_client/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **String** |  | 
**position** | **int** |  | 
**title** | **String** |  | 
**durationSeconds** | **int** |  | 
**hasMaterials** | **bool** | Whether the lesson has at least one sidecar material. | 
**state** | **String** | Per-user lesson state. Derived: `completed` when the `LessonProgress` row has `completed: true`; `in-progress` when it has progress but is not complete; `locked` when the requester does not hold a READ grant on the course's library (defensive — usually the whole course 403s before this); `not-started` otherwise. | 
**progressPercent** | **int** | 0..100 — only meaningful when `state === 'in-progress'`. | 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


