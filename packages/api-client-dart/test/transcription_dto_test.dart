import 'package:test/test.dart';
import 'package:app_api_client/app_api_client.dart';

// tests for TranscriptionDto
void main() {
  final instance = TranscriptionDtoBuilder();
  // TODO add properties to the builder and call build()

  group(TranscriptionDto, () {
    // Server-generated cuid identifying this transcription run.
    // String id
    test('to test the property `id`', () async {
      // TODO
    });

    // cuid of the library that was transcribed.
    // String libraryId
    test('to test the property `libraryId`', () async {
      // TODO
    });

    // TranscriptionStatus status
    test('to test the property `status`', () async {
      // TODO
    });

    // When true, existing generated transcripts were redone.
    // bool force
    test('to test the property `force`', () async {
      // TODO
    });

    // ISO-8601 instant when the run was started.
    // DateTime startedAt
    test('to test the property `startedAt`', () async {
      // TODO
    });

    // Set on terminal status (`succeeded` / `failed` / `cancelled`). Absent while `status: running`.
    // DateTime finishedAt
    test('to test the property `finishedAt`', () async {
      // TODO
    });

    // Lessons considered by this run.
    // int lessonsTotal
    test('to test the property `lessonsTotal`', () async {
      // TODO
    });

    // Lessons left alone — a hand-made subtitle sidecar exists, or the generated transcript still matches the video's `(mtime, size)`.
    // int lessonsSkipped
    test('to test the property `lessonsSkipped`', () async {
      // TODO
    });

    // Lessons for which a transcript was produced by this run.
    // int lessonsTranscribed
    test('to test the property `lessonsTranscribed`', () async {
      // TODO
    });

    // Lessons that raised an error; one entry each in `errors`.
    // int lessonsFailed
    test('to test the property `lessonsFailed`', () async {
      // TODO
    });

    // Non-fatal per-lesson errors encountered during the run.
    // BuiltList<TranscriptionErrorDto> errors
    test('to test the property `errors`', () async {
      // TODO
    });

  });
}
