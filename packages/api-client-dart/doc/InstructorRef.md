# app_api_client.model.InstructorRef

## Load the model package
```dart
import 'package:app_api_client/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **String** | Server-generated cuid of the instructor. | 
**slug** | **String** | URL-safe slug. 1–100 characters, lowercase Unicode letters, digits, and hyphens; cannot start or end with a hyphen. Non-ASCII scripts are kept as themselves rather than transliterated, so `Андрей Нягой` slugs to `андрей-нягой` — an entity is only ever addressed by id, and the slug's jobs are uniqueness and human recognition. Values are NFC-normalised, so two encodings of the same visual name are the same slug. Shared by Instructor, Studio, and Tag aggregates. The shape is enforced by the server (the `Slug` value object), not by this schema: a `pattern` here would have to be a Unicode property expression, which the contract-test generator cannot build values for, and that made the gate fail at random depending on which operations a stateful scenario happened to chain. An invalid slug is answered 422 by the domain rather than 400 by the request validator. | 
**displayName** | **String** |  | 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


