import 'package:test/test.dart';
import 'package:app_api_client/app_api_client.dart';

// tests for CourseMaterialItem
void main() {
  final instance = CourseMaterialItemBuilder();
  // TODO add properties to the builder and call build()

  group(CourseMaterialItem, () {
    // String id
    test('to test the property `id`', () async {
      // TODO
    });

    // Owning lesson id. Used by the right-rail to link to the lesson.
    // String lessonId
    test('to test the property `lessonId`', () async {
      // TODO
    });

    // Owning section id. Used by the rail to group items.
    // String sectionId
    test('to test the property `sectionId`', () async {
      // TODO
    });

    // Title of the owning section, denormalised so the rail can render its grouping caption without resolving via `sections[]`.
    // String sectionTitle
    test('to test the property `sectionTitle`', () async {
      // TODO
    });

    // String kind
    test('to test the property `kind`', () async {
      // TODO
    });

    // String label
    test('to test the property `label`', () async {
      // TODO
    });

    // int sizeBytes
    test('to test the property `sizeBytes`', () async {
      // TODO
    });

  });
}
