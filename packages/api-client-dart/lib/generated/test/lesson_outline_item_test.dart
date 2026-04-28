import 'package:test/test.dart';
import 'package:app_api_client/app_api_client.dart';

// tests for LessonOutlineItem
void main() {
  final instance = LessonOutlineItemBuilder();
  // TODO add properties to the builder and call build()

  group(LessonOutlineItem, () {
    // String id
    test('to test the property `id`', () async {
      // TODO
    });

    // int position
    test('to test the property `position`', () async {
      // TODO
    });

    // String title
    test('to test the property `title`', () async {
      // TODO
    });

    // int durationSeconds
    test('to test the property `durationSeconds`', () async {
      // TODO
    });

    // Whether the lesson has at least one sidecar material.
    // bool hasMaterials
    test('to test the property `hasMaterials`', () async {
      // TODO
    });

    // Per-user lesson state. Derived: `completed` when the `LessonProgress` row has `completed: true`; `in-progress` when it has progress but is not complete; `locked` when the requester does not hold a READ grant on the course's library (defensive — usually the whole course 403s before this); `not-started` otherwise.
    // String state
    test('to test the property `state`', () async {
      // TODO
    });

    // 0..100 — only meaningful when `state === 'in-progress'`.
    // int progressPercent
    test('to test the property `progressPercent`', () async {
      // TODO
    });

  });
}
