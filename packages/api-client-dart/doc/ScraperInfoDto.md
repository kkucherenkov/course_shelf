# app_api_client.model.ScraperInfoDto

## Load the model package
```dart
import 'package:app_api_client/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **String** | Stable scraper identifier used as the `source` field in requests. For a definition file rejected before it could be parsed, this is the file's stem (`acme-academy.json` -> `acme-academy`) rather than an id declared inside it — a failed parse never produces one. | 
**supportedKinds** | [**BuiltList&lt;ScraperKind&gt;**](ScraperKind.md) | Invocation kinds this scraper handles. Empty for a rejected definition file: the kinds live inside the definition, and a failed parse never produces one to read them from. | 
**configured** | **bool** | True when the scraper loaded and holds all required credentials / config (e.g. YouTube requires an API key). False when configuration is missing, or when `loadError` is set. | 
**origin** | [**ScraperOrigin**](ScraperOrigin.md) |  | [optional] 
**loadError** | **String** | Why this scraper was rejected at load time, e.g. a definition file that failed schema validation. Null for a scraper that loaded successfully. | [optional] 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


