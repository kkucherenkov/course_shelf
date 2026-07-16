import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'package:app_ui/src/icons/icon_cs.dart';
import 'package:app_ui/src/icons/icon_name.dart';
import 'package:app_ui/src/theme/tokens.g.dart';

/// The brand checkbox — Flutter twin of the web `AppCheckbox`.
///
/// The tick/dash glyphs reuse [IconCS]'s shared `check`/`minus` glyphs rather
/// than the web's bespoke inline SVG paths — same brand iconography, one
/// fewer hand-drawn path to keep in sync.
class AppCheckbox extends StatefulWidget {
  const AppCheckbox({
    required this.value,
    this.onChanged,
    this.label,
    this.indeterminate = false,
    this.disabled = false,
    this.required = false,
    this.focusNode,
    this.autofocus = false,
    super.key,
  });

  final bool value;
  final ValueChanged<bool>? onChanged;
  final String? label;
  final bool indeterminate;
  final bool disabled;
  final bool required;
  final FocusNode? focusNode;
  final bool autofocus;

  static const double _boxSize = 18;
  static const double _glyphSize = 12;
  static const double _focusRingWidth = 2;

  @override
  State<AppCheckbox> createState() => _AppCheckboxState();
}

class _AppCheckboxState extends State<AppCheckbox> {
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
    // From indeterminate -> true, consistent with native HTML behaviour.
    widget.onChanged?.call(!widget.value);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;
    final focused = _focusNode.hasFocus;

    final bool filled = widget.value || widget.indeterminate;

    final Widget box = DecoratedBox(
      decoration: BoxDecoration(
        color: filled ? cs.primary : cs.surface,
        border: Border.all(
          color: filled ? cs.primary : cs.outlineVariant,
          width: 1.5,
        ),
        borderRadius: BorderRadius.circular(AppRadius.sm),
      ),
      child: SizedBox(
        width: AppCheckbox._boxSize,
        height: AppCheckbox._boxSize,
        child: widget.indeterminate
            ? Center(
                child: IconCS(
                  name: IconName.minus,
                  size: AppCheckbox._glyphSize,
                  color: cs.onPrimary,
                ),
              )
            : widget.value
            ? Center(
                child: IconCS(
                  name: IconName.check,
                  size: AppCheckbox._glyphSize,
                  color: cs.onPrimary,
                ),
              )
            : null,
      ),
    );

    // Web draws `outline: 2px solid; outline-offset: 2px` on focus-visible —
    // replicate with a fixed-size padded border so toggling focus doesn't
    // shift layout (transparent border occupies the same footprint as the
    // visible one).
    final Widget ring = AnimatedContainer(
      duration: AppDuration.fast,
      curve: AppEasing.easeDefault,
      padding: const EdgeInsets.all(AppCheckbox._focusRingWidth),
      decoration: BoxDecoration(
        border: Border.all(
          color: focused ? cs.primary : Colors.transparent,
          width: AppCheckbox._focusRingWidth,
        ),
        borderRadius: BorderRadius.circular(
          AppRadius.sm + AppCheckbox._focusRingWidth,
        ),
      ),
      child: box,
    );

    final List<Widget> children = <Widget>[
      ring,
      if (widget.label != null) ...<Widget>[
        const SizedBox(width: AppSpacing.s2),
        Text(
          widget.label!,
          style: (theme.textTheme.bodyMedium ?? const TextStyle()).copyWith(
            fontSize: AppFontSize.sm,
            color: cs.onSurface,
          ),
        ),
      ],
    ];

    Widget control = Focus(
      focusNode: _focusNode,
      autofocus: widget.autofocus,
      onKeyEvent: (node, event) {
        final isActivation =
            event is KeyDownEvent &&
            (event.logicalKey == LogicalKeyboardKey.space ||
                event.logicalKey == LogicalKeyboardKey.enter);
        if (isActivation) _toggle();
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
      checked: widget.value,
      mixed: widget.indeterminate,
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
