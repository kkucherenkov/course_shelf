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
**configured** | **bool** | True when all required credentials / config are present on this instance (e.g. YouTube requires an API key). Unconfigured scrapers are omitted from the registry entirely — this flag is always true for listed scrapers. | 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


