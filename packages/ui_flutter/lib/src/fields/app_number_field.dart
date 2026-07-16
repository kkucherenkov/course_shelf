import 'package:flutter/material.dart';

import 'package:app_ui/src/buttons/app_button_variant.dart';
import 'package:app_ui/src/buttons/app_icon_button.dart';
import 'package:app_ui/src/fields/app_field_box.dart';
import 'package:app_ui/src/fields/app_field_frame.dart';
import 'package:app_ui/src/fields/app_field_size.dart';
import 'package:app_ui/src/icons/icon_name.dart';
import 'package:app_ui/src/theme/app_theme.dart';
import 'package:app_ui/src/theme/tokens.g.dart';

/// The brand numeric stepper field — Flutter twin of the web `AppNumberField`
/// (`AppField` + decrement/increment `AppIconButton`s + `AppInput` composed
/// together).
///
/// `value`/`min`/`max`/`step` are [num] (not `int`/`double`) to mirror the
/// web prop's plain JS `number`, which accepts either.
class AppNumberField extends StatefulWidget {
  const AppNumberField({
    required this.label,
    required this.value,
    this.onChanged,
    this.placeholder,
    this.help,
    this.error,
    this.required = false,
    this.disabled = false,
    this.readOnly = false,
    this.size = AppFieldSize.md,
    this.min,
    this.max,
    this.step = 1,
    this.focusNode,
    this.autofocus = false,
    super.key,
  });

  final String label;

  /// `null` means "empty" (mirrors the web `modelValue: number | null`).
  final num? value;
  final ValueChanged<num?>? onChanged;
  final String? placeholder;
  final String? help;
  final String? error;
  final bool required;
  final bool disabled;
  final bool readOnly;
  final AppFieldSize size;
  final num? min;
  final num? max;
  final num step;
  final FocusNode? focusNode;

  /// Flutter-native addition; see [AppTextField.autofocus].
  final bool autofocus;

  @override
  State<AppNumberField> createState() => _AppNumberFieldState();
}

class _AppNumberFieldState extends State<AppNumberField> {
  late final TextEditingController _controller = TextEditingController(
    text: _format(widget.value),
  );
  FocusNode? _ownedFocusNode;
  FocusNode get _focusNode =>
      widget.focusNode ?? (_ownedFocusNode ??= FocusNode());

  static String _format(num? value) {
    if (value == null) return '';
    if (value == value.roundToDouble()) return value.toInt().toString();
    return value.toString();
  }

  num _clamp(num value) {
    var v = value;
    if (widget.min != null && v < widget.min!) v = widget.min!;
    if (widget.max != null && v > widget.max!) v = widget.max!;
    return v;
  }

  bool get _atMin =>
      widget.value != null &&
      widget.min != null &&
      widget.value! <= widget.min!;

  bool get _atMax =>
      widget.value != null &&
      widget.max != null &&
      widget.value! >= widget.max!;

  void _decrement() {
    if (widget.disabled || widget.readOnly) return;
    final current = widget.value ?? 0;
    widget.onChanged?.call(_clamp(current - widget.step));
  }

  void _increment() {
    if (widget.disabled || widget.readOnly) return;
    final current = widget.value ?? 0;
    widget.onChanged?.call(_clamp(current + widget.step));
  }

  void _onTextChanged(String raw) {
    if (raw.isEmpty || raw == '-') {
      widget.onChanged?.call(null);
      return;
    }
    final parsed = num.tryParse(raw);
    if (parsed != null) {
      widget.onChanged?.call(_clamp(parsed));
    }
  }

  @override
  void didUpdateWidget(covariant AppNumberField oldWidget) {
    super.didUpdateWidget(oldWidget);
    final formatted = _format(widget.value);
    if (formatted != _controller.text) {
      _controller.value = _controller.value.copyWith(
        text: formatted,
        selection: TextSelection.collapsed(offset: formatted.length),
        composing: TextRange.empty,
      );
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    _ownedFocusNode?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;
    final sem = context.semanticColors;

    final textStyle = (theme.textTheme.bodyMedium ?? const TextStyle())
        .copyWith(
          fontSize: widget.size.fontSize,
          color: widget.disabled ? sem.textDisabled : cs.onSurface,
        );
    final placeholderStyle = textStyle.copyWith(
      color: widget.disabled ? sem.textDisabled : sem.textTertiary,
    );

    // Web maps size 'lg' -> stepper 'md', everything else -> stepper 'sm'.
    final stepperSize = widget.size == AppFieldSize.lg
        ? AppButtonSize.md
        : AppButtonSize.sm;

    return AppFieldFrame(
      label: widget.label,
      help: widget.help,
      error: widget.error,
      required: widget.required,
      size: widget.size,
      child: Row(
        children: <Widget>[
          AppIconButton(
            name: IconName.minus,
            semanticLabel: 'Decrement',
            variant: AppButtonVariant.ghost,
            size: stepperSize,
            disabled: widget.disabled || widget.readOnly || _atMin,
            onPressed: _decrement,
          ),
          const SizedBox(width: AppSpacing.s1),
          Expanded(
            child: AppFieldBox(
              focusNode: _focusNode,
              size: widget.size,
              enabled: !widget.disabled,
              child: TextField(
                controller: _controller,
                focusNode: _focusNode,
                enabled: !widget.disabled,
                readOnly: widget.readOnly,
                autofocus: widget.autofocus,
                keyboardType: const TextInputType.numberWithOptions(
                  decimal: true,
                  signed: true,
                ),
                style: textStyle,
                textAlignVertical: TextAlignVertical.center,
                cursorColor: cs.primary,
                decoration: InputDecoration(
                  isCollapsed: true,
                  border: InputBorder.none,
                  hintText: widget.placeholder,
                  hintStyle: placeholderStyle,
                ),
                onChanged: _onTextChanged,
              ),
            ),
          ),
          const SizedBox(width: AppSpacing.s1),
          AppIconButton(
            name: IconName.plus,
            semanticLabel: 'Increment',
            variant: AppButtonVariant.ghost,
            size: stepperSize,
            disabled: widget.disabled || widget.readOnly || _atMax,
            onPressed: _increment,
          ),
        ],
      ),
    );
  }
}
