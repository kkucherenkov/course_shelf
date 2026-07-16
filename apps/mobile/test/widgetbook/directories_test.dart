import 'package:flutter_test/flutter_test.dart';
import 'package:widgetbook/widgetbook.dart';

import 'package:app_mobile/widgetbook/directories.dart';

void main() {
  test('catalog registers CanaryButton with a use case per state', () {
    final directories = buildWidgetbookDirectories();

    final canary = directories
        .whereType<WidgetbookComponent>()
        .firstWhere((component) => component.name == 'CanaryButton');

    expect(
      canary.useCases.map((useCase) => useCase.name).toSet(),
      {'Enabled', 'Disabled'},
    );
  });
}
