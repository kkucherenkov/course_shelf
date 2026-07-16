import 'package:flutter/material.dart';

import 'package:app_ui/src/feedback/app_feedback_variant.dart';
import 'package:app_ui/src/theme/app_theme.dart';

/// The resolved foreground / soft-background pair for one [AppFeedbackVariant].
///
/// Shared by [AppAlert] (foreground only) and [AppBanner] (both), mirroring
/// how the web twins key their `color` / `background` off the same
/// `var(--info)` / `var(--info-soft)` (etc.) token pairs per variant.
@immutable
class AppFeedbackColors {
  const AppFeedbackColors({required this.foreground, required this.soft});

  final Color foreground;
  final Color soft;
}

/// Resolves [AppFeedbackColors] for [variant].
///
/// `error` has no dedicated slot in [AppSemanticColors] — `cs.error` /
/// `sem.errorSoft` already carry the same `statusErrorFg` / `statusErrorSoft`
/// tokens the web `--error` / `--error-soft` variables resolve to, so they're
/// reused directly instead of duplicating the token in [AppSemanticColors].
AppFeedbackColors resolveAppFeedbackColors(
  BuildContext context,
  AppFeedbackVariant variant,
) {
  final cs = Theme.of(context).colorScheme;
  final sem = context.semanticColors;

  return switch (variant) {
    AppFeedbackVariant.info => AppFeedbackColors(
      foreground: sem.infoFg,
      soft: sem.infoSoft,
    ),
    AppFeedbackVariant.success => AppFeedbackColors(
      foreground: sem.successFg,
      soft: sem.successSoft,
    ),
    AppFeedbackVariant.warning => AppFeedbackColors(
      foreground: sem.warningFg,
      soft: sem.warningSoft,
    ),
    AppFeedbackVariant.error => AppFeedbackColors(
      foreground: cs.error,
      soft: sem.errorSoft,
    ),
  };
}
