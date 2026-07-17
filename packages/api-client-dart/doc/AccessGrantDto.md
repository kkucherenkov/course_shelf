# app_api_client.model.AccessGrantDto

## Load the model package
```dart
import 'package:app_api_client/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **String** | Server-generated cuid identifying this grant. | 
**userId** | **String** | Better Auth user id of the grantee. | 
**target** | [**GrantTarget**](GrantTarget.md) |  | 
**level** | [**GrantLevel**](GrantLevel.md) |  | 
**createdAt** | [**DateTime**](DateTime.md) | ISO-8601 instant when the grant was created. | 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


