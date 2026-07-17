# app_api_client.model.TagDetailDto

## Load the model package
```dart
import 'package:app_api_client/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**tag** | [**TagDto**](TagDto.md) |  | 
**courses** | [**BuiltList&lt;CourseDto&gt;**](CourseDto.md) | Courses associated with this tag, up to 20, sorted by title. | 
**coursesTotal** | **int** | Total number of courses associated with this tag (may exceed `courses.length`). | 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


