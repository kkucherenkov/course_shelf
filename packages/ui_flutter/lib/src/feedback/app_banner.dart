import 'package:flutter/material.dart';

import 'package:app_ui/src/buttons/app_button_variant.dart';
import 'package:app_ui/src/buttons/app_icon_button.dart';
import 'package:app_ui/src/feedback/app_feedback_colors.dart';
import 'package:app_ui/src/feedback/app_feedback_variant.dart';
import 'package:app_ui/src/icons/icon_cs.dart';
import 'package:app_ui/src/icons/icon_name.dart';
import 'package:app_ui/src/theme/app_theme.dart';
import 'package:app_ui/src/theme/tokens.g.dart';

/// The block-level notification surface — Flutter twin of the web
/// `AppBanner`.
///
/// A tinted card with a status glyph, optional [title], [body] text (or a
/// custom [child], which wins over [body] — mirrors the web default slot
/// winning over its `body` prop fallback), an optional [actions] row, and an
/// optional dismiss affordance.
///
/// The web container itself takes the variant accent colour (`color:
/// var(--info)`, etc.) but [title]/[body] each set their own colour
/// (`text-loud` / `text-fg`) that overrides it by CSS specificity — so only
/// the icon actually renders in the variant accent. Reproduced here by
/// colouring the icon from [AppFeedbackColors.foreground] and leaving
/// title/body on fixed theme colours.
class AppBanner extends StatelessWidget {
  const AppBanner({
    this.variant = AppFeedbackVariant.info,
    this.title,
    this.body,
    this.child,
    this.actions,
    this.dismissible = false,
    this.dismissLabel = 'Dismiss',
    this.onDismiss,
    super.key,
  });

  final AppFeedbackVariant variant;

  /// Rendered as an emphasised heading above the body; omitted entirely
  /// when null (mirrors the web `v-if="title"`).
  final String? title;

  /// Fallback body text, rendered when [child] is not provided.
  final String? body;

  /// Custom body content; overrides [body] when both are set (mirrors the
  /// web default slot winning over its `body` prop).
  final Widget? child;

  /// Optional call-to-action row, shown below the body (mirrors the web
  /// `#actions` slot). Compose multiple actions into a single `Row`/`Wrap`
  /// before passing them in.
  final Widget? actions;

  final bool dismissible;
  final String dismissLabel;
  final VoidCallback? onDismiss;

  /// Web passes `:size="20"` directly to `IconCS` — a locally-owned literal,
  /// matched here verbatim (see `AppAlert._iconSize` for the same pattern).
  static const double _iconSize = 20;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;
    final sem = context.semanticColors;
    final colors = resolveAppFeedbackColors(context, variant);

    final titleStyle = (theme.textTheme.bodyMedium ?? const TextStyle())
        .copyWith(fontWeight: AppFontWeight.medium, color: sem.textLoud);
    final bodyStyle = (theme.textTheme.bodySmall ?? const TextStyle()).copyWith(
      fontSize: AppFontSize.sm,
      height: AppLeading.snug,
      color: cs.onSurface,
    );

    final Widget content = child ?? Text(body ?? '', style: bodyStyle);

    return Semantics(
      container: true,
      liveRegion: true,
      child: Container(
        padding: const EdgeInsets.symmetric(
          vertical: AppSpacing.s3,
          horizontal: AppSpacing.s4,
        ),
        decoration: BoxDecoration(
          color: colors.soft,
          borderRadius: BorderRadius.circular(AppRadius.md),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Padding(
              padding: const EdgeInsets.only(top: 2),
              child: IconCS(
                name: variant.icon,
                size: _iconSize,
                color: colors.foreground,
              ),
            ),
            const SizedBox(width: AppSpacing.s3),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: <Widget>[
                  if (title != null) ...<Widget>[
                    Text(title!, style: titleStyle),
                    const SizedBox(height: AppSpacing.s1),
                  ],
                  content,
                  if (actions != null) ...<Widget>[
                    const SizedBox(height: AppSpacing.s2),
                    actions!,
                  ],
                ],
              ),
            ),
            if (dismissible) ...<Widget>[
              const SizedBox(width: AppSpacing.s3),
              AppIconButton(
                name: IconName.x,
                semanticLabel: dismissLabel,
                variant: AppButtonVariant.ghost,
                size: AppButtonSize.sm,
                onPressed: onDismiss,
              ),
            ],
          ],
        ),
      ),
    );
  }
}
