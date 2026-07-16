import 'package:flutter/material.dart';
import 'package:widgetbook/widgetbook.dart';

import 'package:app_mobile/widgetbook/canary_button.dart';

/// Builds the Widgetbook navigation tree.
///
/// Kept as a plain function (no `@widgetbook.App` code generation) so the tree
/// is a testable value. E17 registers the real `app_ui` components here,
/// alongside or in place of the [CanaryButton] placeholder.
List<WidgetbookNode> buildWidgetbookDirectories() {
  return [
    WidgetbookComponent(
      name: 'CanaryButton',
      useCases: [
        WidgetbookUseCase(
          name: 'Enabled',
          builder: (context) => Center(
            child: CanaryButton(label: 'Enabled', onPressed: () {}),
          ),
        ),
        WidgetbookUseCase(
          name: 'Disabled',
          builder: (context) => const Center(
            child: CanaryButton(label: 'Disabled', onPressed: null),
          ),
        ),
      ],
    ),
  ];
}
