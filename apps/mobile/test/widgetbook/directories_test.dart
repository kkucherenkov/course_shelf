import 'package:flutter_test/flutter_test.dart';
import 'package:widgetbook/widgetbook.dart';

import 'package:app_mobile/widgetbook/directories.dart';

void main() {
  Iterable<WidgetbookComponent> components() =>
      buildWidgetbookDirectories().whereType<WidgetbookComponent>();

  test('catalog registers IconCS with gallery / sizes / fill use cases', () {
    final icon = components().firstWhere((c) => c.name == 'IconCS');

    expect(icon.useCases.map((useCase) => useCase.name).toSet(), {
      'Gallery',
      'Sizes',
      'Fill toggle',
    });
  });

  test('catalog registers AppButton with variant / size / state use cases', () {
    final button = components().firstWhere((c) => c.name == 'AppButton');

    expect(button.useCases.map((useCase) => useCase.name).toSet(), {
      'Variants',
      'Sizes',
      'States',
      'With icons',
    });
  });

  test(
    'catalog registers AppIconButton with variant / size / state use cases',
    () {
      final button = components().firstWhere((c) => c.name == 'AppIconButton');

      expect(button.useCases.map((useCase) => useCase.name).toSet(), {
        'Variants',
        'Sizes',
        'States',
      });
    },
  );

  test('catalog no longer registers the CanaryButton placeholder', () {
    expect(components().map((c) => c.name), isNot(contains('CanaryButton')));
  });

  test('every catalogued component has a unique name', () {
    final names = components().map((c) => c.name).toList();
    expect(
      names.toSet().length,
      names.length,
      reason: 'duplicate component name in the Widgetbook catalog',
    );
  });

  test('the full E17-F01 component wave is wired in', () {
    // Wave 1: IconCS + AppButton + AppIconButton + 7 fields + textarea
    // + 4 containers + 3 feedback + 4 progress + badge + chip + avatar
    // + no-permission (26). Wave 2 completes E17-F01 with overlays (dialog +
    // bottom sheet), empty/error states, and the radio group (+5 = 31).
    expect(components().length, greaterThanOrEqualTo(31));
  });

  test(
    'the E17-F01 wave-2 batch (overlays, states, radio group) is wired in',
    () {
      final names = components().map((c) => c.name).toSet();
      expect(
        names,
        containsAll(<String>{
          'AppDialog',
          'AppBottomSheet',
          'AppEmptyState',
          'AppErrorState',
          'AppRadioGroup',
        }),
      );
    },
  );

  test('the full E17-F02 composite wave is wired in', () {
    // E17-F01 primitives (31) + E17-F02 composites: CourseCard family (3)
    // + AppLessonRow + bookmarks (3) + AppProgressBadge + AppPasswordField
    // + AppSsoBlock + AppDownloadRow + AppNavigationShell + AppPlayerChrome
    // (13) = 44. Wave 2 closes the feature with the two coverage-gap
    // composites — AppBookmarkList + AppSectionHeader (+2 = 46).
    expect(components().length, greaterThanOrEqualTo(46));
  });

  test('the E17-F02 composite components are wired in', () {
    final names = components().map((c) => c.name).toSet();
    expect(
      names,
      containsAll(<String>{
        'CoursePosterCard',
        'CourseWideCard',
        'CourseCompactRow',
        'AppLessonRow',
        'AppBookmark',
        'AppBookmarkAdd',
        'AppNoteEditor',
        'AppProgressBadge',
        'AppPasswordField',
        'AppSsoBlock',
        'AppDownloadRow',
        'AppNavigationShell',
        'AppPlayerChrome',
      }),
    );
  });

  test('the E17-F02 wave-2 batch (bookmark list, section header) is wired in', () {
    final names = components().map((c) => c.name).toSet();
    expect(names, containsAll(<String>{'AppBookmarkList', 'AppSectionHeader'}));
  });
}
