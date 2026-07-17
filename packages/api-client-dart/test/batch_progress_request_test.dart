import 'package:test/test.dart';
import 'package:app_api_client/app_api_client.dart';

// tests for BatchProgressRequest
void main() {
  final instance = BatchProgressRequestBuilder();
  // TODO add properties to the builder and call build()

  group(BatchProgressRequest, () {
    // Up to 200 progress writes. Cap exists to bound server-side work and to keep request bodies under the 1 MiB JSON ceiling. 
    // BuiltList<RecordProgressRequest> items
    test('to test the property `items`', () async {
      // TODO
    });

  });
}
