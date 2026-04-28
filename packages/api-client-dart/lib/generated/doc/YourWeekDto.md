# app_api_client.model.YourWeekDto

## Load the model package
```dart
import 'package:app_api_client/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**minutesWatched** | **int** | Total whole minutes watched by the requester in the window. Computed by summing duration across `LessonProgress` rows whose `updatedAt` falls inside `range`. | 
**lessonsCompleted** | **int** | Number of lessons the requester completed during the window. Counted from `LessonProgress.completedAt`. | 
**range** | [**DateRange**](DateRange.md) |  | 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


