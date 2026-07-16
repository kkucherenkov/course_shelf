import 'package:flutter/material.dart';
import 'package:widgetbook/widgetbook.dart';

import 'package:app_ui/app_ui.dart';

/// Widgetbook component cataloguing the `app_ui` [AppBadge] across its
/// colours, variants, sizes, icon slot, and uppercase modifier.
WidgetbookComponent buildBadgeComponent() {
  return WidgetbookComponent(
    name: 'AppBadge',
    useCases: [
      WidgetbookUseCase(name: 'Colors', builder: _colors),
      WidgetbookUseCase(name: 'Variants', builder: _variants),
      WidgetbookUseCase(name: 'Sizes', builder: _sizes),
      WidgetbookUseCase(name: 'With icon', builder: _withIcon),
      WidgetbookUseCase(name: 'Uppercase', builder: _uppercase),
    ],
  );
}

Widget _column(List<Widget> children) => Center(
  child: Padding(
    padding: const EdgeInsets.all(16),
    child: Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        for (final child in children)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 8),
            child: child,
          ),
      ],
    ),
  ),
);

Widget _wrap(List<Widget> children) =>
    Center(child: Wrap(spacing: 12, runSpacing: 12, children: children));

Widget _colors(BuildContext context) => _wrap([
  for (final color in AppBadgeColor.values)
    AppBadge(label: color.name, color: color),
]);

Widget _variants(BuildContext context) => _column([
  for (final variant in AppBadgeVariant.values)
    _wrap([
      for (final color in AppBadgeColor.values)
        AppBadge(label: color.name, color: color, variant: variant),
    ]),
]);

Widget _sizes(BuildContext context) => _wrap([
  for (final size in AppBadgeSize.values)
    AppBadge(label: size.name, size: size, color: AppBadgeColor.primary),
]);

Widget _withIcon(BuildContext context) => _wrap([
  const AppBadge(
    label: 'Verified',
    icon: IconName.check,
    color: AppBadgeColor.success,
  ),
  const AppBadge(
    label: 'Locked',
    icon: IconName.lock,
    color: AppBadgeColor.neutral,
  ),
  const AppBadge(
    label: 'Alert',
    icon: IconName.alert,
    color: AppBadgeColor.error,
    variant: AppBadgeVariant.solid,
  ),
]);

Widget _uppercase(BuildContext context) => _wrap([
  const AppBadge(label: 'beta', uppercase: true, color: AppBadgeColor.warning),
  const AppBadge(label: 'new', uppercase: true, color: AppBadgeColor.info),
]);
