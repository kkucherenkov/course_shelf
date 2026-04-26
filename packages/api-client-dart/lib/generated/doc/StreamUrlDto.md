# app_api_client.model.StreamUrlDto

## Load the model package
```dart
import 'package:app_api_client/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**url** | **String** | Full URL the player should request. Carries the signed token as the `token` query parameter so existing video-element implementations work without an Authorization header. | 
**token** | **String** | Opaque signed token. Format is internal to the backend (currently a JWT-like compact form `header.payload.signature`); clients must round-trip it untouched. | 
**expiresAt** | [**DateTime**](DateTime.md) | ISO-8601 timestamp at which the token + URL stop being accepted. Clients should request a fresh URL before this moment. | 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


