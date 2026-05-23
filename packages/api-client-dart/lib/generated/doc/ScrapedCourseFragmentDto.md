# app_api_client.model.ScrapedCourseFragmentDto

## Load the model package
```dart
import 'package:app_api_client/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**title** | **String** | Raw course title as returned by the scraper. | [optional] 
**description** | **String** | Raw course description. | [optional] 
**instructorNames** | **BuiltList&lt;String&gt;** | Instructor names as scraped (not resolved to Instructor entities). | [optional] 
**studioName** | **String** | Studio or channel name as scraped (not resolved to a Studio entity). | [optional] 
**tags** | **BuiltList&lt;String&gt;** | Raw tags or topic labels. | [optional] 
**level** | [**CourseLevel**](CourseLevel.md) |  | [optional] 
**language** | **String** | BCP-47 language code (e.g. `en`, `de`). | [optional] 
**releaseDate** | [**Date**](Date.md) | Original release date of the course in ISO 8601 date format. | [optional] 
**posterUrl** | **String** | URL of the course thumbnail / poster image. | [optional] 
**externalIds** | [**BuiltList&lt;ExternalIdRef&gt;**](ExternalIdRef.md) | External system references detected during scraping. | [optional] 
**ratingAverage** | **double** | Aggregate rating value in the range [0, 5]. | [optional] 
**ratingCount** | **int** | Number of ratings that make up the aggregate. | [optional] 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


