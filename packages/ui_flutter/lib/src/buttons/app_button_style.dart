import 'package:flutter/material.dart';

import 'package:app_ui/src/buttons/app_button_variant.dart';
import 'package:app_ui/src/theme/app_theme.dart';
import 'package:app_ui/src/theme/tokens.g.dart';

/// Resolves the flat, token-driven [ButtonStyle] shared by [AppButton] and
/// [AppIconButton].
///
/// Interaction is a flat colour swap (no Material ink): `overlayColor` is
/// transparent and hover/press colours are baked into `backgroundColor`,
/// mirroring the web design and using the `accentActive` token for the pressed
/// state. Every colour comes from the [ColorScheme] or [AppSemanticColors];
/// only the control height is a locally-owned scale.
ButtonStyle resolveAppButtonStyle(
  BuildContext context,
  AppButtonVariant variant,
  AppButtonSize size, {
  bool square = false,
  bool block = false,
}) {
  final cs = Theme.of(context).colorScheme;
  final sem = context.semanticColors;

  // Bind the label font off the theme's labelLarge (which carries the packaged
  // sans family) and override only size + weight from tokens — never the bare
  // AppTextStyles family, which degrades to the platform font in consuming apps.
  final textStyle =
      (Theme.of(context).textTheme.labelLarge ?? const TextStyle()).copyWith(
        fontSize: size.fontSize,
        fontWeight: AppFontWeight.medium,
      );

  final Color background;
  final Color foreground;
  final Color pressed;
  final Color hovered;
  Color? border;
  Color? borderHovered;

  switch (variant) {
    case AppButtonVariant.primary:
      background = cs.primary;
      foreground = cs.onPrimary;
      pressed = sem.accentActive;
      hovered = sem.accentHover;
    case AppButtonVariant.secondary:
      background = sem.raised;
      foreground = cs.onSurface;
      border = cs.outline;
      borderHovered = cs.outlineVariant;
      pressed = cs.surface;
      hovered = cs.surface;
    case AppButtonVariant.ghost:
      background = Colors.transparent;
      foreground = cs.onSurface;
      pressed = sem.raised;
      hovered = sem.raised;
    case AppButtonVariant.destructive:
      background = cs.error;
      foreground = cs.onError;
      pressed = Color.alphaBlend(
        Colors.black.withValues(alpha: 0.08),
        cs.error,
      );
      hovered = Color.alphaBlend(
        Colors.black.withValues(alpha: 0.05),
        cs.error,
      );
  }

  Color backgroundFor(Set<WidgetState> states) {
    if (states.contains(WidgetState.pressed)) return pressed;
    if (states.contains(WidgetState.hovered)) return hovered;
    return background;
  }

  BorderSide sideFor(Set<WidgetState> states) {
    if (border == null) return BorderSide.none;
    final color = states.contains(WidgetState.hovered)
        ? (borderHovered ?? border)
        : border;
    return BorderSide(color: color);
  }

  final Size minimumSize = square
      ? Size(size.height, size.height)
      : Size(block ? double.infinity : 0, size.height);

  return ButtonStyle(
    backgroundColor: WidgetStateProperty.resolveWith(backgroundFor),
    foregroundColor: WidgetStatePropertyAll<Color>(foreground),
    iconColor: WidgetStatePropertyAll<Color>(foreground),
    overlayColor: const WidgetStatePropertyAll<Color>(Colors.transparent),
    side: WidgetStateProperty.resolveWith(sideFor),
    shape: WidgetStatePropertyAll<OutlinedBorder>(
      RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.md)),
    ),
    padding: WidgetStatePropertyAll<EdgeInsetsGeometry>(
      square
          ? EdgeInsets.zero
          : EdgeInsets.symmetric(horizontal: size.horizontalPadding),
    ),
    minimumSize: WidgetStatePropertyAll<Size>(minimumSize),
    fixedSize: square
        ? WidgetStatePropertyAll<Size>(Size(size.height, size.height))
        : null,
    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
    textStyle: WidgetStatePropertyAll<TextStyle>(textStyle),
    elevation: const WidgetStatePropertyAll<double>(0),
    shadowColor: const WidgetStatePropertyAll<Color>(Colors.transparent),
    splashFactory: NoSplash.splashFactory,
  );
}

/// The load spinner shown in place of a button's content, sized to the glyph
/// and coloured with the button's resolved foreground.
class AppButtonSpinner extends StatelessWidget {
  const AppButtonSpinner({required this.size, super.key});

  final AppButtonSize size;

  @override
  Widget build(BuildContext context) {
    final dimension = size.iconSize;
    return SizedBox(
      width: dimension,
      height: dimension,
      child: CircularProgressIndicator(
        strokeWidth: 2,
        color: DefaultTextStyle.of(context).style.color,
      ),
    );
  }
}
