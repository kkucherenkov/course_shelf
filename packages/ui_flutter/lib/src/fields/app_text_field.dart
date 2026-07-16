import 'package:flutter/material.dart';

import 'package:app_ui/src/fields/app_field_box.dart';
import 'package:app_ui/src/fields/app_field_frame.dart';
import 'package:app_ui/src/fields/app_field_size.dart';
import 'package:app_ui/src/theme/app_theme.dart';

/// The single-line text input types the web `AppTextField` exposes (its prop
/// surface is narrower than the underlying `AppInput`'s — number/date types
/// go through the dedicated [AppNumberField] instead).
enum AppTextFieldType { text, email, password, tel, url }

TextInputType _keyboardTypeFor(AppTextFieldType type) => switch (type) {
  AppTextFieldType.text || AppTextFieldType.password => TextInputType.text,
  AppTextFieldType.email => TextInputType.emailAddress,
  AppTextFieldType.tel => TextInputType.phone,
  AppTextFieldType.url => TextInputType.url,
};

/// The brand single-line text field — Flutter twin of the web `AppTextField`
/// (itself `AppField` + `AppInput` composed together).
///
/// `autocomplete`/`inputmode` (raw HTML attribute passthroughs on the web
/// prop surface) are not ported: Flutter's [TextField] already derives the
/// analogous behaviour from [type] via `keyboardType`/`obscureText`, so there
/// is nothing left for a string attribute to add.
class AppTextField extends StatefulWidget {
  const AppTextField({
    required this.label,
    required this.value,
    this.onChanged,
    this.onSubmitted,
    this.type = AppTextFieldType.text,
    this.placeholder,
    this.help,
    this.error,
    this.required = false,
    this.disabled = false,
    this.readOnly = false,
    this.size = AppFieldSize.md,
    this.focusNode,
    this.autofocus = false,
    super.key,
  });

  final String label;
  final String value;
  final ValueChanged<String>? onChanged;
  final ValueChanged<String>? onSubmitted;
  final AppTextFieldType type;
  final String? placeholder;
  final String? help;
  final String? error;
  final bool required;
  final bool disabled;
  final bool readOnly;
  final AppFieldSize size;
  final FocusNode? focusNode;

  /// Not a web prop — a Flutter-native addition so a consumer (or this
  /// package's own goldens/Widgetbook) can demonstrate the focus-visible
  /// state without having to own a [FocusNode] just to call `.requestFocus()`.
  final bool autofocus;

  @override
  State<AppTextField> createState() => _AppTextFieldState();
}

class _AppTextFieldState extends State<AppTextField> {
  late final TextEditingController _controller = TextEditingController(
    text: widget.value,
  );
  FocusNode? _ownedFocusNode;
  FocusNode get _focusNode =>
      widget.focusNode ?? (_ownedFocusNode ??= FocusNode());

  @override
  void didUpdateWidget(covariant AppTextField oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.value != _controller.text) {
      _controller.value = _controller.value.copyWith(
        text: widget.value,
        selection: TextSelection.collapsed(offset: widget.value.length),
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

    return AppFieldFrame(
      label: widget.label,
      help: widget.help,
      error: widget.error,
      required: widget.required,
      size: widget.size,
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
          obscureText: widget.type == AppTextFieldType.password,
          keyboardType: _keyboardTypeFor(widget.type),
          style: textStyle,
          textAlignVertical: TextAlignVertical.center,
          cursorColor: cs.primary,
          decoration: InputDecoration(
            isCollapsed: true,
            border: InputBorder.none,
            hintText: widget.placeholder,
            hintStyle: placeholderStyle,
          ),
          onChanged: widget.onChanged,
          onSubmitted: widget.onSubmitted,
        ),
      ),
    );
  }
}
