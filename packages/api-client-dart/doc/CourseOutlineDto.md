# app_api_client.model.CourseOutlineDto

## Load the model package
```dart
import 'package:app_api_client/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**course** | [**CourseOutlineSummary**](CourseOutlineSummary.md) |  | 
**sections** | [**BuiltList&lt;SectionOutline&gt;**](SectionOutline.md) | Sections sorted by position. | 
**materials** | [**BuiltList&lt;CourseMaterialItem&gt;**](CourseMaterialItem.md) | Course-level materials, deduplicated and aggregated across every lesson in the course. Empty array when no lesson carries materials. | 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


