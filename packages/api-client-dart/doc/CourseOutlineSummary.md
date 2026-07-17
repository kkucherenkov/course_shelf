# app_api_client.model.CourseOutlineSummary

## Load the model package
```dart
import 'package:app_api_client/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **String** | Server-generated cuid identifying the course. | 
**title** | **String** |  | 
**slug** | **String** |  | [optional] 
**description** | **String** | Long-form description rendered under the title. | [optional] 
**instructor** | **String** | Visible \"by …\" label. Optional — may be null until the catalog DTO grows the field. | [optional] 
**librarySlug** | **String** | Slug of the parent library, included for breadcrumbs. Optional because Library has no slug field yet (same caveat as ContinueWatchingItem). | [optional] 
**lessonsTotal** | **int** |  | 
**totalDurationSeconds** | **int** | Sum of `Lesson.duration` across the course (whole seconds). | 
**progress** | [**CourseProgress**](CourseProgress.md) |  | 
**createdAt** | [**DateTime**](DateTime.md) |  | 
**updatedAt** | [**DateTime**](DateTime.md) |  | 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


