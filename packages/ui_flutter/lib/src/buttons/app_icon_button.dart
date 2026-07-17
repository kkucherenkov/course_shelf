import 'package:flutter/material.dart';

import 'package:app_ui/src/buttons/app_button_style.dart';
import 'package:app_ui/src/buttons/app_button_variant.dart';
import 'package:app_ui/src/icons/icon_cs.dart';
import 'package:app_ui/src/icons/icon_name.dart';

/// A square, single-glyph button — Flutter twin of the web `AppIconButton`.
///
/// Shares [AppButton]'s palette and states; the required [semanticLabel] is
/// its accessible name (an icon-only control has no visible text).
///
/// Renders as a single semantics node that announces [semanticLabel] — never
/// the glyph — and carries the tap/focus actions assistive tech needs to
/// activate it. [disabled] and [loading] both report `enabled: false` and
/// offer no tap action.
class AppIconButton extends StatelessWidget {
  const AppIconButton({
    required this.name,
    required this.semanticLabel,
    this.variant = AppButtonVariant.primary,
    this.size = AppButtonSize.md,
    this.loading = false,
    this.disabled = false,
    this.onPressed,
    super.key,
  });

  final IconName name;

  /// Accessible name announced to assistive technology.
  final String semanticLabel;

  final AppButtonVariant variant;
  final AppButtonSize size;
  final bool loading;
  final bool disabled;
  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) {
    final style = resolveAppButtonStyle(context, variant, size, square: true);

    final Widget content = loading
        ? AppButtonSpinner(size: size)
        : IconCS(name: name, size: size.iconSize);

    // The label rides *inside* the button so it merges into the button's own
    // node, exactly as a text child does for [AppButton]. Wrapping the whole
    // TextButton in a Semantics(label:) instead would strand the label on a
    // separate parent node and leave the button node nameless.
    Widget button = TextButton(
      onPressed: disabled ? null : onPressed,
      style: style,
      // Suppress the glyph's contribution only — never the button's own
      // button/tap/enabled/focus semantics.
      child: Semantics(
        label: semanticLabel,
        excludeSemantics: true,
        child: content,
      ),
    );
    button = IgnorePointer(ignoring: loading, child: button);
    if (disabled) {
      button = Opacity(opacity: 0.45, child: button);
    }

    if (loading) {
      // Loading keeps the full-colour fill, so [onPressed] stays wired and the
      // TextButton would still advertise `isEnabled` + a focus action while
      // IgnorePointer silently swallows the tap. Replace that lie with an
      // honest node: a button that names itself and reports not-enabled.
      return Semantics(
        container: true,
        button: true,
        enabled: false,
        label: semanticLabel,
        child: ExcludeSemantics(child: button),
      );
    }

    // Enabled/disabled: the TextButton owns its semantics. `disabled` nulls
    // onPressed, which is what turns `isEnabled` and the tap action off.
    return button;
  }
}
