import 'package:flutter/material.dart';
import 'package:widgetbook/widgetbook.dart';

import 'package:app_ui/app_ui.dart';

/// Widgetbook component cataloguing `AppRadioGroup` — one [WidgetbookComponent]
/// with one use case per state (default vertical, with descriptions,
/// disabled). No horizontal-orientation use case: `AppRadioGroup` matches its
/// web twin 1:1 and only ever lays out vertically (see the doc comment on
/// `AppRadioGroup` in `package:app_ui`).
WidgetbookComponent buildRadioGroupComponent() {
  return WidgetbookComponent(
    name: 'AppRadioGroup',
    useCases: [
      WidgetbookUseCase(name: 'Default', builder: _radioGroupDefault),
      WidgetbookUseCase(
        name: 'With descriptions',
        builder: _radioGroupWithDescriptions,
      ),
      WidgetbookUseCase(name: 'Disabled', builder: _radioGroupDisabled),
    ],
  );
}

Widget _column(List<Widget> children) => Center(
  child: Padding(
    padding: const EdgeInsets.all(16),
    child: SizedBox(
      width: 320,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          for (final child in children)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 8),
              child: child,
            ),
        ],
      ),
    ),
  ),
);

Widget _radioGroupDefault(BuildContext context) => _column([
  const AppRadioGroup<String>(
    label: 'List density',
    value: 'comfortable',
    options: <AppRadioGroupOption<String>>[
      AppRadioGroupOption(value: 'comfortable', label: 'Comfortable'),
      AppRadioGroupOption(value: 'compact', label: 'Compact'),
    ],
  ),
]);

Widget _radioGroupWithDescriptions(BuildContext context) => _column([
  const AppRadioGroup<String>(
    label: 'Notification frequency',
    value: 'daily',
    options: <AppRadioGroupOption<String>>[
      AppRadioGroupOption(
        value: 'daily',
        label: 'Daily digest',
        description: 'One email a day with everything new.',
      ),
      AppRadioGroupOption(
        value: 'weekly',
        label: 'Weekly digest',
        description: 'A single summary every Monday.',
      ),
    ],
  ),
]);

Widget _radioGroupDisabled(BuildContext context) => _column([
  const AppRadioGroup<String>(
    label: 'Disabled group',
    value: 'a',
    disabled: true,
    options: <AppRadioGroupOption<String>>[
      AppRadioGroupOption(value: 'a', label: 'Option A'),
      AppRadioGroupOption(value: 'b', label: 'Option B'),
    ],
  ),
]);
