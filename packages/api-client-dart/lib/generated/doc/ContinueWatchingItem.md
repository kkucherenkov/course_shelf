# app_api_client.model.ContinueWatchingItem

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
**percent** | **num** | Course completion = `lessonsCompleted / lessonsTotal * 100`. | 
**lessonsCompleted** | **int** | Number of lessons the user has completed in this course. | 
**lessonsTotal** | **int** | Total number of lessons in the course. | 
**lastSeenAt** | [**DateTime**](DateTime.md) | Most recent moment any lesson in this course was watched (completed or not). | 
**lastSeenLessonId** | **String** | The lesson the player last reported a position on, used to wire the 'Resume' CTA. | 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


