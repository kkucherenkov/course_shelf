import 'package:flutter/material.dart';

import 'package:app_ui/src/buttons/app_button_variant.dart';
import 'package:app_ui/src/buttons/app_icon_button.dart';
import 'package:app_ui/src/fields/app_field_box.dart';
import 'package:app_ui/src/fields/app_field_frame.dart';
import 'package:app_ui/src/fields/app_field_size.dart';
import 'package:app_ui/src/fields/app_password_strength.dart';
import 'package:app_ui/src/icons/icon_cs.dart';
import 'package:app_ui/src/icons/icon_name.dart';
import 'package:app_ui/src/theme/app_theme.dart';
import 'package:app_ui/src/theme/tokens.g.dart';

/// The web prop is a raw HTML `autocomplete` attribute value
/// (`'current-password' | 'new-password'`); Flutter's analogous, and
/// actually load-bearing (password-manager autofill), concept is
/// `TextField.autofillHints`.
enum AppPasswordAutoComplete {
  currentPassword,
  newPassword;

  List<String> get autofillHints => switch (this) {
    AppPasswordAutoComplete.currentPassword => const <String>[
      AutofillHints.password,
    ],
    AppPasswordAutoComplete.newPassword => const <String>[
      AutofillHints.newPassword,
    ],
  };
}

/// The brand password field — Flutter twin of the web `AppPasswordField`
/// (`AppLabel` + a leading lock glyph + native input + a visibility-toggle
/// `AppIconButton`, with an optional strength meter, composed together).
///
/// Unlike `AppTextField`/`AppNumberField`/`AppSearchField`, the web twin
/// exposes no `size` prop (its control is hard-coded to the `md` field
/// height) — this Flutter twin mirrors that narrower surface rather than
/// adding one back in.
class AppPasswordField extends StatefulWidget {
  const AppPasswordField({
    required this.value,
    this.onChanged,
    this.label = 'Password',
    this.withMeter = false,
    this.autoComplete = AppPasswordAutoComplete.currentPassword,
    this.help,
    this.error,
    this.disabled = false,
    this.required = false,
    this.placeholder = '••••••••••',
    this.showLabel = 'Show password',
    this.hideLabel = 'Hide password',
    this.focusNode,
    this.autofocus = false,
    this.initiallyVisible = false,
    super.key,
  });

  final String value;
  final ValueChanged<String>? onChanged;
  final String label;

  /// Shows the 3-segment strength meter below the control, matching the
  /// web `withMeter` prop.
  final bool withMeter;
  final AppPasswordAutoComplete autoComplete;
  final String? help;
  final String? error;
  final bool disabled;
  final bool required;
  final String? placeholder;

  /// aria-label equivalent for the visibility toggle when the password is
  /// hidden.
  final String showLabel;

  /// aria-label equivalent for the visibility toggle when the password is
  /// shown.
  final String hideLabel;
  final FocusNode? focusNode;

  /// Flutter-native addition; see `AppTextField.autofocus`.
  final bool autofocus;

  /// Flutter-native addition — seeds the initially-revealed state without
  /// requiring a simulated toggle tap, so goldens/Widgetbook can show the
  /// "revealed" visual without owning interaction state themselves.
  final bool initiallyVisible;

  @override
  State<AppPasswordField> createState() => _AppPasswordFieldState();
}

class _AppPasswordFieldState extends State<AppPasswordField> {
  late final TextEditingController _controller = TextEditingController(
    text: widget.value,
  );
  FocusNode? _ownedFocusNode;
  FocusNode get _focusNode =>
      widget.focusNode ?? (_ownedFocusNode ??= FocusNode());

  late bool _visible = widget.initiallyVisible;

