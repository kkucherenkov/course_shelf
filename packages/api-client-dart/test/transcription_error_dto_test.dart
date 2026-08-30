import 'package:test/test.dart';
import 'package:app_api_client/app_api_client.dart';

// tests for TranscriptionErrorDto
void main() {
  final instance = TranscriptionErrorDtoBuilder();
  // TODO add properties to the builder and call build()

  group(TranscriptionErrorDto, () {
    // cuid of the lesson whose transcription failed.
    // String lessonId
    test('to test the property `lessonId`', () async {
      // TODO
    });

    // Human-readable description of what went wrong.
    // String message
    test('to test the property `message`', () async {
      // TODO
    });

    // Machine-readable error key (e.g. `whisper-failed`, `audio-extract-failed`, `no-video-source`).
    // String code
    test('to test the property `code`', () async {
      // TODO
    });

  });
}
