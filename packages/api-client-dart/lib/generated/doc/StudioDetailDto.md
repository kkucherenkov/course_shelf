# app_api_client.model.StudioDetailDto

## Load the model package
```dart
import 'package:app_api_client/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**studio** | [**StudioDto**](StudioDto.md) |  | 
**courses** | [**BuiltList&lt;CourseDto&gt;**](CourseDto.md) | Courses associated with this studio, up to 20, sorted by title. | 
**coursesTotal** | **int** | Total number of courses associated with this studio (may exceed `courses.length`). | 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


