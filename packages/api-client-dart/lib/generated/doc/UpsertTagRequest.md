# app_api_client.model.UpsertTagRequest

## Load the model package
```dart
import 'package:app_api_client/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**displayName** | **String** | Human-readable tag name. | 
**slug** | **String** | URL-safe slug. Auto-generated from `displayName` when omitted. | [optional] 
**category** | **String** |  | [optional] 
**externalIds** | [**BuiltList&lt;ExternalIdRef&gt;**](ExternalIdRef.md) | External system references for this tag. | [optional] 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


