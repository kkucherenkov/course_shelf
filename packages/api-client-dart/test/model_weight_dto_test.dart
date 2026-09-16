import 'package:test/test.dart';
import 'package:app_api_client/app_api_client.dart';

// tests for ModelWeightDto
void main() {
  final instance = ModelWeightDtoBuilder();
  // TODO add properties to the builder and call build()

  group(ModelWeightDto, () {
    // String filename
    test('to test the property `filename`', () async {
      // TODO
    });

    // File size in bytes, as reported by the filesystem.
    // int sizeBytes
    test('to test the property `sizeBytes`', () async {
      // TODO
    });

    // True for a `.gguf` file (a llama.cpp weight, selectable as `GenerateQuizRequest.modelId`); false for whisper's `.bin`.
    // bool usableForQuizGeneration
    test('to test the property `usableForQuizGeneration`', () async {
      // TODO
    });

  });
}
