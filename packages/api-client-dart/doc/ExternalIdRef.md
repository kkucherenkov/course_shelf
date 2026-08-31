# app_api_client.model.ExternalIdRef

## Load the model package
```dart
import 'package:app_api_client/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**source_** | **String** | Namespace identifying the external system (e.g. `udemy`, `youtube`). Must contain a non-whitespace character. Scrapers are responsible for namespacing their ids (e.g. `youtube:playlist:PLxxx` vs `youtube:channel:UCyyy`). | 
**externalId** | **String** | Identifier within the source system. Must contain a non-whitespace character. | 
**url** | **String** | Optional canonical URL of the entity on the source platform. Must be an absolute `http` or `https` URL. | [optional] 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


