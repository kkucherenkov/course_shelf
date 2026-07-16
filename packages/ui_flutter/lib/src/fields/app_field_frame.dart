import 'package:flutter/material.dart';

import 'package:app_ui/src/fields/app_field_size.dart';
import 'package:app_ui/src/theme/tokens.g.dart';

/// Label + control + help/error decoration shared by [AppTextField],
/// [AppNumberField], and [AppSearchField] — Flutter twin of the web `AppField`
/// composition wrapper those three components each embed internally.
///
/// Not a standalone port of `AppField` itself (out of scope for this card —
/// `AppSelect`'s web twin stays a bare control for the same reason, see
/// `AppSelect`'s doc comment). This reproduces its layout only: a label row,
/// `space-2` gaps between label/control/footer, and an error message that
/// takes priority over help text and is announced as a live region (mirrors
/// the web `role="alert"` on the error `<p>`).
class AppFieldFrame extends StatelessWidget {
  const AppFieldFrame({
    required this.label,
    required this.child,
    this.help,
    this.error,
    this.required = false,
    this.size = AppFieldSize.md,
    super.key,
  });

  final String label;
  final Widget child;
  final String? help;
  final String? error;
  final bool required;
  final AppFieldSize size;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;

    // Bind off the theme's labelLarge/bodySmall (which carry the packaged
    // sans family) and override only size/weight/colour from tokens — never
    // the bare AppTextStyles, which degrades to the platform font in
    // consuming apps.
    final labelStyle = (theme.textTheme.labelLarge ?? const TextStyle())
        .copyWith(
          fontSize: size.labelFontSize,
          fontWeight: AppFontWeight.medium,
          color: cs.onSurface,
        );
    final helpStyle = (theme.textTheme.bodySmall ?? const TextStyle()).copyWith(
      fontSize: AppFontSize.xs,
      color: cs.onSurfaceVariant,
    );
    final errorStyle = helpStyle.copyWith(
      color: cs.error,
      fontWeight: AppFontWeight.medium,
    );

    final String? footer = error ?? help;
    final bool isError = error != null;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: <Widget>[
        Row(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.baseline,
          textBaseline: TextBaseline.alphabetic,
          children: <Widget>[
            Text(label, style: labelStyle),
            if (required) ...<Widget>[
              const SizedBox(width: AppSpacing.s1),
              Text(
                '*',
                style: labelStyle.copyWith(
                  color: cs.error,
                  fontWeight: AppFontWeight.semibold,
                ),
              ),
            ],
          ],
        ),
        const SizedBox(height: AppSpacing.s2),
        child,
        if (footer != null) ...<Widget>[
          const SizedBox(height: AppSpacing.s2),
          Semantics(
            liveRegion: isError,
            child: Text(footer, style: isError ? errorStyle : helpStyle),
          ),
        ],
      ],
    );
  }
}
