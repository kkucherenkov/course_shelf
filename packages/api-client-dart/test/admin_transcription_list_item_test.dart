import 'package:test/test.dart';
import 'package:app_api_client/app_api_client.dart';

// tests for AdminTranscriptionListItem
void main() {
  final instance = AdminTranscriptionListItemBuilder();
  // TODO add properties to the builder and call build()

  group(AdminTranscriptionListItem, () {
    // String transcriptionId
    test('to test the property `transcriptionId`', () async {
      // TODO
    });

    // String libraryId
    test('to test the property `libraryId`', () async {
      // TODO
    });

    // String libraryName
    test('to test the property `libraryName`', () async {
      // TODO
    });

    // TranscriptionStatus status
    test('to test the property `status`', () async {
      // TODO
    });

    // When true, the run redid existing generated transcripts — which is why its `lessonsTotal` and `lessonsTranscribed` are close together.
    // bool force
    test('to test the property `force`', () async {
      // TODO
    });

    // DateTime startedAt
    test('to test the property `startedAt`', () async {
      // TODO
    });

    // DateTime finishedAt
    test('to test the property `finishedAt`', () async {
      // TODO
    });

    // int lessonsTotal
    test('to test the property `lessonsTotal`', () async {
      // TODO
    });

    // Lessons for which this run produced a transcript, highlighted as a \"+N\" badge the way `coursesAdded` is for scans.
    // int lessonsTranscribed
    test('to test the property `lessonsTranscribed`', () async {
      // TODO
    });

    // Number of error records attached to this run — the same number as the run's `lessonsFailed`. Fetch the run itself for the details.
    // int errorsCount
    test('to test the property `errorsCount`', () async {
      // TODO
    });

  });
}
