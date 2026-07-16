import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'package:app_ui/src/icons/icon_cs.dart';
import 'package:app_ui/src/icons/icon_name.dart';
import 'package:app_ui/src/theme/app_theme.dart';
import 'package:app_ui/src/theme/tokens.g.dart';

/// One tab in an [AppTabs] strip. Mirrors the web `AppTab`'s `label` prop;
/// [icon] is a Flutter-side addition (the web `AppTab` never renders a
/// glyph) wired through [IconCS] for parity with [AppSegmentedItemData].
@immutable
class AppTabItem {
  const AppTabItem({required this.label, this.icon});

  final String label;
  final IconName? icon;
}

/// A tab strip — Flutter twin of the web `AppTabs` + `AppTab` pair.
///
/// Controlled: the caller owns [selectedIndex] and receives [onChanged]
/// instead of `AppTabs` holding its own `v-model` state, since Flutter has
/// no two-way-binding primitive to mirror it. Selection is highlighted with
/// a loud text colour + accent underline (web `.app-tab--selected`); arrow
/// keys move focus between tabs and select the focused one (web `AppTab`'s
/// `onKeydown`, non-wrapping at the first/last tab, matching
/// `previousElementSibling`/`nextElementSibling` being `null` at the edges).
class AppTabs extends StatefulWidget {
  const AppTabs({
    required this.items,
    required this.selectedIndex,
    required this.onChanged,
    this.label,
    super.key,
  }) : assert(items.length > 0, 'AppTabs needs at least one item');

  final List<AppTabItem> items;
  final int selectedIndex;
  final ValueChanged<int> onChanged;

  /// aria-label equivalent for the tab strip (web: `label` on the tablist).
  final String? label;

  @override
  State<AppTabs> createState() => _AppTabsState();
}

class _AppTabsState extends State<AppTabs> {
  late List<FocusNode> _focusNodes;

  @override
  void initState() {
    super.initState();
    _focusNodes = _buildFocusNodes(widget.items.length);
  }

  @override
  void didUpdateWidget(covariant AppTabs oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.items.length != widget.items.length) {
      for (final FocusNode node in _focusNodes) {
        node.dispose();
      }
      _focusNodes = _buildFocusNodes(widget.items.length);
    }
  }

  @override
  void dispose() {
    for (final FocusNode node in _focusNodes) {
      node.dispose();
    }
    super.dispose();
  }

  static List<FocusNode> _buildFocusNodes(int count) =>
      List<FocusNode>.generate(
        count,
        (int i) => FocusNode(debugLabel: 'AppTab $i'),
      );

  void _focusAndSelect(int index) {
    _focusNodes[index].requestFocus();
    widget.onChanged(index);
  }

  @override
  Widget build(BuildContext context) {
    final ColorScheme cs = Theme.of(context).colorScheme;

    return Semantics(
      container: true,
      label: widget.label,
      child: DecoratedBox(
        decoration: BoxDecoration(
          border: Border(bottom: BorderSide(color: cs.outline)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: <Widget>[
            for (int i = 0; i < widget.items.length; i++)
              _AppTabButton(
                item: widget.items[i],
                selected: i == widget.selectedIndex,
                focusNode: _focusNodes[i],
                onTap: () => widget.onChanged(i),
                onArrowLeft: i > 0 ? () => _focusAndSelect(i - 1) : null,
                onArrowRight: i < widget.items.length - 1
                    ? () => _focusAndSelect(i + 1)
                    : null,
              ),
          ],
        ),
      ),
    );
  }
}

class _AppTabButton extends StatefulWidget {
  const _AppTabButton({
    required this.item,
    required this.selected,
    required this.focusNode,
    required this.onTap,
    this.onArrowLeft,
    this.onArrowRight,
  });

  final AppTabItem item;
  final bool selected;
  final FocusNode focusNode;
  final VoidCallback onTap;
  final VoidCallback? onArrowLeft;
  final VoidCallback? onArrowRight;

  @override
  State<_AppTabButton> createState() => _AppTabButtonState();
}

class _AppTabButtonState extends State<_AppTabButton> {
  bool _hovered = false;

  KeyEventResult _handleKey(FocusNode node, KeyEvent event) {
    if (event is! KeyDownEvent) return KeyEventResult.ignored;
    if (event.logicalKey == LogicalKeyboardKey.arrowLeft &&
        widget.onArrowLeft != null) {
      widget.onArrowLeft!();
      return KeyEventResult.handled;
    }
    if (event.logicalKey == LogicalKeyboardKey.arrowRight &&
        widget.onArrowRight != null) {
      widget.onArrowRight!();
      return KeyEventResult.handled;
    }
    if (event.logicalKey == LogicalKeyboardKey.enter ||
        event.logicalKey == LogicalKeyboardKey.space) {
      widget.onTap();
      return KeyEventResult.handled;
    }
    return KeyEventResult.ignored;
  }

  @override
  Widget build(BuildContext context) {
    final ThemeData theme = Theme.of(context);
    final ColorScheme cs = theme.colorScheme;
    final AppSemanticColors sem = context.semanticColors;

    final Color color = widget.selected
        ? sem.textLoud
        : (_hovered ? cs.onSurface : cs.onSurfaceVariant);

    // Bound off the theme's labelLarge (packaged sans face); size/weight/
    // colour come from tokens.
    final TextStyle textStyle =
        (theme.textTheme.labelLarge ?? const TextStyle()).copyWith(
          fontSize: AppFontSize.sm,
          fontWeight: AppFontWeight.medium,
          color: color,
        );

    return Semantics(
      selected: widget.selected,
      button: true,
      label: widget.item.label,
      child: Focus(
        focusNode: widget.focusNode,
        // Roving-tabindex parity with the web `tabindex="0 | -1"`: only the
        // selected tab sits in the normal Tab order; the rest are reachable
        // via arrow-key focus moves ([_handleKey]) like the web sibling walk.
        skipTraversal: !widget.selected,
        onKeyEvent: _handleKey,
        child: MouseRegion(
          cursor: SystemMouseCursors.click,
          onEnter: (_) => setState(() => _hovered = true),
          onExit: (_) => setState(() => _hovered = false),
          child: GestureDetector(
            behavior: HitTestBehavior.opaque,
            onTap: widget.onTap,
            child: Container(
              // Web overlaps the tab's own 2px bottom border with the
              // tablist's 1px border via `margin-bottom: -1px`. `Container`
              // asserts non-negative margins, and the visual difference is a
              // sub-pixel hairline, so the offset is dropped rather than
              // worked around with a `Transform` that would perturb layout
              // bounds / hit-testing — a deliberate, documented deviation.
              padding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.s4,
                vertical: AppSpacing.s3,
              ),
              decoration: BoxDecoration(
                border: Border(
                  bottom: BorderSide(
                    width: 2,
                    color: widget.selected ? cs.primary : Colors.transparent,
                  ),
                ),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: <Widget>[
                  if (widget.item.icon != null) ...<Widget>[
                    IconCS(name: widget.item.icon!, size: 16, color: color),
                    const SizedBox(width: AppSpacing.s2),
                  ],
                  Text(widget.item.label, style: textStyle),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
