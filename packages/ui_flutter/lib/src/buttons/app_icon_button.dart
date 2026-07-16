import 'package:flutter/material.dart';

import 'package:app_ui/src/buttons/app_button_style.dart';
import 'package:app_ui/src/buttons/app_button_variant.dart';
import 'package:app_ui/src/icons/icon_cs.dart';
import 'package:app_ui/src/icons/icon_name.dart';

/// A square, single-glyph button — Flutter twin of the web `AppIconButton`.
///
/// Shares [AppButton]'s palette and states; the required [semanticLabel] is
/// its accessible name (an icon-only control has no visible text).
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

    Widget button = TextButton(
      onPressed: disabled ? null : onPressed,
      style: style,
      child: content,
    );
    button = IgnorePointer(ignoring: loading, child: button);
    if (disabled) {
      button = Opacity(opacity: 0.45, child: button);
    }

    return Semantics(
      button: true,
      enabled: !disabled && !loading,
      label: semanticLabel,
      child: ExcludeSemantics(child: button),
    );
  }
}
