# app_api_client.model.TranscriptionDto

## Load the model package
```dart
import 'package:app_api_client/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **String** | Server-generated cuid identifying this transcription run. | 
**libraryId** | **String** | cuid of the library that was transcribed. | 
**status** | [**TranscriptionStatus**](TranscriptionStatus.md) |  | 
**force** | **bool** | When true, existing generated transcripts were redone. | 
**startedAt** | [**DateTime**](DateTime.md) | ISO-8601 instant when the run was started. | 
**finishedAt** | [**DateTime**](DateTime.md) | Set on terminal status (`succeeded` / `failed` / `cancelled` / `interrupted`). Absent while `status: running`. | [optional] 
**lessonsTotal** | **int** | Lessons considered by this run. | 
**lessonsSkipped** | **int** | Lessons left alone — a hand-made subtitle sidecar exists, or the generated transcript still matches the video's `(mtime, size)`. | 
**lessonsTranscribed** | **int** | Lessons for which a transcript was produced by this run. | 
**lessonsFailed** | **int** | Lessons that raised an error; one entry each in `errors`. | 
**errors** | [**BuiltList&lt;TranscriptionErrorDto&gt;**](TranscriptionErrorDto.md) | Non-fatal per-lesson errors encountered during the run. | 
**scopeCourseId** | **String** | cuid of the course this run was scoped to. Absent for a library-wide run (`POST /libraries/{id}/transcriptions`) — present only for `POST /courses/{id}/transcription`. | [optional] 
**scopeCourseName** | **String** | Title of the scoped course, so the UI can render \"transcribing <course>\" without a second round-trip. Absent for a library-wide run. | [optional] 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


