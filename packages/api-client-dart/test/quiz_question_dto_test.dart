import 'package:test/test.dart';
import 'package:app_api_client/app_api_client.dart';

// tests for QuizQuestionDto
void main() {
  final instance = QuizQuestionDtoBuilder();
  // TODO add properties to the builder and call build()

  group(QuizQuestionDto, () {
    // The question text.
    // String prompt
    test('to test the property `prompt`', () async {
      // TODO
    });

    // Exactly four answer options.
    // BuiltList<String> options
    test('to test the property `options`', () async {
      // TODO
    });

    // Index into `options` of the correct answer.
    // int correctOptionIndex
    test('to test the property `correctOptionIndex`', () async {
      // TODO
    });

    // Start timestamp (ms) of the transcript window this question was generated from — assigned by the window, not the model, so it cannot be hallucinated.
    // int cueStartMs
    test('to test the property `cueStartMs`', () async {
      // TODO
    });

  });
}
