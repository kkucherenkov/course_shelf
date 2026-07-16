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
}
