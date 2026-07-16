import 'dart:ui' show SemanticsRole;

import 'package:flutter/material.dart';

import 'package:app_ui/src/fields/app_radio.dart';
import 'package:app_ui/src/theme/tokens.g.dart';

/// A single selectable option inside an [AppRadioGroup].
///
/// The web `AppRadio` only exposes `value` / `label` / `disabled` — see
/// `packages/ui/src/components/AppRadio/AppRadio.vue`. [description] is a
/// mobile-only addition: this card's scope asks for a self-contained option
/// model ("each with label + optional description"), since a Flutter screen
/// composes entirely through this one widget rather than hand-building extra
/// copy next to a bare `<AppRadio>` the way a web page can. Purely additive —
/// omitting it reproduces the web's plain label-only option exactly.
class AppRadioGroupOption<T> {
  const AppRadioGroupOption({
    required this.value,
    required this.label,
    this.description,
    this.disabled = false,
  });

  final T value;
  final String label;
  final String? description;
  final bool disabled;
}

/// A labelled, single-selection group of radio options — Flutter twin of the
/// web `AppRadioGroup`
/// (`packages/ui/src/components/AppRadioGroup/AppRadioGroup.vue`).
///
/// Composes [AppRadio] verbatim for every option's selection circle — this
/// widget only owns the legend, per-option label/description layout, vertical
/// stacking, and the controlled `value` / `onChanged<T>` contract (the same
/// controlled shape [AppRadio] and `AppCheckbox` already use; selection state
/// lives entirely with the caller, not this widget).
///
/// ## Web parity
/// - `role="radiogroup"` + `aria-label` -> `Semantics(role:
///   SemanticsRole.radioGroup, label: ...)`, mirroring the framework's own
///   built-in `RadioGroup` widget, which sets up the same role for the same
///   W3C APG radiogroup pattern.
/// - group `disabled` disables every option regardless of its own `disabled`
///   -- matches `AppRadio.vue`'s
///   `isDisabled = computed(() => props.disabled || ctx.disabled.value)`.
/// - `gap: var(--space-2)` between options (`AppRadioGroup.vue`'s
///   `.app-radio-group` flex gap) -> [AppSpacing.s2] between every option row.
/// - Selecting an already-selected option still calls `onChanged` — the web
///   `AppRadio.vue`'s `select()` always calls `ctx.setValue(props.value)`
///   with no "already checked" guard, and the base [AppRadio] atom mirrors
///   that (`_select()` never checks `_checked`). This widget stays consistent
///   with both rather than silently suppressing the call.
///
/// ## Deviation: visible legend
/// The web component renders **no** visible legend — `label` only ever wires
/// to `aria-label` (see `AppRadioGroup.vue`'s template); real usage
/// (`apps/web/app/pages/dev/foundations.vue`) relies on the *caller* placing
/// its own heading above the group instead. Flutter call sites have no
/// equivalent "the page already has a heading" convention, so this twin also
/// renders `label` as a visible legend `Text` above the options while still
/// wiring it as the group's accessible name — a superset of the web behaviour
/// (same accessible name, plus the visible affordance callers would otherwise
/// have to hand-build every time).
///
/// ## Deviation: no horizontal orientation
/// The web only ever lays out vertically (`flex-direction: column`, no prop
/// to change it) — this twin matches 1:1 and does not expose an orientation
/// option.
class AppRadioGroup<T> extends StatelessWidget {
  const AppRadioGroup({
    required this.label,
    required this.options,
    required this.value,
    this.onChanged,
    this.disabled = false,
    super.key,
  });

  /// The group's legend, rendered visibly and wired as the accessible name of
  /// the `radiogroup` semantics node (see class doc "Deviation: visible
  /// legend").
  final String label;

  /// The options rendered as a vertical list, in order.
  final List<AppRadioGroupOption<T>> options;

  /// The currently-selected value. Exactly the option whose
  /// [AppRadioGroupOption.value] equals this is rendered checked.
  final T value;

  /// Called with an option's value when it is selected. `null` renders every
  /// option non-interactive, same as leaving `onChanged` unset on [AppRadio].
  final ValueChanged<T>? onChanged;

  /// Disables every option regardless of its own
  /// [AppRadioGroupOption.disabled].
  final bool disabled;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;

    final legendStyle = (theme.textTheme.labelLarge ?? const TextStyle())
        .copyWith(
          fontSize: AppFontSize.sm,
          fontWeight: AppFontWeight.medium,
          color: cs.onSurface,
        );

    final List<Widget> children = <Widget>[
      Text(label, style: legendStyle),
      const SizedBox(height: AppSpacing.s2),
    ];

    for (var i = 0; i < options.length; i++) {
      if (i > 0) children.add(const SizedBox(height: AppSpacing.s2));
      children.add(
        _AppRadioGroupOptionRow<T>(
          option: options[i],
          groupValue: value,
          groupDisabled: disabled,
          onChanged: onChanged,
        ),
      );
    }

    return Semantics(
      container: true,
      role: SemanticsRole.radioGroup,
      label: label,
      enabled: !disabled,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: children,
      ),
    );
  }
}

class _AppRadioGroupOptionRow<T> extends StatelessWidget {
  const _AppRadioGroupOptionRow({
    required this.option,
    required this.groupValue,
    required this.groupDisabled,
    required this.onChanged,
    super.key,
  });

  final AppRadioGroupOption<T> option;
  final T groupValue;
  final bool groupDisabled;
  final ValueChanged<T>? onChanged;

  bool get _disabled => groupDisabled || option.disabled;
  bool get _checked => groupValue == option.value;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;

    final labelStyle = (theme.textTheme.bodyMedium ?? const TextStyle())
        .copyWith(fontSize: AppFontSize.sm, color: cs.onSurface);
    final descriptionStyle = (theme.textTheme.bodySmall ?? const TextStyle())
        .copyWith(fontSize: AppFontSize.xs, color: cs.onSurfaceVariant);

    final Widget content = Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: <Widget>[
        // AppRadio renders the shared circle/dot visuals verbatim. Its own
        // pointer handling and semantics are switched off here — the row
        // below is the single tap target and the single semantics node for
        // the whole option (label + description), avoiding a double
        // dispatch when both this row's GestureDetector and AppRadio's own
        // would otherwise compete over taps landing on the circle. Its
        // keyboard handling (Space/Enter while focused) is untouched:
        // IgnorePointer only affects hit-testing, not focus/key events, so
        // `onChanged` still needs to reach it.
        ExcludeSemantics(
          child: IgnorePointer(
            child: AppRadio<T>(
              value: option.value,
              groupValue: groupValue,
              onChanged: onChanged,
              disabled: _disabled,
            ),
          ),
        ),
        const SizedBox(width: AppSpacing.s2),
        Flexible(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: <Widget>[
              Text(option.label, style: labelStyle),
              if (option.description != null) ...<Widget>[
                const SizedBox(height: AppSpacing.s1),
                Text(option.description!, style: descriptionStyle),
              ],
            ],
          ),
        ),
      ],
    );

    Widget control = GestureDetector(
      onTap: _disabled ? null : () => onChanged?.call(option.value),
      child: MouseRegion(
        cursor: _disabled
            ? SystemMouseCursors.forbidden
            : SystemMouseCursors.click,
        child: content,
      ),
    );

    control = Semantics(
      inMutuallyExclusiveGroup: true,
      checked: _checked,
      enabled: !_disabled,
      label: option.label,
      hint: option.description,
      child: ExcludeSemantics(child: control),
    );

    if (_disabled) {
      control = Opacity(opacity: AppOpacity.disabled, child: control);
    }

    return control;
  }
}
