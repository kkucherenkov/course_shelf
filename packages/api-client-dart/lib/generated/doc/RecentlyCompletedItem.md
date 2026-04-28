# app_api_client.model.RecentlyCompletedItem

## Load the model package
```dart
import 'package:app_api_client/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**courseId** | **String** | Server-generated cuid identifying the course. | 
**courseTitle** | **String** | Display title of the course. | 
**librarySlug** | **String** | Slug of the parent library, included for the URL builder. | [optional] 
**lessonsTotal** | **int** | Total lessons in the course (== lessons completed for this row). | 
**completedAt** | [**DateTime**](DateTime.md) | Time the requester finished the last lesson — `CourseProgressReadModel.lastSeenAt` at the moment percent hit 100. | 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


