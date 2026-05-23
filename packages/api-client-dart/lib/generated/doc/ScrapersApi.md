# app_api_client.api.ScrapersApi

## Load the API package
```dart
import 'package:app_api_client/api.dart';
```

All URIs are relative to *http://localhost:3000*

Method | HTTP request | Description
------------- | ------------- | -------------
[**listScrapers**](ScrapersApi.md#listscrapers) | **GET** /api/v1/admin/scrapers | List available metadata scrapers
[**scrapeCoursePreview**](ScrapersApi.md#scrapecoursepreview) | **POST** /api/v1/admin/courses/{id}/scrape-preview | Preview scraped metadata for a course


# **listScrapers**
> ScraperListDto listScrapers()

List available metadata scrapers

Returns the scrapers configured on this instance with the invocation kinds each supports. Requires admin role.

### Example
```dart
import 'package:app_api_client/api.dart';

final api = AppApiClient().getScrapersApi();

try {
    final response = api.listScrapers();
    print(response);
} on DioException catch (e) {
    print('Exception when calling ScrapersApi->listScrapers: $e\n');
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**ScraperListDto**](ScraperListDto.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json, application/problem+json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **scrapeCoursePreview**
> ScrapePreviewResponse scrapeCoursePreview(id, scrapePreviewRequest)

Preview scraped metadata for a course

Runs the selected scraper against the given input and returns candidate metadata fragments. PREVIEW ONLY — nothing is persisted and scraped names are not resolved to existing entities. Requires admin role. 

### Example
```dart
import 'package:app_api_client/api.dart';

final api = AppApiClient().getScrapersApi();
final String id = id_example; // String | Server-generated cuid identifying the course.
final ScrapePreviewRequest scrapePreviewRequest = {"kind":"url","url":"https://www.youtube.com/playlist?list=PL123"}; // ScrapePreviewRequest | 

try {
    final response = api.scrapeCoursePreview(id, scrapePreviewRequest);
    print(response);
} on DioException catch (e) {
    print('Exception when calling ScrapersApi->scrapeCoursePreview: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **String**| Server-generated cuid identifying the course. | 
 **scrapePreviewRequest** | [**ScrapePreviewRequest**](ScrapePreviewRequest.md)|  | 

### Return type

[**ScrapePreviewResponse**](ScrapePreviewResponse.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json, application/problem+json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

