import 'package:flutter/material.dart';
import 'package:widgetbook/widgetbook.dart';

import 'package:app_ui/app_ui.dart';

/// Widgetbook component cataloguing the `app_ui` [AppButton] across its
/// variants, sizes, states, and icon slots.
WidgetbookComponent buildAppButtonComponent() {
  return WidgetbookComponent(
    name: 'AppButton',
    useCases: [
      WidgetbookUseCase(name: 'Variants', builder: _variants),
      WidgetbookUseCase(name: 'Sizes', builder: _sizes),
      WidgetbookUseCase(name: 'States', builder: _states),
      WidgetbookUseCase(name: 'With icons', builder: _withIcons),
      WidgetbookUseCase(name: 'Icon-only & a11y', builder: _accessibility),
    ],
  );
}

/// Widgetbook component cataloguing the square [AppIconButton].
WidgetbookComponent buildAppIconButtonComponent() {
  return WidgetbookComponent(
    name: 'AppIconButton',
    useCases: [
      WidgetbookUseCase(name: 'Variants', builder: _iconVariants),
      WidgetbookUseCase(name: 'Sizes', builder: _iconSizes),
      WidgetbookUseCase(name: 'States', builder: _iconStates),
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

Widget _variants(BuildContext context) => _column([
  for (final variant in AppButtonVariant.values)
    AppButton(label: variant.name, variant: variant, onPressed: () {}),
]);

Widget _sizes(BuildContext context) => _column([
  for (final size in AppButtonSize.values)
    AppButton(
      label: size.name,
      size: size,
      iconLeading: IconName.play,
      onPressed: () {},
    ),
]);

Widget _states(BuildContext context) => _column([
  AppButton(label: 'Default', onPressed: () {}),
  const AppButton(label: 'Loading', loading: true),
  const AppButton(label: 'Disabled', disabled: true),
  SizedBox(
    width: 280,
    child: AppButton(label: 'Block', block: true, onPressed: () {}),
  ),
]);

Widget _withIcons(BuildContext context) => _column([
  AppButton(label: 'Leading', iconLeading: IconName.play, onPressed: () {}),
  AppButton(
    label: 'Trailing',
    iconTrailing: IconName.chevronRight,
    onPressed: () {},
  ),
  AppButton(
    label: 'Both',
    iconLeading: IconName.play,
    iconTrailing: IconName.chevronRight,
    onPressed: () {},
  ),
]);

/// Icon- and child-only buttons carry no visible text, so they must be named
/// with [AppButton.semanticLabel]. Toggle the OS screen reader (or Flutter's
/// semantics debugger) over these to hear the announced name — including the
/// loading button, whose spinner replaces every visible glyph.
Widget _accessibility(BuildContext context) => _column([
  AppButton(
    iconLeading: IconName.play,
    semanticLabel: 'Play',
    onPressed: () {},
  ),
  AppButton(
    variant: AppButtonVariant.destructive,
    iconLeading: IconName.trash,
    semanticLabel: 'Delete',
    onPressed: () {},
  ),
  const AppButton(semanticLabel: 'Saving', loading: true, child: Text('Save')),
]);

Widget _iconVariants(BuildContext context) => _wrap([
  for (final variant in AppButtonVariant.values)
    AppIconButton(
      name: IconName.play,
      semanticLabel: variant.name,
      variant: variant,
      onPressed: () {},
    ),
]);

Widget _iconSizes(BuildContext context) => _wrap([
  for (final size in AppButtonSize.values)
    AppIconButton(
      name: IconName.play,
      semanticLabel: size.name,
      size: size,
      onPressed: () {},
    ),
]);

Widget _iconStates(BuildContext context) => _wrap([
  AppIconButton(
    name: IconName.play,
    semanticLabel: 'Default',
    onPressed: () {},
  ),
  const AppIconButton(
    name: IconName.play,
    semanticLabel: 'Loading',
    loading: true,
  ),
  const AppIconButton(
    name: IconName.play,
    semanticLabel: 'Disabled',
    disabled: true,
  ),
]);
