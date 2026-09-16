import 'package:test/test.dart';
import 'package:app_api_client/app_api_client.dart';

// tests for QuizDto
void main() {
  final instance = QuizDtoBuilder();
  // TODO add properties to the builder and call build()

  group(QuizDto, () {
    // String id
    test('to test the property `id`', () async {
      // TODO
    });

    // String lessonId
    test('to test the property `lessonId`', () async {
      // TODO
    });

    // String courseId
    test('to test the property `courseId`', () async {
      // TODO
    });

    // QuizStatus status
    test('to test the property `status`', () async {
      // TODO
    });

    // Filename of the .gguf weight this proposal was generated with — what lets an admin compare a 4B run against a 9B run of the same lesson.
    // String modelFilename
    test('to test the property `modelFilename`', () async {
      // TODO
    });

    // BuiltList<QuizQuestionDto> questions
    test('to test the property `questions`', () async {
      // TODO
    });

    // DateTime createdAt
    test('to test the property `createdAt`', () async {
      // TODO
    });

    // DateTime completedAt
    test('to test the property `completedAt`', () async {
      // TODO
    });

  });
}
