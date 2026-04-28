# app_api_client.model.InstanceConfigDto

## Load the model package
```dart
import 'package:app_api_client/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**selfRegistration** | **bool** | When false, sign-up CTAs are hidden and /sign-up redirects to /sign-in. | 
**emailVerificationRequired** | **bool** | When true, sign-up wizard renders the 6-digit-code step between account creation and library setup. | 
**ssoProviders** | [**BuiltList&lt;SsoProviderConfig&gt;**](SsoProviderConfig.md) | Configured OAuth / SSO providers. Empty array in v1 — Better Auth's `genericOAuth` plugin lands in v2. | 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


