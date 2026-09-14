# app_api_client.model.StartTranscriptionRequest

## Load the model package
```dart
import 'package:app_api_client/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**force** | **bool** | Re-transcribe lessons that already have a generated transcript. Hand-made subtitle sidecars are never overwritten. | [optional] [default to false]
**language** | **String** | BCP-47 primary subtag for this run, or `auto`. Overrides the deployment's `WHISPER_LANGUAGE` for this run only. Naming the language skips whisper's per-file detection pass, which is repeated work on a library that is effectively one or two languages; it also records the transcript under that language tag instead of `und`, which is what `auto` can report. Omitted means \"use whatever this deployment is configured with\". A transcript is identified by `(lesson, language)`, so a run that names a language different from the one already on disk transcribes rather than skips — that is the point, not a bug. | [optional] 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


