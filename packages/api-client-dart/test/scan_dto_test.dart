import 'package:test/test.dart';
import 'package:app_api_client/app_api_client.dart';

// tests for ScanDto
void main() {
  final instance = ScanDtoBuilder();
  // TODO add properties to the builder and call build()

  group(ScanDto, () {
    // Server-generated cuid identifying this scan.
    // String id
    test('to test the property `id`', () async {
      // TODO
    });

    // cuid of the library that was scanned.
    // String libraryId
    test('to test the property `libraryId`', () async {
      // TODO
    });

    // ScanStatus status
    test('to test the property `status`', () async {
      // TODO
    });

    // ISO-8601 instant when the scan was started.
    // DateTime startedAt
    test('to test the property `startedAt`', () async {
      // TODO
    });

    // Set on terminal status (`succeeded` / `failed` / `cancelled`). Absent while `status: running`.
    // DateTime finishedAt
    test('to test the property `finishedAt`', () async {
      // TODO
    });

    // Total number of filesystem entries inspected.
    // int filesScanned
    test('to test the property `filesScanned`', () async {
      // TODO
    });

    // Files that did not exist in the catalog before this scan.
    // int filesAdded
    test('to test the property `filesAdded`', () async {
      // TODO
    });

    // Files whose metadata changed since the last scan.
    // int filesUpdated
    test('to test the property `filesUpdated`', () async {
      // TODO
    });

    // Course roots detected during this scan.
    // int coursesDiscovered
    test('to test the property `coursesDiscovered`', () async {
      // TODO
    });

    // Non-fatal per-file errors encountered during the scan.
    // BuiltList<ScanError> errors
    test('to test the property `errors`', () async {
      // TODO
    });

  });
}
