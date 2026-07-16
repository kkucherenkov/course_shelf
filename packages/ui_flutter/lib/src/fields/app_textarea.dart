import 'package:flutter/material.dart';

import 'package:app_ui/src/theme/app_theme.dart';
import 'package:app_ui/src/theme/tokens.g.dart';

/// The multiline text field — Flutter twin of the web `AppTextarea`.
///
/// Unlike the web pair (a bare `<textarea>` styled by `AppTextarea.vue`,
/// composed with a label/error/help paragraph via `AppField.vue`), this
/// widget is self-contained: it owns its own error message and disabled
/// styling directly, plus an optional live character counter that the web
/// twin does not have (mobile has no separate field-wrapper component yet,
/// so the affordance is folded in here — see the class doc below for the
/// full list of intentional deviations).
///
/// Built on Material's [TextField] rather than a bespoke render, styled
/// entirely from [ColorScheme] / [AppSemanticColors] / the token classes in
/// `tokens.g.dart`.
///
/// Deviations from the web `AppTextarea.vue` (documented, not oversights):
///  - **No `size` prop.** The web `sm`/`md`/`lg` scale is out of this card's
///    scope (rows, placeholder, value/onChanged, error, disabled, counter).
///    Metrics below match the web `md` variant: `--space-4` padding,
///    `--text-sm` (12px) font-size.
///  - **No `autoGrow`/`maxRows`/`resize`.** The web JS auto-grow polyfill and
///    mouse-drag resize handles have no mobile equivalent within this card's
///    scope; `rows` maps to a fixed `minLines == maxLines` (native
///    `TextField` still scrolls internally past that, matching a plain
///    `<textarea rows="n">` with no auto-grow).
///  - **Visible error border.** The web `AppTextarea.vue` itself never
///    changes colour for an error — only `AppField.vue`'s paragraph turns
///    red below it. Because this widget doesn't split into a separate field
///    wrapper, [error] additionally tints the field's border with
///    `colorScheme.error` so the state reads without a sibling label
///    component.
///  - **Disabled fill colour.** The web CSS references
///    `--surface-bg-muted`, a token that is not actually emitted by
///    `design:build` (`docs/design/shared/tokens.json` → generated CSS has
///    no such variable — same class of gap `AppField.vue` already flags for
///    `--status-danger`). The closest real, generated token is
///    `semanticColors.raised` (`--surface-raised`), used elsewhere in this
///    package as the "elevated/muted" surface (see
///    `resolveAppButtonStyle`'s secondary variant) — used here instead.
///  - **Character counter.** Not present on the web twin at all; added
///    per this card's scope as an optional live `count/maxLength` readout,
///    styled with `semanticColors.textTertiary` to read as auxiliary
///    metadata, matching the muted tone the web placeholder uses.
class AppTextarea extends StatefulWidget {
  const AppTextarea({
    required this.value,
    this.onChanged,
    this.placeholder,
    this.rows = 3,
    this.disabled = false,
    this.error,
    this.maxLength,
    this.focusNode,
    super.key,
  }) : assert(rows > 0, 'rows must be positive');

  /// The controlled text content (mirrors the web `modelValue`).
  final String value;

  /// Fired with the new text on every edit (mirrors `update:modelValue`).
  final ValueChanged<String>? onChanged;

  /// Hint text shown when [value] is empty.
  final String? placeholder;

  /// Fixed visible line count. Defaults to 3, matching the web default.
  final int rows;

  /// Disables editing and applies the muted/disabled styling.
  final bool disabled;

  /// When non-null, renders below the field in the error colour and tints
  /// the field's border with `colorScheme.error`.
  final String? error;

  /// When set, enforces a hard character cap and renders a live
  /// `count/maxLength` counter below the field.
  final int? maxLength;

  final FocusNode? focusNode;

  @override
  State<AppTextarea> createState() => _AppTextareaState();
}

class _AppTextareaState extends State<AppTextarea> {
  late final TextEditingController _controller;

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController(text: widget.value);
    if (widget.maxLength != null) {
      _controller.addListener(_handleCounterChange);
    }
  }

  @override
  void didUpdateWidget(covariant AppTextarea oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.value != _controller.text) {
      _controller.value = _controller.value.copyWith(
        text: widget.value,
        selection: TextSelection.collapsed(offset: widget.value.length),
        composing: TextRange.empty,
      );
    }
  }

  void _handleCounterChange() {
    if (mounted) setState(() {});
  }

  @override
  void dispose() {
    if (widget.maxLength != null) {
      _controller.removeListener(_handleCounterChange);
    }
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;
    final sem = context.semanticColors;
    final hasError = widget.error != null;
    final hasCounter = widget.maxLength != null;

    // Bind off the theme's bodyMedium (which carries the packaged sans
    // family) and override only size/colour from tokens — never the bare
    // AppTextStyles, which degrades to the platform font in consuming apps.
    final textStyle = (theme.textTheme.bodyMedium ?? const TextStyle())
        .copyWith(
          fontSize: AppFontSize.sm,
          color: widget.disabled ? sem.textDisabled : cs.onSurface,
        );
    final placeholderStyle = (theme.textTheme.bodyMedium ?? const TextStyle())
        .copyWith(fontSize: AppFontSize.sm, color: sem.textTertiary);
    final errorStyle = (theme.textTheme.bodySmall ?? const TextStyle())
        .copyWith(
          fontSize: AppFontSize.xs,
          fontWeight: AppFontWeight.medium,
          color: cs.error,
        );
    final counterStyle = (theme.textTheme.bodySmall ?? const TextStyle())
        .copyWith(fontSize: AppFontSize.xs, color: sem.textTertiary);

    OutlineInputBorder borderWith(Color color) => OutlineInputBorder(
      borderRadius: BorderRadius.circular(AppRadius.md),
      borderSide: BorderSide(color: color),
    );

    final Color enabledBorderColor = hasError ? cs.error : cs.outline;
    final Color focusedBorderColor = hasError ? cs.error : sem.borderFocus;

    final Widget field = TextField(
      controller: _controller,
      focusNode: widget.focusNode,
      enabled: !widget.disabled,
      minLines: widget.rows,
      maxLines: widget.rows,
      keyboardType: TextInputType.multiline,
      textInputAction: TextInputAction.newline,
      maxLength: widget.maxLength,
      style: textStyle,
      cursorColor: cs.primary,
      onChanged: widget.onChanged,
      decoration: InputDecoration(
        isDense: true,
        filled: true,
        fillColor: widget.disabled ? sem.raised : cs.surface,
        hintText: widget.placeholder,
        hintStyle: placeholderStyle,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.s4,
          vertical: AppSpacing.s4,
        ),
        counterText: '',
        border: borderWith(enabledBorderColor),
        enabledBorder: borderWith(enabledBorderColor),
        focusedBorder: borderWith(focusedBorderColor),
        disabledBorder: borderWith(enabledBorderColor),
      ),
    );

    if (!hasError && !hasCounter) {
      return field;
    }

    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: <Widget>[
        field,
        Padding(
          padding: const EdgeInsets.only(top: AppSpacing.s2),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Expanded(
                child: hasError
                    ? Semantics(
                        liveRegion: true,
                        child: Text(widget.error!, style: errorStyle),
                      )
                    : const SizedBox.shrink(),
              ),
              if (hasCounter)
                Text(
                  '${_controller.text.length}/${widget.maxLength}',
                  style: counterStyle,
                ),
            ],
          ),
        ),
      ],
    );
  }
}
