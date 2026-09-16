import 'package:test/test.dart';
import 'package:app_api_client/app_api_client.dart';

// tests for GradeFlashcardRequest
void main() {
  final instance = GradeFlashcardRequestBuilder();
  // TODO add properties to the builder and call build()

  group(GradeFlashcardRequest, () {
    // 0 - complete blackout    3 - correct, serious difficulty 1 - incorrect, familiar  4 - correct, some hesitation 2 - incorrect, easy      5 - perfect recall Grades below 3 are a lapse: the repetition streak resets and the card is due again in 1 day. 
    // int grade
    test('to test the property `grade`', () async {
      // TODO
    });

  });
}
