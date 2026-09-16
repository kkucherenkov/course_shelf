import 'package:test/test.dart';
import 'package:app_api_client/app_api_client.dart';

// tests for FlashcardDto
void main() {
  final instance = FlashcardDtoBuilder();
  // TODO add properties to the builder and call build()

  group(FlashcardDto, () {
    // Server-generated cuid identifying this flashcard.
    // String id
    test('to test the property `id`', () async {
      // TODO
    });

    // cuid of the lesson this flashcard belongs to.
    // String lessonId
    test('to test the property `lessonId`', () async {
      // TODO
    });

    // Prompt side. Trimmed server-side.
    // String front
    test('to test the property `front`', () async {
      // TODO
    });

    // Answer side. Trimmed server-side.
    // String back
    test('to test the property `back`', () async {
      // TODO
    });

    // cuid of the TranscriptCue this card was made from, when created from a transcript line. Absent for manual and note-derived cards.
    // String sourceCueId
    test('to test the property `sourceCueId`', () async {
      // TODO
    });

    // SM-2 ease factor. Starts at 2.5, floors at 1.3.
    // double easeFactor
    test('to test the property `easeFactor`', () async {
      // TODO
    });

    // Days until the next scheduled review. 0 for a never-reviewed card.
    // int intervalDays
    test('to test the property `intervalDays`', () async {
      // TODO
    });

    // Consecutive passing reviews (grade >= 3) since the last lapse.
    // int repetitions
    test('to test the property `repetitions`', () async {
      // TODO
    });

    // ISO-8601 instant this card is next due for review.
    // DateTime dueAt
    test('to test the property `dueAt`', () async {
      // TODO
    });

    // ISO-8601 instant when the flashcard was first created.
    // DateTime createdAt
    test('to test the property `createdAt`', () async {
      // TODO
    });

    // ISO-8601 instant when the flashcard was last updated.
    // DateTime updatedAt
    test('to test the property `updatedAt`', () async {
      // TODO
    });

  });
}
