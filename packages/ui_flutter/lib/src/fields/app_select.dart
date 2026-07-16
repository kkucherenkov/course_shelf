import 'package:flutter/material.dart';

import 'package:app_ui/src/fields/app_field_size.dart';
import 'package:app_ui/src/icons/icon_cs.dart';
import 'package:app_ui/src/icons/icon_name.dart';
import 'package:app_ui/src/theme/app_theme.dart';
import 'package:app_ui/src/theme/tokens.g.dart';

/// A single choice rendered inside the dropdown — Flutter twin of the web
/// `AppSelectOption` interface.
class AppSelectOption {
  const AppSelectOption({
    required this.id,
    required this.label,
    this.disabled = false,
  });

  final String id;
  final String label;
  final bool disabled;
}

/// The brand dropdown primitive — Flutter twin of the web `AppSelect`.
///
/// Deliberately a bare control with no `label`/`help`/`error` of its own,
/// matching the web source: `AppSelect.vue` wraps a native `<select>` and
/// composes with `AppField` from the *outside* rather than embedding it
/// (unlike `AppTextField`/`AppNumberField`/`AppSearchField`, which each embed
/// `AppField` themselves). Porting `AppField` is out of scope for this card,
/// so this stays equally bare — wrap it in your own label/`Column` as needed.
///
/// [invalid] is not a literal prop on the web component either: there,
/// the red border comes from an `aria-invalid` attribute forwarded through
/// `$attrs` by whatever `AppField` wraps it. Exposed directly here so a
/// Flutter consumer wiring its own error text can still get the same
/// affordance without needing that indirection.
class AppSelect extends StatefulWidget {
  const AppSelect({
    required this.options,
    this.value,
    this.onChanged,
    this.placeholder,
    this.size = AppFieldSize.md,
    this.disabled = false,
    this.invalid = false,
    this.focusNode,
    this.autofocus = false,
    super.key,
  });

  final List<AppSelectOption> options;

  /// Id of the currently selected option. `null` means "no selection"
  /// (placeholder shown), mirroring the web `modelValue: string | null`.
  final String? value;
  final ValueChanged<String>? onChanged;
  final String? placeholder;
  final AppFieldSize size;
  final bool disabled;
  final bool invalid;
  final FocusNode? focusNode;

  /// Flutter-native addition; see [AppTextField.autofocus].
  final bool autofocus;

  @override
  State<AppSelect> createState() => _AppSelectState();
}

class _AppSelectState extends State<AppSelect> {
  FocusNode? _ownedFocusNode;
  FocusNode get _focusNode =>
      widget.focusNode ?? (_ownedFocusNode ??= FocusNode());

  @override
  void initState() {
    super.initState();
    _focusNode.addListener(_onFocusChange);
  }

  @override
  void didUpdateWidget(covariant AppSelect oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.focusNode != widget.focusNode) {
      (oldWidget.focusNode ?? _ownedFocusNode)?.removeListener(_onFocusChange);
      _focusNode.addListener(_onFocusChange);
    }
  }

  @override
  void dispose() {
    _focusNode.removeListener(_onFocusChange);
    _ownedFocusNode?.dispose();
    super.dispose();
  }

  void _onFocusChange() => setState(() {});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;
    final sem = context.semanticColors;
    final focused = _focusNode.hasFocus;

    final textStyle = (theme.textTheme.bodyMedium ?? const TextStyle())
        .copyWith(
          fontSize: widget.size.fontSize,
          color: widget.disabled ? sem.textDisabled : cs.onSurface,
        );

    // Precedence mirrors the web CSS cascade (`&[aria-invalid]` is declared
    // after `&:focus-visible` at equal specificity, so invalid wins over
    // focus when both apply).
    final Color borderColor = widget.invalid
        ? cs.error
        : (focused ? cs.primary : cs.outline);

    final bool hasSelection = widget.options.any(
      (option) => option.id == widget.value,
    );

    final items = <DropdownMenuItem<String>>[
      for (final option in widget.options)
        DropdownMenuItem<String>(
          value: option.id,
          enabled: !option.disabled,
          child: Text(
            option.label,
            style: option.disabled
                ? textStyle.copyWith(color: sem.textDisabled)
                : textStyle,
          ),
        ),
    ];

    return AnimatedContainer(
      duration: AppDuration.fast,
      curve: AppEasing.easeDefault,
      height: widget.size.height,
      padding: EdgeInsets.symmetric(horizontal: widget.size.horizontalPadding),
      decoration: BoxDecoration(
        color: widget.disabled ? sem.raised : cs.surface,
        borderRadius: BorderRadius.circular(AppRadius.md),
        border: Border.all(color: borderColor),
        boxShadow: focused ? context.shadows.focus : null,
      ),
      alignment: Alignment.centerLeft,
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: hasSelection ? widget.value : null,
          items: items,
          hint: widget.placeholder != null
              ? Text(
                  widget.placeholder!,
                  style: textStyle.copyWith(color: sem.textTertiary),
                )
              : null,
          onChanged: widget.disabled
              ? null
              : (next) {
                  if (next != null) widget.onChanged?.call(next);
                },
          isExpanded: true,
          isDense: true,
          itemHeight: null,
          focusNode: _focusNode,
          autofocus: widget.autofocus,
          style: textStyle,
          dropdownColor: cs.surface,
          borderRadius: BorderRadius.circular(AppRadius.md),
          icon: Padding(
            padding: const EdgeInsets.only(left: AppSpacing.s2),
            child: IconCS(
              name: IconName.chevronDown,
              size: 12,
              color: cs.onSurfaceVariant,
            ),
          ),
        ),
      ),
    );
  }
}
