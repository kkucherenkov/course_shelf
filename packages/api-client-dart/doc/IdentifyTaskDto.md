# app_api_client.model.IdentifyTaskDto

## Load the model package
```dart
import 'package:app_api_client/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **String** |  | 
**courseId** | **String** |  | 
**courseTitle** | **String** | Title of the course this task targets, denormalized so the admin queue can identify the row without a follow-up fetch. | 
**status** | [**IdentifyTaskStatus**](IdentifyTaskStatus.md) |  | 
**source_** | **String** | Label of the scraper/source that produced the fragment. | 
**sourceUrl** | **String** | URL the fragment was scraped from, if any. | [optional] 
**scrapedFragment** | [**ScrapedCourseFragmentDto**](ScrapedCourseFragmentDto.md) |  | 
**mergePolicy** | [**MergePolicyDto**](MergePolicyDto.md) |  | 
**createdAt** | [**DateTime**](DateTime.md) |  | 
**completedAt** | [**DateTime**](DateTime.md) |  | [optional] 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


