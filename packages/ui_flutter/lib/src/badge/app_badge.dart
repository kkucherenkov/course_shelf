import 'package:flutter/material.dart';

import 'package:app_ui/src/badge/app_badge_color.dart';
import 'package:app_ui/src/badge/app_badge_style.dart';
import 'package:app_ui/src/badge/app_badge_variant.dart';
import 'package:app_ui/src/icons/icon_cs.dart';
import 'package:app_ui/src/icons/icon_name.dart';
import 'package:app_ui/src/theme/tokens.g.dart';

/// The brand status/count badge — Flutter twin of the web `AppBadge`
/// (itself a thin wrapper around Nuxt UI's `UBadge`).
///
/// Six [AppBadgeColor]s across four [AppBadgeVariant]s and three
/// [AppBadgeSize]s, with an optional leading [IconCS] glyph and an
/// [uppercase] modifier. See [resolveAppBadgeColors] for the colour
/// resolution.
class AppBadge extends StatelessWidget {
  const AppBadge({
    this.label,
    this.child,
    this.color = AppBadgeColor.neutral,
    this.variant = AppBadgeVariant.subtle,
    this.size = AppBadgeSize.md,
    this.icon,
    this.uppercase = false,
    super.key,
  }) : assert(
         label != null || child != null || icon != null,
         'AppBadge needs a label, child, or icon to render',
       );

  final String? label;

  /// Custom label content; overrides [label] when both are set.
  final Widget? child;

  final AppBadgeColor color;
  final AppBadgeVariant variant;
  final AppBadgeSize size;

  /// Optional leading glyph, sized off [AppBadgeSize.iconSize].
  final IconName? icon;

  /// Upper-cases [label] and widens its tracking (web:
  /// `text-transform: uppercase; letter-spacing: var(--tracking-wide)`).
  /// Has no effect on [child] — arbitrary widget content can't be
  /// CSS-text-transformed generically.
  final bool uppercase;

  @override
  Widget build(BuildContext context) {
    final AppBadgeColors colors = resolveAppBadgeColors(
      context,
      color,
      variant,
    );

    final TextStyle textStyle =
        (Theme.of(context).textTheme.labelSmall ?? const TextStyle()).copyWith(
          fontSize: size.fontSize,
          fontWeight: AppFontWeight.medium,
          color: colors.foreground,
          letterSpacing:
              (uppercase ? AppTracking.wide : AppTracking.normal) *
              size.fontSize,
        );

    final Widget? labelWidget =
        child ??
        (label != null
            ? Text(uppercase ? label!.toUpperCase() : label!, style: textStyle)
            : null);

    return DecoratedBox(
      decoration: BoxDecoration(
        color: colors.background,
        borderRadius: BorderRadius.circular(size.radius),
        border: colors.border != null
            ? Border.all(color: colors.border!)
            : null,
      ),
      child: Padding(
        padding: EdgeInsets.symmetric(
          horizontal: size.horizontalPadding,
          vertical: size.verticalPadding,
        ),
        child: DefaultTextStyle.merge(
          style: textStyle,
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: <Widget>[
              if (icon != null) ...<Widget>[
                IconCS(
                  name: icon!,
                  size: size.iconSize,
                  color: colors.foreground,
                ),
                if (labelWidget != null) SizedBox(width: size.gap),
              ],
              if (labelWidget != null) labelWidget,
            ],
          ),
        ),
      ),
    );
  }
}
