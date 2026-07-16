import 'package:flutter_test/flutter_test.dart';
import 'package:widgetbook/widgetbook.dart';

import 'package:app_mobile/widgetbook/directories.dart';

void main() {
  test('catalog registers CanaryButton with a use case per state', () {
    final directories = buildWidgetbookDirectories();

    final canary = directories.whereType<WidgetbookComponent>().firstWhere(
      (component) => component.name == 'CanaryButton',
    );

    expect(canary.useCases.map((useCase) => useCase.name).toSet(), {
      'Enabled',
      'Disabled',
    });
  });

  test('catalog registers IconCS with gallery / sizes / fill use cases', () {
    final directories = buildWidgetbookDirectories();

    final icon = directories.whereType<WidgetbookComponent>().firstWhere(
      (component) => component.name == 'IconCS',
    );

    expect(icon.useCases.map((useCase) => useCase.name).toSet(), {
      'Gallery',
      'Sizes',
      'Fill toggle',
    });
  });
}
