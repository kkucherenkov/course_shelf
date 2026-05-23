# app_api_client.model.InstructorDetailDto

## Load the model package
```dart
import 'package:app_api_client/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**instructor** | [**InstructorDto**](InstructorDto.md) |  | 
**courses** | [**BuiltList&lt;CourseDto&gt;**](CourseDto.md) | Courses associated with this instructor, up to 20, sorted by title. | 
**coursesTotal** | **int** | Total number of courses associated with this instructor (may exceed `courses.length`). | 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


