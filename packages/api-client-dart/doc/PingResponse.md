# app_api_client.model.PingResponse

## Load the model package
```dart
import 'package:app_api_client/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **String** | User id (UUID v4) — Better Auth's internal identifier. | 
**role** | **String** | Role string from Better Auth's `additionalFields.role`. Default `USER` for fresh sign-ups; admin tooling may assign others.  | 
**displayName** | **String** | Optional friendly label set by the user in their profile. | [optional] 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


