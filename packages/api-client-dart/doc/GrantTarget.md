# app_api_client.model.GrantTarget

## Load the model package
```dart
import 'package:app_api_client/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**kind** | **String** | Discriminator value indicating a course-scoped grant. Accepted in v1 even though the Course aggregate (E06-F03-S01) has not landed yet — keeps the contract stable for E14-F04-S01. | 
**libraryId** | **String** | Server-generated cuid of the target library. | 
**courseId** | **String** | Server-generated cuid of the target course (e.g. \"DDD by Eric Evans\"). | 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


