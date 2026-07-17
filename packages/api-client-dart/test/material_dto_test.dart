import 'package:test/test.dart';
import 'package:app_api_client/app_api_client.dart';

// tests for MaterialDto
void main() {
  final instance = MaterialDtoBuilder();
  // TODO add properties to the builder and call build()

  group(MaterialDto, () {
    // Server-generated cuid identifying this material.
    // String id
    test('to test the property `id`', () async {
      // TODO
    });

    // MaterialKind kind
    test('to test the property `kind`', () async {
      // TODO
    });

    // Human-readable name derived from the original filename (extension stripped, ordinal prefix preserved if present).
    // String label
    test('to test the property `label`', () async {
      // TODO
    });

    // File size in bytes.
    // int sizeBytes
    test('to test the property `sizeBytes`', () async {
      // TODO
    });

  });
}
