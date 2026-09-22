# app_api_client.model.ScraperInfoDto

## Load the model package
```dart
import 'package:app_api_client/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **String** | Stable scraper identifier used as the `source` field in requests. | 
**supportedKinds** | [**BuiltList&lt;ScraperKind&gt;**](ScraperKind.md) | Invocation kinds this scraper handles. | 
**configured** | **bool** | True when the scraper loaded and holds all required credentials / config (e.g. YouTube requires an API key). False when configuration is missing, or when `loadError` is set. | 
**origin** | [**ScraperOrigin**](ScraperOrigin.md) |  | 
**loadError** | **String** | Why this scraper was rejected at load time, e.g. a definition file that failed schema validation. Null for a scraper that loaded successfully. | 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


