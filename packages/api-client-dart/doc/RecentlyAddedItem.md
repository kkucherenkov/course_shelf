# app_api_client.model.RecentlyAddedItem

## Load the model package
```dart
import 'package:app_api_client/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**courseId** | **String** | Server-generated cuid identifying the course. | 
**courseTitle** | **String** | Display title of the course. | 
**librarySlug** | **String** | Slug of the parent library, included for the URL builder. Optional because not every layout exposes a per-library slug yet. | [optional] 
**lessonCount** | **int** | Number of lessons in the course at intake time. | 
**totalDurationSeconds** | **int** | Sum of `Lesson.duration` across the course, in whole seconds. | 
**createdAt** | [**DateTime**](DateTime.md) | Moment the course was added to its library. | 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


