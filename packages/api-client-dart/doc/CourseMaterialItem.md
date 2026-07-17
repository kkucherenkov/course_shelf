# app_api_client.model.CourseMaterialItem

## Load the model package
```dart
import 'package:app_api_client/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **String** |  | 
**lessonId** | **String** | Owning lesson id. Used by the right-rail to link to the lesson. | 
**sectionId** | **String** | Owning section id. Used by the rail to group items. | 
**sectionTitle** | **String** | Title of the owning section, denormalised so the rail can render its grouping caption without resolving via `sections[]`. | 
**kind** | **String** |  | 
**label** | **String** |  | 
**sizeBytes** | **int** |  | 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


