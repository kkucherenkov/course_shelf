import 'package:flutter/material.dart';

import 'package:app_ui/src/chip/app_chip_variant.dart';
import 'package:app_ui/src/theme/app_theme.dart';

/// The resolved flat colour triad for one [AppChipVariant]: background fill,
/// label/icon foreground, and an optional border colour (`null` mirrors the
/// web `border-color: transparent` on every colour variant).
@immutable
class AppChipColors {
  const AppChipColors({
    required this.background,
    required this.foreground,
    this.border,
  });

  final Color background;
  final Color foreground;
  final Color? border;
}

/// Resolves the token-driven [AppChipColors] shared by [AppChip], mirroring
/// the web `.app-chip--*` modifier classes.
///
/// [AppChipVariant.neutral] (web `default`) is the only variant that keeps a
/// visible border and reads its background/foreground off the [ColorScheme]
/// (`surfaceContainerHighest` / `onSurface`) rather than a semantic status
/// colour. Every other variant pairs a `*Soft` background with its matching
/// `*Fg` foreground from [AppSemanticColors], borderless.
AppChipColors resolveAppChipColors(
  BuildContext context,
  AppChipVariant variant,
) {
  final cs = Theme.of(context).colorScheme;
  final sem = context.semanticColors;

  return switch (variant) {
    AppChipVariant.neutral => AppChipColors(
      background: cs.surfaceContainerHighest,
      foreground: cs.onSurface,
      border: cs.outline,
    ),
    AppChipVariant.primary => AppChipColors(
      background: sem.accentSoft,
      foreground: sem.accentHover,
    ),
    AppChipVariant.success => AppChipColors(
      background: sem.successSoft,
      foreground: sem.successFg,
    ),
    AppChipVariant.warning => AppChipColors(
      background: sem.warningSoft,
      foreground: sem.warningFg,
    ),
    // `errorFg` has no dedicated semantic-colours slot — `colorScheme.error`
    // is bound to the same `statusErrorFg` token in `AppTheme`, so it is the
    // token-correct source here.
    AppChipVariant.error => AppChipColors(
      background: sem.errorSoft,
      foreground: cs.error,
    ),
    AppChipVariant.info => AppChipColors(
      background: sem.infoSoft,
      foreground: sem.infoFg,
    ),
  };
}
