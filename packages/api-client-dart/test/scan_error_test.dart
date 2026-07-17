import 'package:test/test.dart';
import 'package:app_api_client/app_api_client.dart';

// tests for ScanError
void main() {
  final instance = ScanErrorBuilder();
  // TODO add properties to the builder and call build()

  group(ScanError, () {
    // Filesystem path relative to the library root, e.g. `01 - Intro to DDD/03 - Aggregates.mp4`.
    // String path
    test('to test the property `path`', () async {
      // TODO
    });

    // Human-readable description of what went wrong.
    // String message
    test('to test the property `message`', () async {
      // TODO
    });

    // Machine-readable error key (e.g. `course-json-invalid`, `unreadable-file`, `unsupported-extension`).
    // String code
    test('to test the property `code`', () async {
      // TODO
    });

  });
}
