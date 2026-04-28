# app_api_client.model.StreamUrlDto

## Load the model package
```dart
import 'package:app_api_client/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**url** | **String** | URL the player should request. Same-origin relative path (e.g. `/api/v1/stream/lessons/<id>?token=…`) — the browser resolves it against the SPA's API origin so the backend doesn't need to know its public hostname. Carries the signed token as the `token` query parameter so existing video-element implementations work without an Authorization header. | 
**token** | **String** | Opaque signed token. Format is internal to the backend (currently a JWT-like compact form `header.payload.signature`); clients must round-trip it untouched. | 
**expiresAt** | [**DateTime**](DateTime.md) | ISO-8601 timestamp at which the token + URL stop being accepted. Clients should request a fresh URL before this moment. | 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


