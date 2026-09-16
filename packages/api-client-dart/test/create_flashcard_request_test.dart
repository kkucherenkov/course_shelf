import 'package:test/test.dart';
import 'package:app_api_client/app_api_client.dart';

// tests for CreateFlashcardRequest
void main() {
  final instance = CreateFlashcardRequestBuilder();
  // TODO add properties to the builder and call build()

  group(CreateFlashcardRequest, () {
    // Prompt side. Trimmed server-side, so it must contain a non-whitespace character.
    // String front
    test('to test the property `front`', () async {
      // TODO
    });

    // Answer side. Trimmed server-side, so it must contain a non-whitespace character.
    // String back
    test('to test the property `back`', () async {
      // TODO
    });

    // Optional cuid of the TranscriptCue this card is made from — set when the card was created from a transcript line, omitted for manual and note-derived cards.
    // String sourceCueId
    test('to test the property `sourceCueId`', () async {
      // TODO
    });

  });
}
