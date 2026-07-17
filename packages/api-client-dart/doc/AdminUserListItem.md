# app_api_client.model.AdminUserListItem

## Load the model package
```dart
import 'package:app_api_client/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **String** |  | 
**email** | **String** |  | 
**name** | **String** |  | 
**displayName** | **String** |  | 
**role** | [**AdminUserRole**](AdminUserRole.md) |  | 
**banned** | **bool** | Soft-delete flag. When `true`, sign-in fails and existing sessions are invalidated by Better Auth's admin plugin. | 
**createdAt** | [**DateTime**](DateTime.md) |  | 
**updatedAt** | [**DateTime**](DateTime.md) |  | 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


