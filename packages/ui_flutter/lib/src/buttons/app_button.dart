import 'package:flutter/material.dart';

import 'package:app_ui/src/buttons/app_button_style.dart';
import 'package:app_ui/src/buttons/app_button_variant.dart';
import 'package:app_ui/src/icons/icon_cs.dart';
import 'package:app_ui/src/icons/icon_name.dart';

/// The brand button — Flutter twin of the web `AppButton`.
///
/// Four [AppButtonVariant]s across three [AppButtonSize]s, with optional
/// leading/trailing [IconCS] glyphs, a full-width [block] mode, and [loading]
/// / [disabled] states. Interaction is a flat token colour swap (no ripple);
/// see [resolveAppButtonStyle].
class AppButton extends StatelessWidget {
  const AppButton({
    this.label,
    this.child,
    this.variant = AppButtonVariant.primary,
    this.size = AppButtonSize.md,
    this.loading = false,
    this.disabled = false,
    this.block = false,
    this.iconLeading,
    this.iconTrailing,
    this.onPressed,
    super.key,
  }) : assert(
         label != null ||
             child != null ||
             iconLeading != null ||
             iconTrailing != null,
         'AppButton needs a label, child, or icon to render',
       );

  final String? label;

  /// Custom label content; overrides [label] when both are set.
  final Widget? child;

  final AppButtonVariant variant;
  final AppButtonSize size;

  /// Replaces the content with a spinner and blocks taps while keeping the
  /// variant fill. Visually the button still reads as active; to assistive
  /// technology it reports `enabled: false` and offers no tap action, since it
  /// cannot in fact be activated.
  final bool loading;

  /// Fades the button and removes its callback.
  final bool disabled;

  /// Stretches the button to fill the available width.
  final bool block;

  final IconName? iconLeading;
  final IconName? iconTrailing;
  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) {
    final style = resolveAppButtonStyle(context, variant, size, block: block);

    final Widget content = loading
        ? AppButtonSpinner(size: size)
        : Row(
            mainAxisSize: block ? MainAxisSize.max : MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            children: <Widget>[
              if (iconLeading != null) ...<Widget>[
                IconCS(name: iconLeading!, size: size.iconSize),
                SizedBox(width: size.gap),
              ],
              if (child != null || label != null) child ?? Text(label!),
              if (iconTrailing != null) ...<Widget>[
                SizedBox(width: size.gap),
                IconCS(name: iconTrailing!, size: size.iconSize),
              ],
            ],
          );

    Widget button = TextButton(
      onPressed: disabled ? null : onPressed,
      style: style,
      child: content,
    );

    // Loading keeps full colour but must not be tappable.
    button = IgnorePointer(ignoring: loading, child: button);

    if (disabled) {
      button = Opacity(opacity: 0.45, child: button);
    }

    if (loading) {
      // Loading keeps the full-colour fill, so [onPressed] stays wired and the
      // TextButton would still advertise `isEnabled` + a focus action while
      // IgnorePointer silently swallows the tap: `ignoring: true` does not drop
      // the subtree, it only sets `isBlockingUserActions`, which strips the
      // actions but leaves `isEnabled` and `isFocusable` standing. Replace that
      // lie with an honest node: a button that reports not-enabled.
      //
      // [label] is the only name that survives the content swap above — the
      // spinner displaces the label, custom [child] and icons alike, so a
      // child-only button has no string left to announce. Naming this node
      // `label` is therefore the most that can be preserved, not a regression:
      // before this branch existed every loading button was nameless.
      return Semantics(
        container: true,
        button: true,
        enabled: false,
        label: label,
        child: ExcludeSemantics(child: button),
      );
    }

    // Enabled/disabled: the TextButton owns its semantics. `disabled` nulls
    // onPressed, which is what turns `isEnabled` and the tap action off, and
    // the visible label/child merges in as the accessible name.
    return button;
  }
}
