import 'package:test/test.dart';
import 'package:app_api_client/app_api_client.dart';

// tests for NoteDto
void main() {
  final instance = NoteDtoBuilder();
  // TODO add properties to the builder and call build()

  group(NoteDto, () {
    // Server-generated cuid identifying this note.
    // String id
    test('to test the property `id`', () async {
      // TODO
    });

    // cuid of the lesson this note belongs to.
    // String lessonId
    test('to test the property `lessonId`', () async {
      // TODO
    });

    // Plain Markdown stored verbatim. Server does not render.
    // String body
    test('to test the property `body`', () async {
      // TODO
    });

    // ISO-8601 instant when the note was first created.
    // DateTime createdAt
    test('to test the property `createdAt`', () async {
      // TODO
    });

    // ISO-8601 instant when the note body was last replaced.
    // DateTime updatedAt
    test('to test the property `updatedAt`', () async {
      // TODO
    });

  });
}
