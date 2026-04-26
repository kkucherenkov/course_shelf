import 'package:test/test.dart';
import 'package:app_api_client/app_api_client.dart';

// tests for Model1
void main() {
  final instance = Model1Builder();
  // TODO add properties to the builder and call build()

  group(Model1, () {
    // Discriminator value indicating a course-scoped grant. Accepted in v1 even though the Course aggregate (E06-F03-S01) has not landed yet — keeps the contract stable for E14-F04-S01.
    // String kind
    test('to test the property `kind`', () async {
      // TODO
    });

    // Server-generated cuid of the target course (e.g. \"DDD by Eric Evans\").
    // String courseId
    test('to test the property `courseId`', () async {
      // TODO
    });

  });
}
