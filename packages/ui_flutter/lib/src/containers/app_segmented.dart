import 'package:flutter/material.dart';

import 'package:app_ui/src/icons/icon_cs.dart';
import 'package:app_ui/src/icons/icon_name.dart';
import 'package:app_ui/src/theme/app_theme.dart';
import 'package:app_ui/src/theme/tokens.g.dart';

/// One option in an [AppSegmented] control. Mirrors the web
/// `AppSegmentedItem`'s `label` prop; [icon] is a Flutter-side addition (the
/// web item never renders a glyph) wired through [IconCS] for parity with
/// [AppTabItem]-style items.
@immutable
class AppSegmentedItemData {
  const AppSegmentedItemData({required this.label, this.icon});

  final String label;
  final IconName? icon;
}

/// A segmented control — Flutter twin of the web `AppSegmented` +
/// `AppSegmentedItem` pair (an ARIA `radiogroup`/`radio` pattern).
///
/// Controlled: the caller owns [selectedIndex] and receives [onChanged]
/// (no internal `v-model`-equivalent state). The selected item gets a raised
/// surface fill, loud text, and a small elevation (web
/// `.app-segmented-item--selected`'s `--shadow-1`).
class AppSegmented extends StatelessWidget {
  const AppSegmented({
    required this.items,
    required this.selectedIndex,
    required this.onChanged,
    this.label,
    super.key,
  }) : assert(items.length > 0, 'AppSegmented needs at least one item');

  final List<AppSegmentedItemData> items;
  final int selectedIndex;
  final ValueChanged<int> onChanged;

  /// aria-label equivalent for the group (web: `label` on the radiogroup).
  final String? label;

  /// Web hardcodes `padding: 2px` on `.app-segmented` directly (not a spacing
  /// token) — reproduced verbatim.
  static const double _containerPadding = 2;

  @override
  Widget build(BuildContext context) {
    final ColorScheme cs = Theme.of(context).colorScheme;
    final AppSemanticColors sem = context.semanticColors;

    return Semantics(
      container: true,
      label: label,
      child: Container(
        padding: const EdgeInsets.all(_containerPadding),
        decoration: BoxDecoration(
          color: sem.raised,
          border: Border.all(color: cs.outline),
          borderRadius: BorderRadius.circular(AppRadius.md),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: <Widget>[
            for (int i = 0; i < items.length; i++)
              _AppSegmentedButton(
                item: items[i],
                selected: i == selectedIndex,
                onTap: () => onChanged(i),
              ),
          ],
        ),
      ),
    );
  }
}

class _AppSegmentedButton extends StatefulWidget {
  const _AppSegmentedButton({
    required this.item,
    required this.selected,
    required this.onTap,
  });

  final AppSegmentedItemData item;
  final bool selected;
  final VoidCallback onTap;

  @override
  State<_AppSegmentedButton> createState() => _AppSegmentedButtonState();
}

class _AppSegmentedButtonState extends State<_AppSegmentedButton> {
  bool _focused = false;

  /// Web spec: "border-radius: 6px; // bundle spec: exactly 6px" — a
  /// deliberate, locally-owned literal, distinct from `AppRadius.sm` (4) or
  /// `AppRadius.md` (8).
  static const double _itemRadius = 6;

  @override
  Widget build(BuildContext context) {
    final ThemeData theme = Theme.of(context);
    final ColorScheme cs = theme.colorScheme;
    final AppSemanticColors sem = context.semanticColors;

    final Color background = widget.selected ? cs.surface : Colors.transparent;
    final Color color = widget.selected ? sem.textLoud : cs.onSurfaceVariant;

    final TextStyle textStyle =
        (theme.textTheme.labelSmall ?? const TextStyle()).copyWith(
          fontSize: AppFontSize.xs,
          fontWeight: AppFontWeight.medium,
          color: color,
        );

    return Semantics(
      inMutuallyExclusiveGroup: true,
      checked: widget.selected,
      button: true,
      label: widget.item.label,
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(_itemRadius),
        child: InkWell(
          onTap: widget.onTap,
          onFocusChange: (bool value) => setState(() => _focused = value),
          borderRadius: BorderRadius.circular(_itemRadius),
          overlayColor: const WidgetStatePropertyAll<Color>(Colors.transparent),
          splashFactory: NoSplash.splashFactory,
          child: Container(
            padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.s3,
              vertical: AppSpacing.s2,
            ),
            decoration: BoxDecoration(
              color: background,
              borderRadius: BorderRadius.circular(_itemRadius),
              border: _focused ? Border.all(color: cs.primary, width: 2) : null,
              boxShadow: widget.selected ? context.shadows.xs : null,
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: <Widget>[
                if (widget.item.icon != null) ...<Widget>[
                  IconCS(name: widget.item.icon!, size: 14, color: color),
                  const SizedBox(width: AppSpacing.s1),
                ],
                Text(widget.item.label, style: textStyle),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
