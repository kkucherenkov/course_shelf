import 'package:test/test.dart';
import 'package:app_api_client/app_api_client.dart';

// tests for SubtitleDto
void main() {
  final instance = SubtitleDtoBuilder();
  // TODO add properties to the builder and call build()

  group(SubtitleDto, () {
    // Server-generated cuid identifying this subtitle track.
    // String id
    test('to test the property `id`', () async {
      // TODO
    });

    // BCP-47-ish language code parsed from the filename suffix (`Lesson.en.srt` → `en`). `und` when no suffix is present.
    // String language
    test('to test the property `language`', () async {
      // TODO
    });

    // Human-readable label for the subtitle track (e.g. \"English\").
    // String label
    test('to test the property `label`', () async {
      // TODO
    });

  });
}
