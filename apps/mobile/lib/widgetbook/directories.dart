import 'package:flutter/material.dart';
import 'package:widgetbook/widgetbook.dart';

import 'package:app_mobile/widgetbook/canary_button.dart';
import 'package:app_mobile/widgetbook/icon_cs_catalog.dart';

/// Builds the Widgetbook navigation tree.
///
/// Kept as a plain function (no `@widgetbook.App` code generation) so the tree
/// is a testable value. The [CanaryButton] placeholder is retired once the real
/// `app_ui` button lands (E17-F01-S02); [buildIconCsComponent] is the first
/// real component catalogued here.
List<WidgetbookNode> buildWidgetbookDirectories() {
  return [
    buildIconCsComponent(),
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
