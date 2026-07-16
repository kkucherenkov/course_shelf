import 'package:flutter/material.dart';

import 'package:app_ui/src/feedback/app_feedback_colors.dart';
import 'package:app_ui/src/feedback/app_feedback_variant.dart';
import 'package:app_ui/src/icons/icon_cs.dart';
import 'package:app_ui/src/theme/tokens.g.dart';

/// The inline field-level message — Flutter twin of the web `AppAlert`.
///
/// A single-line status glyph + message, typically shown under a form field.
/// Unlike [AppBanner] it has no background, title, or dismiss affordance —
/// see the web `AppAlert.vue` for parity.
///
/// Always announced as a live region: the web component is always
/// `role="alert"` regardless of [variant] (validation feedback should
/// interrupt, unlike [AppBanner]'s `status`/`alert` split).
class AppAlert extends StatelessWidget {
  const AppAlert({
    required this.message,
    this.variant = AppFeedbackVariant.info,
    super.key,
  });

  final String message;
  final AppFeedbackVariant variant;

  /// Web passes `:size="14"` directly to `IconCS` rather than routing
  /// through a token — a locally-owned literal, matched here verbatim.
  static const double _iconSize = 14;

  @override
  Widget build(BuildContext context) {
    final colors = resolveAppFeedbackColors(context, variant);

    // Bind off the theme's labelSmall (xs-sized, carries the packaged sans
    // family) and override only weight/line-height/colour from tokens —
    // never the bare AppTextStyles, which degrades to the platform font in
    // consuming apps.
    final textStyle =
        (Theme.of(context).textTheme.labelSmall ?? const TextStyle()).copyWith(
          fontSize: AppFontSize.xs,
          fontWeight: AppFontWeight.medium,
          height: AppLeading.tight,
          color: colors.foreground,
        );

    return Semantics(
      container: true,
      liveRegion: true,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: <Widget>[
          IconCS(name: variant.icon, size: _iconSize, color: colors.foreground),
          const SizedBox(width: AppSpacing.s1),
          Flexible(child: Text(message, style: textStyle)),
        ],
      ),
    );
  }
}
