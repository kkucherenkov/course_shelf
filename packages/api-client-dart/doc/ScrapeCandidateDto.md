# app_api_client.model.ScrapeCandidateDto

## Load the model package
```dart
import 'package:app_api_client/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**source_** | **String** | Id of the scraper that produced this candidate (e.g. `youtube`, `json-ld`). | 
**sourceUrl** | **String** | URL of the upstream resource that was fetched, if applicable. | [optional] 
**confidence** | **double** | Optional confidence score in the range [0, 1]. | [optional] 
**fragment** | [**ScrapedCourseFragmentDto**](ScrapedCourseFragmentDto.md) |  | 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


