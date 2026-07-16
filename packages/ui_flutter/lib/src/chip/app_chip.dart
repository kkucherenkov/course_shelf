import 'package:flutter/material.dart';

import 'package:app_ui/src/chip/app_chip_style.dart';
import 'package:app_ui/src/chip/app_chip_variant.dart';
import 'package:app_ui/src/icons/icon_cs.dart';
import 'package:app_ui/src/icons/icon_name.dart';
import 'package:app_ui/src/theme/tokens.g.dart';

/// The brand chip — Flutter twin of the web `AppChip`.
///
/// Six [AppChipVariant]s across three [AppChipSize]s, with an optional
/// leading [IconCS] glyph, a [selected] accent ring, a [disabled] fade, and an
/// optional [removable] dismiss affordance that fires [onRemove] independent
/// of [onTap] (mirrors the web `@click.stop` on its remove button).
///
/// Unlike the web twin — a fixed-box `<button>` whose whole padded area is
/// clickable — this port keeps the chip's natural hug-content sizing: only
/// the icon+label region is wired to [onTap], and the remove affordance is a
/// sibling hit-region rather than a nested one, so tapping it can never also
/// trigger [onTap] (nested `GestureDetector`s of the same gesture type both
/// fire in Flutter, unlike a DOM `stopPropagation()`).
class AppChip extends StatelessWidget {
  const AppChip({
    this.label,
    this.child,
    this.variant = AppChipVariant.neutral,
    this.size = AppChipSize.md,
    this.icon,
    this.removable = false,
    this.selected = false,
    this.disabled = false,
    this.onTap,
    this.onRemove,
    super.key,
  }) : assert(
         label != null || child != null,
         'AppChip needs a label or child to render',
       );

  final String? label;

  /// Custom label content; overrides [label] when both are set.
  final Widget? child;

  final AppChipVariant variant;
  final AppChipSize size;

  /// Optional glyph rendered on the leading side of the label.
  final IconName? icon;

  /// Shows a trailing dismiss affordance that fires [onRemove] when tapped.
  final bool removable;

  /// Draws an accent border, mirroring the web `--selected` modifier.
  final bool selected;

  /// Fades the chip and blocks both [onTap] and [onRemove].
  final bool disabled;

  final VoidCallback? onTap;
  final VoidCallback? onRemove;

  /// Gap between the leading icon and the label (web: flat `gap: 6px` on
  /// `.app-chip`, not routed through a spacing token — a locally-owned
  /// literal even on web).
  static const double _iconLabelGap = 6;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;
    final colors = resolveAppChipColors(context, variant);

    final labelStyle = (theme.textTheme.labelLarge ?? const TextStyle())
        .copyWith(
          fontSize: size.fontSize,
          fontWeight: AppFontWeight.medium,
          color: colors.foreground,
        );

    Border? border;
    if (selected) {
      // Web pairs a `border-color` swap with an inset `box-shadow` ring in
      // the same accent colour; Flutter has no inset-shadow primitive, so a
      // single accent border approximates both together.
      border = Border.all(color: cs.primary, width: 1.5);
    } else if (colors.border != null) {
      border = Border.all(color: colors.border!);
    }

    final Widget labelWidget = child ?? Text(label!, style: labelStyle);

    final Widget content = Row(
      mainAxisSize: MainAxisSize.min,
      children: <Widget>[
        if (icon != null) ...<Widget>[
          IconCS(name: icon!, size: size.iconSize, color: colors.foreground),
          const SizedBox(width: _iconLabelGap),
        ],
        DefaultTextStyle.merge(style: labelStyle, child: labelWidget),
      ],
    );

    // `Semantics` is the outermost widget (not nested inside `Opacity`) so
    // `AppChip`'s own render object is the one carrying the button/selected
    // annotations — `WidgetTester.getSemantics` walks *up* the render tree
    // from a widget's own render object to find its owning node, so nesting
    // it one level deeper would resolve to an ancestor's node instead.
    return Semantics(
      container: true,
      button: true,
      enabled: !disabled,
      selected: selected,
      child: Opacity(
        opacity: disabled ? AppOpacity.disabled : 1,
        child: Container(
          height: size.height,
          alignment: Alignment.center,
          padding: EdgeInsets.symmetric(horizontal: size.horizontalPadding),
          decoration: BoxDecoration(
            color: colors.background,
            borderRadius: BorderRadius.circular(AppRadius.pill),
            border: border,
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: <Widget>[
              GestureDetector(
                behavior: HitTestBehavior.opaque,
                onTap: disabled ? null : onTap,
                child: content,
              ),
              if (removable)
                _AppChipRemoveAffordance(
                  color: colors.foreground,
                  iconSize: size.iconSize,
                  disabled: disabled,
                  onRemove: onRemove,
                ),
            ],
          ),
        ),
      ),
    );
  }
}

/// The trailing dismiss affordance shown when [AppChip.removable] is true.
///
/// A sibling hit-region to the chip's own tap area (not nested inside it),
/// so it can never bubble into [AppChip.onTap] — the Flutter equivalent of
/// the web `@click.stop` on its `.app-chip__remove` span.
class _AppChipRemoveAffordance extends StatelessWidget {
  const _AppChipRemoveAffordance({
    required this.color,
    required this.iconSize,
    required this.disabled,
    required this.onRemove,
  });

  final Color color;
  final double iconSize;
  final bool disabled;
  final VoidCallback? onRemove;

  /// Web: `margin-inline-start: 2px; padding: 2px;` on `.app-chip__remove` —
  /// locally-owned literals, matching the web component's own hard-coded
  /// values rather than a spacing token.
  static const double _gap = 2;
  static const double _hitPadding = 2;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(left: _gap),
      child: Semantics(
        button: true,
        label: 'Remove',
        enabled: !disabled,
        child: GestureDetector(
          behavior: HitTestBehavior.opaque,
          onTap: disabled ? null : onRemove,
          child: Padding(
            padding: const EdgeInsets.all(_hitPadding),
            child: IconCS(name: IconName.x, size: iconSize, color: color),
          ),
        ),
      ),
    );
  }
}
