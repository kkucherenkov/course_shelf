# app_api_client.model.MaterialDownloadUrlDto

## Load the model package
```dart
import 'package:app_api_client/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**url** | **String** | URL the browser should fetch. Same-origin relative path (e.g. `/api/v1/stream/materials/<id>?token=…`). Carries the signed token as the `token` query parameter so a direct `<a href download>` works without an Authorization header. | 
**token** | **String** | Opaque signed token. Internal format is the same compact `header.payload.signature` shape as the video stream token, but the payload's scope claim differs so a video token can never be re-used to fetch a material (and vice versa). Round-trip untouched. | 
**expiresAt** | [**DateTime**](DateTime.md) | ISO-8601 timestamp at which the token + URL stop being accepted. Default TTL is 5 minutes — clicking a download link should resolve immediately, so a long TTL is unnecessary. | 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


