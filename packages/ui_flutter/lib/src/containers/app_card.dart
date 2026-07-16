import 'package:flutter/material.dart';

import 'package:app_ui/src/theme/app_theme.dart';
import 'package:app_ui/src/theme/tokens.g.dart';

/// Padding/radius bundle for [AppCard] — Flutter twin of the web `.card`
/// (`md`) and `.card-lg` (`lg`) classes. Every metric maps onto a token
/// 1:1 (`AppSpacing.s4`/`s5`, `AppRadius.md`/`lg`) — no locally-owned scale.
enum AppCardSize { md, lg }

/// The brand content card — Flutter twin of the web `AppCard`.
///
/// Header ([title]/[description], or a raw [header] override), [child]
/// body, and [footer] are independent slots: each renders only when
/// supplied, mirroring the Vue component's `v-if="$slots[...]"` guards. Two
/// [AppCardSize]s (`.card` / `.card-lg`), a non-focusable [hoverable] lift
/// (`.card-hover`), and a focusable, tappable [interactive] mode (renders as
/// a `<button>` on web) round out the variant surface.
class AppCard extends StatefulWidget {
  const AppCard({
    this.title,
    this.description,
    this.header,
    this.child,
    this.footer,
    this.size = AppCardSize.md,
    this.hoverable = false,
    this.interactive = false,
    this.onTap,
    super.key,
  });

  /// Rendered as the header's heading when [header] is not supplied.
  final String? title;

  /// Rendered under [title] when [header] is not supplied.
  final String? description;

  /// Overrides the built-in title/description header entirely — the web
  /// twin's named `header` slot.
  final Widget? header;

  /// The body slot (web: default `<slot />`). Omitted entirely when null —
  /// no empty body container is rendered.
  final Widget? child;

  /// The footer slot. Omitted entirely when null.
  final Widget? footer;

  final AppCardSize size;

  /// Visual hover affordance without focusability (`.card-hover`). Ignored
  /// when [interactive] is true, matching the web `hoverable && !interactive`
  /// class guard — interactive already supplies a richer hover.
  final bool hoverable;

  /// Renders a focusable, clickable surface with keyboard activation
  /// (Enter/Space, via [InkWell]'s built-in `ActivateIntent` handling) and a
  /// focus/hover elevation shadow. Mirrors the web `<button type="button">`
  /// mode.
  final bool interactive;

  /// Fires on tap when [interactive] is true; ignored otherwise (mirrors the
  /// web `handleClick` early-return on `!props.interactive`).
  final VoidCallback? onTap;

  @override
  State<AppCard> createState() => _AppCardState();
}

class _AppCardState extends State<AppCard> {
  bool _hovered = false;
  bool _focused = false;

  /// The non-focusable hover lift is skipped once the card is interactive —
  /// interactive already supplies its own hover treatment.
  bool get _hoverLift => widget.hoverable && !widget.interactive;

  double get _padding =>
      widget.size == AppCardSize.md ? AppSpacing.s4 : AppSpacing.s5;

  double get _radius =>
      widget.size == AppCardSize.md ? AppRadius.md : AppRadius.lg;

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

    // Bind off the theme's titleLarge/bodyMedium (which carry the packaged
    // sans family) and override only size/weight/colour from tokens — never
    // the bare AppTextStyles, which degrades to the platform font in
    // consuming apps.
    final TextStyle titleStyle =
        (theme.textTheme.titleLarge ?? const TextStyle()).copyWith(
          fontSize: AppFontSize.lg,
          fontWeight: AppFontWeight.semibold,
          color: cs.onSurface,
        );
    final TextStyle descriptionStyle =
        (theme.textTheme.bodyMedium ?? const TextStyle()).copyWith(
          fontSize: AppFontSize.sm,
          color: cs.onSurfaceVariant,
        );

    Widget? headerContent = widget.header;
    if (headerContent == null &&
        (widget.title != null || widget.description != null)) {
      headerContent = Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          if (widget.title != null) Text(widget.title!, style: titleStyle),
          if (widget.description != null)
            Padding(
              padding: const EdgeInsets.only(top: AppSpacing.s1),
              child: Text(widget.description!, style: descriptionStyle),
            ),
        ],
      );
    }

    final Color borderColor = _hoverLift && _hovered
        ? cs.outlineVariant
        : cs.outline;
    final Color backgroundColor = _hoverLift && _hovered
        ? sem.raised
        : cs.surface;

    List<BoxShadow>? shadow;
    if (widget.interactive) {
      if (_focused) {
        shadow = context.shadows.focus;
      } else if (_hovered) {
        shadow = context.shadows.md;
      }
    }

    final Widget content = Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: <Widget>[
        if (headerContent != null)
          Container(
            key: const ValueKey<String>('appCardHeader'),
            padding: EdgeInsets.all(_padding),
            decoration: BoxDecoration(
              border: Border(bottom: BorderSide(color: cs.outline)),
            ),
            child: headerContent,
          ),
        if (widget.child != null)
          Padding(
            key: const ValueKey<String>('appCardBody'),
            padding: EdgeInsets.all(_padding),
            child: widget.child,
          ),
        if (widget.footer != null)
          Container(
            key: const ValueKey<String>('appCardFooter'),
            padding: EdgeInsets.all(_padding),
            decoration: BoxDecoration(
              border: Border(top: BorderSide(color: cs.outline)),
            ),
            child: widget.footer,
          ),
      ],
    );

    Widget card = DecoratedBox(
      decoration: BoxDecoration(
        color: backgroundColor,
        border: Border.all(color: borderColor),
        borderRadius: BorderRadius.circular(_radius),
        boxShadow: shadow,
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(_radius),
        child: content,
      ),
    );

    if (widget.interactive) {
      card = Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(_radius),
        child: InkWell(
          onTap: widget.onTap,
          onHover: _setHovered,
          onFocusChange: _setFocused,
          borderRadius: BorderRadius.circular(_radius),
          overlayColor: const WidgetStatePropertyAll<Color>(Colors.transparent),
          splashFactory: NoSplash.splashFactory,
          child: card,
        ),
      );
    } else if (widget.hoverable) {
      card = MouseRegion(
        onEnter: (_) => _setHovered(true),
        onExit: (_) => _setHovered(false),
        child: card,
      );
    }

    return card;
  }
}
