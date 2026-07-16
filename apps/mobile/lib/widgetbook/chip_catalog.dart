import 'package:flutter/material.dart';
import 'package:widgetbook/widgetbook.dart';

import 'package:app_ui/app_ui.dart';

/// Widgetbook component cataloguing the `app_ui` [AppChip] across its
/// variants and the removable dismiss affordance.
WidgetbookComponent buildChipComponent() {
  return WidgetbookComponent(
    name: 'AppChip',
    useCases: [
      WidgetbookUseCase(name: 'Variants', builder: _variants),
      WidgetbookUseCase(name: 'Removable', builder: _removable),
    ],
  );
}

Widget _wrap(List<Widget> children) =>
    Center(child: Wrap(spacing: 12, runSpacing: 12, children: children));

Widget _variants(BuildContext context) => _wrap([
  for (final variant in AppChipVariant.values)
    AppChip(label: variant.name, variant: variant),
]);

Widget _removable(BuildContext context) => _wrap([
  for (final variant in AppChipVariant.values)
    AppChip(
      label: variant.name,
      variant: variant,
      removable: true,
      onRemove: () {},
    ),
]);
