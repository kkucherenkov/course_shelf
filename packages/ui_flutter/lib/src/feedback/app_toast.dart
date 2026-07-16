import 'package:flutter/material.dart';

import 'package:app_ui/src/buttons/app_button_variant.dart';
import 'package:app_ui/src/buttons/app_icon_button.dart';
import 'package:app_ui/src/feedback/app_toast_variant.dart';
import 'package:app_ui/src/icons/icon_name.dart';
import 'package:app_ui/src/theme/app_theme.dart';
import 'package:app_ui/src/theme/tokens.g.dart';

/// The transient status notification — Flutter twin of the web `AppToast`.
///
/// A raised, shadowed pill with a colour-coded dot (no icon glyph — the web
/// twin uses a plain `<span>` dot rather than `IconCS`) and a message; an
/// optional dismiss affordance.
///
/// The web `.app-toast` is `display: inline-flex` with `min-width: 280px`
/// and a `flex: 1 1 auto` message that grows to fill any leftover width once
/// the min-width kicks in. [IntrinsicWidth] + [ConstrainedBox] reproduce
/// that: the toast hugs its content up to 280 logical pixels, and the
/// message [Expanded] absorbs any extra width beyond that — without
/// requiring the ambient layout to hand this widget a bounded max width the
/// way a bare [Expanded] inside an unconstrained [Row] would.
class AppToast extends StatelessWidget {
  const AppToast({
    required this.message,
    this.variant = AppToastVariant.info,
    this.dismissible = false,
    this.dismissLabel = 'Dismiss',
    this.onDismiss,
    super.key,
  });

  final String message;
  final AppToastVariant variant;
  final bool dismissible;
  final String dismissLabel;
  final VoidCallback? onDismiss;

  static const double _dotSize = 8;
  static const double _minWidth = 280;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;
    final sem = context.semanticColors;

    final Color dotColor = switch (variant) {
      AppToastVariant.success => sem.successFg,
      AppToastVariant.info => sem.infoFg,
      AppToastVariant.error => cs.error,
    };

    final messageStyle = (theme.textTheme.bodySmall ?? const TextStyle())
        .copyWith(fontSize: AppFontSize.sm, color: cs.onSurface);

    return Semantics(
      container: true,
      liveRegion: true,
      child: ConstrainedBox(
        constraints: const BoxConstraints(minWidth: _minWidth),
        child: IntrinsicWidth(
          child: Container(
            padding: const EdgeInsets.symmetric(
              vertical: AppSpacing.s3,
              horizontal: AppSpacing.s4,
            ),
            decoration: BoxDecoration(
              color: sem.raised,
              border: Border.all(color: cs.outline),
              borderRadius: BorderRadius.circular(AppRadius.md),
              boxShadow: context.shadows.md,
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: <Widget>[
                SizedBox(
                  width: _dotSize,
                  height: _dotSize,
                  child: DecoratedBox(
                    key: const Key('app-toast-dot'),
                    decoration: BoxDecoration(
                      color: dotColor,
                      shape: BoxShape.circle,
                    ),
                  ),
                ),
                const SizedBox(width: AppSpacing.s3),
                Expanded(child: Text(message, style: messageStyle)),
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
        ),
      ),
    );
  }
}
