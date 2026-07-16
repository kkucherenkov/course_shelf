import 'package:flutter/material.dart';

import 'package:app_ui/src/theme/app_theme.dart';
import 'package:app_ui/src/theme/tokens.g.dart';

/// A list row — Flutter twin of the web `AppRow`.
///
/// [leading] / [body] / [trailing] are independent `Widget?` slots (web:
/// leading/default/trailing). [body] always occupies the flexible middle
/// column even when null (mirrors the web's unconditional
/// `<div class="app-row__body">`); [leading]/[trailing] render only when
/// supplied. [selected] paints an accent-soft fill and sets selected
/// semantics (web `aria-selected`); [compact] tightens vertical padding;
/// [interactive] renders a focusable, tappable surface (web
/// `<button type="button">`) with a hover fill and focus ring.
class AppRow extends StatefulWidget {
  const AppRow({
    this.leading,
    this.body,
    this.trailing,
    this.selected = false,
    this.compact = false,
    this.interactive = false,
    this.onTap,
    super.key,
  });

  final Widget? leading;
  final Widget? body;
  final Widget? trailing;
  final bool selected;
  final bool compact;
  final bool interactive;

  /// Fires on tap when [interactive] is true; ignored otherwise.
  final VoidCallback? onTap;

  @override
  State<AppRow> createState() => _AppRowState();
}

class _AppRowState extends State<AppRow> {
  bool _hovered = false;
  bool _focused = false;

  void _setHovered(bool value) {
    if (_hovered == value) return;
    setState(() => _hovered = value);
  }

  void _setFocused(bool value) {
    if (_focused == value) return;
    setState(() => _focused = value);
  }

  @override
  Widget build(BuildContext context) {
    final ThemeData theme = Theme.of(context);
    final ColorScheme cs = theme.colorScheme;
    final AppSemanticColors sem = context.semanticColors;

    // The trailing slot inherits a tabular-figures monospace style from its
    // container on web (`font-family: var(--font-mono);
    // font-variant-numeric: tabular-nums`); `AppTypography.code` is the
    // sanctioned accessor for the packaged mono family (the theme's
    // `textTheme` is deliberately all-sans — see `AppTheme._textTheme`).
    final TextStyle trailingStyle =
        (theme.textTheme.bodySmall ?? const TextStyle()).copyWith(
          fontFamily: AppTypography.code.fontFamily,
          fontSize: AppFontSize.xs,
          color: cs.onSurfaceVariant,
          fontFeatures: const <FontFeature>[FontFeature.tabularFigures()],
        );

    final double verticalPadding = widget.compact
        ? AppSpacing.s2
        : AppSpacing.s3;

    Color background = Colors.transparent;
    if (widget.selected) {
      background = sem.accentSoft;
    } else if (widget.interactive && _hovered) {
      background = sem.raised;
    }

    final List<Widget> children = <Widget>[
      if (widget.leading != null) ...<Widget>[
        KeyedSubtree(
          key: const ValueKey<String>('appRowLeading'),
          child: widget.leading!,
        ),
        const SizedBox(width: AppSpacing.s3),
      ],
      Expanded(
        child: KeyedSubtree(
          key: const ValueKey<String>('appRowBody'),
          child: widget.body ?? const SizedBox.shrink(),
        ),
      ),
      if (widget.trailing != null) ...<Widget>[
        const SizedBox(width: AppSpacing.s3),
        KeyedSubtree(
          key: const ValueKey<String>('appRowTrailing'),
          child: DefaultTextStyle.merge(
            style: trailingStyle,
            child: widget.trailing!,
          ),
        ),
      ],
    ];

    Widget row = Semantics(
      selected: widget.selected,
      child: Container(
        padding: EdgeInsets.symmetric(
          horizontal: AppSpacing.s3,
          vertical: verticalPadding,
        ),
        decoration: BoxDecoration(
          color: background,
          borderRadius: BorderRadius.circular(AppRadius.md),
          border: widget.interactive && _focused
              ? Border.all(color: cs.primary, width: 2)
              : null,
        ),
        child: Row(children: children),
      ),
    );

    if (widget.interactive) {
      row = Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(AppRadius.md),
        child: InkWell(
          onTap: widget.onTap,
          onHover: _setHovered,
          onFocusChange: _setFocused,
          borderRadius: BorderRadius.circular(AppRadius.md),
          overlayColor: const WidgetStatePropertyAll<Color>(Colors.transparent),
          splashFactory: NoSplash.splashFactory,
          child: row,
        ),
      );
    }

    return row;
  }
}
