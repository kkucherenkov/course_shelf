import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'package:app_ui/src/theme/app_theme.dart';
import 'package:app_ui/src/theme/tokens.g.dart';

/// Track/thumb size ramp for [AppSwitch] — independent of [AppFieldSize]
/// since neither the web `AppSwitch`'s track geometry nor its size names
/// line up with the input control ramp.
///
/// Locally-owned pixel scale. The web source expresses these via
/// `var(--space-10)`, `--space-12`, `--space-14`, `--space-16` SCSS variables
/// that do not exist in the generated token set (`docs/design/shared/tokens.json`'s
/// `space` scale only defines keys `0`-`9`, topping out at `--space-9` =
/// 96px) — a pre-existing inconsistency in the web component, out of scope to
/// fix here. Each SCSS declaration carries a `// Npx` comment recording the
/// intended value; those comments (self-consistent with the `left:
/// var(--space-1)` thumb inset, which *is* a real 4px token, and the
/// checked-state `translate()` amounts) are the values below.
enum AppSwitchSize {
  sm,
  md,
  lg;

  double get trackWidth => switch (this) {
    AppSwitchSize.sm => 20,
    AppSwitchSize.md => 24,
    AppSwitchSize.lg => 32,
  };

  double get trackHeight => switch (this) {
    AppSwitchSize.sm => 12,
    AppSwitchSize.md => 16,
    AppSwitchSize.lg => 20,
  };

  double get thumbSize => switch (this) {
    AppSwitchSize.sm => 8,
    AppSwitchSize.md => 10,
    AppSwitchSize.lg => 12,
  };
}

/// Checked-state track colour — Flutter twin of the web `AppSwitch`'s
/// `color` prop (`primary | success | neutral`). The off state is always
/// neutral (`border-strong`) regardless of this value, matching web.
enum AppSwitchColor { primary, success, neutral }

/// The brand toggle switch — Flutter twin of the web `AppSwitch`.
class AppSwitch extends StatefulWidget {
  const AppSwitch({
    required this.value,
    this.onChanged,
    this.label,
    this.disabled = false,
    this.size = AppSwitchSize.md,
    this.color = AppSwitchColor.primary,
    this.focusNode,
    this.autofocus = false,
    super.key,
  });

  final bool value;
  final ValueChanged<bool>? onChanged;
  final String? label;
  final bool disabled;
  final AppSwitchSize size;
  final AppSwitchColor color;
  final FocusNode? focusNode;
  final bool autofocus;

  @override
  State<AppSwitch> createState() => _AppSwitchState();
}

class _AppSwitchState extends State<AppSwitch> {
  FocusNode? _ownedFocusNode;
  FocusNode get _focusNode =>
      widget.focusNode ?? (_ownedFocusNode ??= FocusNode());

  @override
  void initState() {
    super.initState();
    _focusNode.addListener(_onFocusChange);
  }

  @override
  void dispose() {
    _focusNode.removeListener(_onFocusChange);
    _ownedFocusNode?.dispose();
    super.dispose();
  }

  void _onFocusChange() => setState(() {});

  void _toggle() {
    if (widget.disabled) return;
    widget.onChanged?.call(!widget.value);
  }

  void _onKeyEvent(KeyEvent event) {
    if (event is KeyDownEvent && event.logicalKey == LogicalKeyboardKey.space) {
      _toggle();
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;
    final sem = context.semanticColors;
    final focused = _focusNode.hasFocus;

    final Color checkedColor = switch (widget.color) {
      AppSwitchColor.primary => cs.primary,
      AppSwitchColor.success => sem.successFg,
      AppSwitchColor.neutral => cs.onSurface,
    };
    final Color trackColor = widget.value ? checkedColor : cs.outlineVariant;

    final double trackWidth = widget.size.trackWidth;
    final double trackHeight = widget.size.trackHeight;
    final double thumbSize = widget.size.thumbSize;
    const double offLeft = AppSpacing.s1;
    final double onLeft = trackWidth - thumbSize;

    final Widget track = SizedBox(
      width: trackWidth,
      height: trackHeight,
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: trackColor,
          borderRadius: BorderRadius.circular(AppRadius.pill),
          boxShadow: focused ? context.shadows.focus : null,
        ),
        child: Stack(
          clipBehavior: Clip.none,
          children: <Widget>[
            AnimatedPositioned(
              duration: AppDuration.base,
              curve: AppEasing.easeDefault,
              left: widget.value ? onLeft : offLeft,
              top: (trackHeight - thumbSize) / 2,
              child: DecoratedBox(
                decoration: BoxDecoration(
                  color: cs.surface,
                  shape: BoxShape.circle,
                  boxShadow: context.shadows.sm,
                ),
                child: SizedBox(width: thumbSize, height: thumbSize),
              ),
            ),
          ],
        ),
      ),
    );

    final List<Widget> children = <Widget>[
      track,
      if (widget.label != null) ...<Widget>[
        const SizedBox(width: AppSpacing.s4),
        Text(
          widget.label!,
          style: (theme.textTheme.bodyMedium ?? const TextStyle()).copyWith(
            fontSize: AppFontSize.md,
            fontWeight: AppFontWeight.medium,
            color: cs.onSurface,
          ),
        ),
      ],
    ];

    Widget control = Focus(
      focusNode: _focusNode,
      autofocus: widget.autofocus,
      onKeyEvent: (node, event) {
        _onKeyEvent(event);
        return KeyEventResult.handled;
      },
      child: GestureDetector(
        onTap: widget.disabled ? null : _toggle,
        child: MouseRegion(
          cursor: widget.disabled
              ? SystemMouseCursors.forbidden
              : SystemMouseCursors.click,
          child: Row(mainAxisSize: MainAxisSize.min, children: children),
        ),
      ),
    );

    control = Semantics(
      toggled: widget.value,
      enabled: !widget.disabled,
      label: widget.label,
      child: ExcludeSemantics(child: control),
    );

    if (widget.disabled) {
      control = Opacity(opacity: AppOpacity.disabled, child: control);
    }

    return control;
  }
}
