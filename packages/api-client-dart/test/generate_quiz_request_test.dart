import 'package:test/test.dart';
import 'package:app_api_client/app_api_client.dart';

// tests for GenerateQuizRequest
void main() {
  final instance = GenerateQuizRequestBuilder();
  // TODO add properties to the builder and call build()

  group(GenerateQuizRequest, () {
    // Filename of the .gguf weight to use (see `GET /admin/model-weights`). Omitted uses the deployment's configured default.
    // String modelId
    test('to test the property `modelId`', () async {
      // TODO
    });

    // Runs an ASR-typo cleanup pass on each transcript window before generating questions from it. The cleaned text is never written back to the transcript — only used for this run. Turning it off roughly halves generation time and is reasonable for already-clean author-provided subtitles.
    // bool cleanupEnabled (default value: true)
    test('to test the property `cleanupEnabled`', () async {
      // TODO
    });

  });
}
