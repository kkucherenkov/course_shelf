import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'package:app_ui/src/theme/tokens.g.dart';

/// A single radio option — Flutter twin of the web `AppRadio`.
///
/// The web component must live inside an `AppRadioGroup` (via Vue
/// provide/inject) to know the shared selection and emit changes into it.
/// `AppRadioGroup` is out of scope for this card, so this port is
/// self-contained instead, following Flutter's own [Radio] convention:
/// [value] / [groupValue] / [onChanged]. A caller renders one [AppRadio] per
/// option and drives `groupValue` from its own state — the same shape
/// `AppRadioGroup` would have supplied, just owned by the consumer rather
/// than an inherited-context widget.
class AppRadio<T> extends StatefulWidget {
  const AppRadio({
    required this.value,
    required this.groupValue,
    this.onChanged,
    this.label,
    this.disabled = false,
    this.focusNode,
    this.autofocus = false,
    super.key,
  });

  final T value;
  final T? groupValue;
  final ValueChanged<T>? onChanged;
  final String? label;
  final bool disabled;
  final FocusNode? focusNode;
  final bool autofocus;

  static const double _circleSize = 18;
  static const double _dotSize = 8;
  static const double _focusRingWidth = 2;

  @override
  State<AppRadio<T>> createState() => _AppRadioState<T>();
}

class _AppRadioState<T> extends State<AppRadio<T>> {
  FocusNode? _ownedFocusNode;
  FocusNode get _focusNode =>
      widget.focusNode ?? (_ownedFocusNode ??= FocusNode());

  bool get _checked => widget.groupValue == widget.value;

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

  void _select() {
    if (widget.disabled) return;
    widget.onChanged?.call(widget.value);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;
    final focused = _focusNode.hasFocus;
    final checked = _checked;

    final Widget circle = DecoratedBox(
      decoration: BoxDecoration(
        color: cs.surface,
        shape: BoxShape.circle,
        border: Border.all(
          color: checked ? cs.primary : cs.outlineVariant,
          width: 1.5,
        ),
      ),
      child: SizedBox(
        width: AppRadio._circleSize,
        height: AppRadio._circleSize,
        child: checked
            ? Center(
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    color: cs.primary,
                    shape: BoxShape.circle,
                  ),
                  child: const SizedBox(
                    width: AppRadio._dotSize,
                    height: AppRadio._dotSize,
                  ),
                ),
              )
            : null,
      ),
    );

    // Same fixed-footprint focus-ring approach as AppCheckbox; see its doc
    // comment.
    final Widget ring = AnimatedContainer(
      duration: AppDuration.fast,
      curve: AppEasing.easeDefault,
      padding: const EdgeInsets.all(AppRadio._focusRingWidth),
      decoration: BoxDecoration(
        border: Border.all(
          color: focused ? cs.primary : Colors.transparent,
          width: AppRadio._focusRingWidth,
        ),
        shape: BoxShape.circle,
      ),
      child: circle,
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
        if (isActivation) _select();
        return KeyEventResult.handled;
      },
      child: GestureDetector(
        onTap: widget.disabled ? null : _select,
        child: MouseRegion(
          cursor: widget.disabled
              ? SystemMouseCursors.forbidden
              : SystemMouseCursors.click,
          child: Row(mainAxisSize: MainAxisSize.min, children: children),
        ),
      ),
    );

    control = Semantics(
      inMutuallyExclusiveGroup: true,
      checked: checked,
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
