# app_api_client.model.ScrapePreviewRequest

## Load the model package
```dart
import 'package:app_api_client/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**source_** | **String** | Explicit scraper id (e.g. `youtube`, `udemy`, `json-ld`). Omit to auto-detect (kind=url) or default to json-ld (kind=fragment). Required for kind=name. | [optional] 
**kind** | [**ScraperKind**](ScraperKind.md) |  | 
**url** | **String** | Required when kind=url. | [optional] 
**query** | **String** | Required when kind=name. | [optional] 
**fragment** | **String** | Required when kind=fragment (raw HTML or JSON-LD string). | [optional] 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


