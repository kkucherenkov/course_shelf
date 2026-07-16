import 'package:flutter/material.dart';

import 'package:app_ui/src/buttons/app_button_variant.dart';
import 'package:app_ui/src/buttons/app_icon_button.dart';
import 'package:app_ui/src/fields/app_field_box.dart';
import 'package:app_ui/src/fields/app_field_frame.dart';
import 'package:app_ui/src/fields/app_field_size.dart';
import 'package:app_ui/src/icons/icon_cs.dart';
import 'package:app_ui/src/icons/icon_name.dart';
import 'package:app_ui/src/theme/app_theme.dart';
import 'package:app_ui/src/theme/tokens.g.dart';

/// The brand search field — Flutter twin of the web `AppSearchField`
/// (`AppField` + a leading search glyph + `AppInput` + a trailing clear
/// button, shown only once there is a value, composed together).
///
/// The web twin absolutely-positions its leading icon and trailing clear
/// button over a single native `<input>`. Flutter has no equivalent to a
/// styleable native input decorated with overlaid siblings without fighting
/// the framework, so this lays the icon / field / clear button out in a
/// `Row` inside the shared [AppFieldBox] instead — visually equivalent
/// (icon, gap, text, clear button, all inset by the box's standard padding)
/// without depending on absolute positioning.
class AppSearchField extends StatefulWidget {
  const AppSearchField({
    required this.label,
    required this.value,
    this.onChanged,
    this.placeholder,
    this.help,
    this.error,
    this.required = false,
    this.disabled = false,
    this.size = AppFieldSize.md,
    this.clearLabel = 'Clear',
    this.focusNode,
    this.autofocus = false,
    super.key,
  });

  final String label;
  final String value;
  final ValueChanged<String>? onChanged;
  final String? placeholder;
  final String? help;
  final String? error;
  final bool required;
  final bool disabled;
  final AppFieldSize size;

  /// Accessible label for the clear button. Defaults to "Clear", matching web.
  final String clearLabel;
  final FocusNode? focusNode;

  /// Flutter-native addition; see [AppTextField.autofocus].
  final bool autofocus;

  @override
  State<AppSearchField> createState() => _AppSearchFieldState();
}

class _AppSearchFieldState extends State<AppSearchField> {
  late final TextEditingController _controller = TextEditingController(
    text: widget.value,
  );
  FocusNode? _ownedFocusNode;
  FocusNode get _focusNode =>
      widget.focusNode ?? (_ownedFocusNode ??= FocusNode());

  @override
  void didUpdateWidget(covariant AppSearchField oldWidget) {
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

  void _clear() => widget.onChanged?.call('');

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

    // Web computes iconSize from field size: sm=14, md=16, lg=20.
    final double iconSize = switch (widget.size) {
      AppFieldSize.sm => 14,
      AppFieldSize.md => 16,
      AppFieldSize.lg => 20,
    };
    // Web maps size 'lg' -> clear-button 'md', everything else -> 'sm'.
    final clearButtonSize = widget.size == AppFieldSize.lg
        ? AppButtonSize.md
        : AppButtonSize.sm;
    final bool hasValue = widget.value.isNotEmpty;

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
        child: Row(
          children: <Widget>[
            IconCS(
              name: IconName.search,
              size: iconSize,
              color: cs.onSurfaceVariant,
            ),
            const SizedBox(width: AppSpacing.s2),
            Expanded(
              child: TextField(
                controller: _controller,
                focusNode: _focusNode,
                enabled: !widget.disabled,
                autofocus: widget.autofocus,
                keyboardType: TextInputType.text,
                textInputAction: TextInputAction.search,
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
              ),
            ),
            if (hasValue) ...<Widget>[
              const SizedBox(width: AppSpacing.s1),
              AppIconButton(
                name: IconName.x,
                semanticLabel: widget.clearLabel,
                variant: AppButtonVariant.ghost,
                size: clearButtonSize,
                disabled: widget.disabled,
                onPressed: _clear,
              ),
            ],
          ],
        ),
      ),
    );
  }
}