  @override
  void didUpdateWidget(covariant AppPasswordField oldWidget) {
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

  void _toggleVisibility() {
    if (widget.disabled) return;
    setState(() => _visible = !_visible);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;
    final sem = context.semanticColors;
    const AppFieldSize size = AppFieldSize.md;

    final textStyle = (theme.textTheme.bodyMedium ?? const TextStyle())
        .copyWith(
          fontSize: size.fontSize,
          color: widget.disabled ? sem.textDisabled : cs.onSurface,
        );
    final placeholderStyle = textStyle.copyWith(
      color: widget.disabled ? sem.textDisabled : sem.textTertiary,
    );

    final strength = AppPasswordStrength.of(widget.value);
    // Web priority is error > hint > meter caption; `AppFieldFrame` already
    // resolves `error ?? help` for its footer, and the meter caption shares
    // the exact same footer style as `help` on the web (`&__meter-label,
    // &__hint { font-size: var(--text-xs); color: var(--text-secondary); }`)
    // — so folding the caption into `help` here reuses that priority chain
    // instead of re-implementing it.
    final String? footerHelp =
        widget.help ?? (widget.withMeter ? _caption(strength) : null);

    return AppFieldFrame(
      label: widget.label,
      help: footerHelp,
      error: widget.error,
      required: widget.required,
      size: size,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: <Widget>[
          AppFieldBox(
            focusNode: _focusNode,
            size: size,
            enabled: !widget.disabled,
            child: Row(
              children: <Widget>[
                // Web: `IconCS name="lock" :size="14"` — a literal, not a
                // field-size-derived value (the web twin has no size prop).
                IconCS(
                  name: IconName.lock,
                  size: 14,
                  color: cs.onSurfaceVariant,
                ),
                const SizedBox(width: AppSpacing.s2),
                Expanded(
                  child: TextField(
                    controller: _controller,
                    focusNode: _focusNode,
                    enabled: !widget.disabled,
                    autofocus: widget.autofocus,
                    obscureText: !_visible,
                    keyboardType: TextInputType.visiblePassword,
                    autofillHints: widget.autoComplete.autofillHints,
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
                const SizedBox(width: AppSpacing.s1),
                Semantics(
                  toggled: _visible,
                  child: AppIconButton(
                    name: _visible ? IconName.eyeOff : IconName.eye,
                    semanticLabel: _visible
                        ? widget.hideLabel
                        : widget.showLabel,
                    variant: AppButtonVariant.ghost,
                    size: AppButtonSize.sm,
                    disabled: widget.disabled,
                    onPressed: _toggleVisibility,
                  ),
                ),
              ],
            ),
          ),
          if (widget.withMeter) ...<Widget>[
            const SizedBox(height: AppSpacing.s2),
            _AppPasswordStrengthMeter(strength: strength),
          ],
        ],
      ),
    );
  }

  // Web: `{{ scoreLabel }} · 12+ chars w/ a symbol = strong` — verbatim,
  // fixed copy (not prop-driven on the web twin either).
  static String _caption(AppPasswordStrength strength) =>
      '${strength.label} · 12+ chars w/ a symbol = strong';
}

/// The 3-segment strength bar — Flutter twin of the web
/// `.app-password-field__meter` / `__meter-seg` markup.
class _AppPasswordStrengthMeter extends StatelessWidget {
  const _AppPasswordStrengthMeter({required this.strength});

  final AppPasswordStrength strength;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final sem = context.semanticColors;

    // Web colours all filled segments by the overall score (not a per-index
    // gradient): score 1 -> error, score 2 -> warning, score 3 -> success.
    final Color? filledColor = switch (strength) {
      AppPasswordStrength.empty => null,
      AppPasswordStrength.weak => cs.error,
      AppPasswordStrength.okay => sem.warningFg,
      AppPasswordStrength.strong => sem.successFg,
    };
    // Web: `background: var(--surface-overlay)`, mapped onto
    // `colorScheme.surfaceContainerHighest` by `AppTheme`.
    final Color unfilledColor = cs.surfaceContainerHighest;

    return Semantics(
      // Web: `aria-hidden="true"` — the caption text (or `help`/`error`)
      // carries the accessible label, this bar is purely decorative.
      excludeSemantics: true,
      child: Row(
        children: <Widget>[
          for (int i = 1; i <= 3; i++) ...<Widget>[
            if (i > 1) const SizedBox(width: AppSpacing.s1),
            Expanded(
              child: Container(
                key: ValueKey<String>('app-password-field-meter-segment-$i'),
                // Web: `height: 4px` == AppSpacing.s1; `border-radius: 2px`
                // == AppRadius.xs — both happen to land on real tokens even
                // though the web source spells them as literals.
                height: AppSpacing.s1,
                decoration: BoxDecoration(
                  color: strength.segments >= i ? filledColor : unfilledColor,
                  borderRadius: BorderRadius.circular(AppRadius.xs),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
