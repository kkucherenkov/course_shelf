import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

import 'package:app_ui/src/icons/icon_glyphs.dart';
import 'package:app_ui/src/icons/icon_name.dart';

/// A single glyph from the CourseShelf brand icon family.
///
/// The Flutter twin of the web `IconCS` component: the same 66 named glyphs
/// ([IconName]) rendered from identical SVG markup. Icons paint in
/// `currentColor` — resolved to [color], else the ambient [IconTheme] colour,
/// else `colorScheme.onSurface` — mirroring the web component. Decorative by
/// default; pass [semanticLabel] to announce it to assistive technology.
class IconCS extends StatelessWidget {
  const IconCS({
    required this.name,
    this.size = 20,
    this.fill = false,
    this.color,
    this.semanticLabel,
    super.key,
  });

  /// Which glyph to render.
  final IconName name;

  /// Width and height in logical pixels (square). Defaults to 20, matching web.
  final double size;

  /// Fills the interior of the fillable glyphs (play, bookmark); a no-op
  /// for every other glyph.
  final bool fill;

  /// Overrides the inherited `currentColor`.
  final Color? color;

  /// When non-null the icon is announced with this label; otherwise it is
  /// decorative and excluded from semantics (mirrors web `aria-hidden`).
  final String? semanticLabel;

  @override
  Widget build(BuildContext context) {
    final resolved =
        color ??
        IconTheme.of(context).color ??
        Theme.of(context).colorScheme.onSurface;
    return SvgPicture.string(
      buildIconSvg(name, fill: fill),
      width: size,
      height: size,
      colorFilter: ColorFilter.mode(resolved, BlendMode.srcIn),
      semanticsLabel: semanticLabel,
      excludeFromSemantics: semanticLabel == null,
    );
  }
}
