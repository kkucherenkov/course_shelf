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
///
/// The accessible name is [semanticLabel] when supplied, otherwise the visible
/// [label]. Icon- and custom-[child]-only buttons carry no text to name them,
/// so [semanticLabel] is required whenever [label] is null — the same contract
/// [AppIconButton] enforces. The name rides on the button's own node in every
/// state, including [loading], where the spinner displaces all visible content.
class AppButton extends StatelessWidget {
  const AppButton({
    this.label,
    this.child,
    this.semanticLabel,
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
       ),
       assert(
         label != null || semanticLabel != null,
         'AppButton needs a semanticLabel when label is null — an icon- or '
         'child-only control has no visible text to name it',
       );

  final String? label;

  /// Custom label content; overrides [label] when both are set.
  final Widget? child;

  /// Accessible name announced to assistive technology. Defaults to [label];
  /// required when [label] is null (icon-/child-only buttons have no visible
  /// text). Overrides the visible text when both are given.
  final String? semanticLabel;

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

    // The name is [semanticLabel] when given, else the visible [label]; the
    // assert guarantees at least one is non-null, so this never resolves null.
    final String name = semanticLabel ?? label!;

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
      // The name rides *inside* the button so it merges into the button's own
      // node, exactly as [AppIconButton] does. Wrapping the TextButton from the
      // outside would strand the name on a separate, action-less parent node.
      // Excluding the content's own semantics keeps [name] authoritative — the
      // decorative glyphs never leak in, and a noisy custom [child] cannot
      // either — and guarantees an icon-only button is never nameless.
      child: Semantics(label: name, excludeSemantics: true, child: content),
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
      // lie with an honest node: a button that names itself and reports
      // not-enabled.
      //
      // The spinner displaces the visible label, custom [child] and icons
      // alike, so no descendant is left to announce; [name] is the only string
      // that survives the swap. Because [semanticLabel] is required whenever
      // [label] is null, [name] is non-null here even for a child-only button —
      // that is exactly the child-only-loading gap this fix closes.
      return Semantics(
        container: true,
        button: true,
        enabled: false,
        label: name,
        child: ExcludeSemantics(child: button),
      );
    }

    // Enabled/disabled: the TextButton owns its semantics. `disabled` nulls
    // onPressed, which is what turns `isEnabled` and the tap action off, and
    // the visible label/child merges in as the accessible name.
    return button;
  }
}
