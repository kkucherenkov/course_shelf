import 'package:flutter/material.dart';

import 'package:app_ui/src/badge/app_badge_color.dart';
import 'package:app_ui/src/badge/app_badge_variant.dart';
import 'package:app_ui/src/theme/app_theme.dart';

/// The resolved background / foreground / border for one
/// ([AppBadgeColor], [AppBadgeVariant]) pair.
///
/// [border] is `null` for [AppBadgeVariant.solid] and [AppBadgeVariant.soft]
/// (Nuxt UI draws no ring for either), and set for
/// [AppBadgeVariant.outline] / [AppBadgeVariant.subtle].
@immutable
class AppBadgeColors {
  const AppBadgeColors({
    required this.background,
    required this.foreground,
    this.border,
  });

  final Color background;
  final Color foreground;
  final Color? border;
}

/// Resolves the flat, token-driven colours for [AppBadge], mirroring the
/// compound-variant table Nuxt UI's `UBadge` theme builds per `color` ×
/// `variant` (`bg-{color} text-inverted` for solid, `text-{color} ring
/// ring-{color}/50` for outline, `bg-{color}/10 text-{color}` for soft,
/// `bg-{color}/10 text-{color} ring ring-{color}/25` for subtle).
///
/// `success` / `warning` / `info` have no dedicated "on-status" colour slot
/// in [AppSemanticColors] or [ColorScheme] (only `primary` and `error` do,
/// via `onPrimary` / `onError`). `cs.onError` is reused as the solid
/// foreground for those three: by construction in [AppTheme] it is bound to
/// the same `textInverse` token as `onPrimary` in both themes, i.e. it *is*
/// this design system's generic "text drawn on a saturated colour" slot, not
/// an error-specific one.
AppBadgeColors resolveAppBadgeColors(
  BuildContext context,
  AppBadgeColor color,
  AppBadgeVariant variant,
) {
  final ColorScheme cs = Theme.of(context).colorScheme;
  final AppSemanticColors sem = context.semanticColors;

  // The colour used for text/icon in every non-solid variant, and reused as
  // the `solid` background.
  final Color text;
  final Color solidForeground;
  final Color softBackground;
  final Color subtleBackground;
  // Only `neutral` has a dedicated (opaque) border token — every other
  // colour derives its ring from `text` at reduced alpha instead.
  Color? neutralBorder;

  switch (color) {
    case AppBadgeColor.primary:
      text = cs.primary;
      solidForeground = cs.onPrimary;
      softBackground = sem.accentSoft;
      subtleBackground = cs.primaryContainer;
    case AppBadgeColor.neutral:
      text = cs.onSurface;
      solidForeground = cs.onInverseSurface;
      softBackground = sem.raised;
      subtleBackground = sem.raised;
      neutralBorder = cs.outline;
    case AppBadgeColor.success:
      text = sem.successFg;
      solidForeground = cs.onError;
      softBackground = sem.successSoft;
      subtleBackground = sem.successSubtle;
    case AppBadgeColor.warning:
      text = sem.warningFg;
      solidForeground = cs.onError;
      softBackground = sem.warningSoft;
      subtleBackground = sem.warningSubtle;
    case AppBadgeColor.error:
      text = cs.error;
      solidForeground = cs.onError;
      softBackground = sem.errorSoft;
      subtleBackground = cs.errorContainer;
    case AppBadgeColor.info:
      text = sem.infoFg;
      solidForeground = cs.onError;
      softBackground = sem.infoSoft;
      subtleBackground = sem.infoSubtle;
  }

  final Color solidBackground = color == AppBadgeColor.neutral
      ? cs.inverseSurface
      : text;

  return switch (variant) {
    AppBadgeVariant.solid => AppBadgeColors(
      background: solidBackground,
      foreground: solidForeground,
    ),
    AppBadgeVariant.outline => AppBadgeColors(
      background: Colors.transparent,
      foreground: text,
      border: neutralBorder ?? text.withValues(alpha: 0.5),
    ),
    AppBadgeVariant.soft => AppBadgeColors(
      background: softBackground,
      foreground: text,
    ),
    AppBadgeVariant.subtle => AppBadgeColors(
      background: subtleBackground,
      foreground: text,
      border: neutralBorder ?? text.withValues(alpha: 0.25),
    ),
  };
}
