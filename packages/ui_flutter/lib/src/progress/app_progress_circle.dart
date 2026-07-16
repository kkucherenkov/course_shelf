import 'package:flutter/material.dart';

import 'package:app_ui/src/theme/tokens.g.dart';

/// Determinate/indeterminate circular progress ring — Flutter twin of the
/// web `AppProgressCircle`.
///
/// [value] is 0..100 (clamped); `null` renders a continuously rotating
/// indeterminate ring. This extends the web contract — the web
/// `AppProgressCircle` prop is determinate-only (`value` is required) —
/// but this card's scope calls for an indeterminate state too, so this
/// twin makes [value] nullable rather than dropping the state.
///
/// Delegates to Flutter's native [CircularProgressIndicator], which
/// already draws its determinate arc from the 12-o'clock position
/// clockwise, and with [StrokeCap.round] gives the same rounded cap as the
/// web's `stroke-linecap: round` — matching the web's `transform:
/// rotate(-90deg)` without a bespoke `CustomPainter` reimplementing that
/// arc math. [size] / [stroke] are a locally-owned pixel scale (web
/// defaults: 32px diameter / 3px stroke); colour comes from [ColorScheme]
/// and the determinate transition timing from [AppDuration] / [AppEasing].
class AppProgressCircle extends StatelessWidget {
  const AppProgressCircle({
    this.value,
    this.size = 32,
    this.stroke = 3,
    this.label,
    super.key,
  });

  /// 0..100; `null` = indeterminate.
  final double? value;

  /// Diameter in logical pixels — locally-owned scale (web default: 32).
  final double size;

  /// Stroke width in logical pixels — locally-owned scale (web default: 3).
  final double stroke;

  /// Accessible label surfaced as the `Semantics` label alongside the
  /// numeric percentage value.
  final String? label;

  double? get _clamped => value?.clamp(0, 100).toDouble();

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final clamped = _clamped;

    return Semantics(
      label: label,
      value: clamped == null ? null : '${clamped.round()}%',
      child: SizedBox(
        width: size,
        height: size,
        child: clamped == null
            ? CircularProgressIndicator(
                strokeWidth: stroke,
                strokeCap: StrokeCap.round,
                color: cs.primary,
                backgroundColor: cs.surfaceContainerHighest,
              )
            : TweenAnimationBuilder<double>(
                tween: Tween<double>(begin: 0, end: clamped),
                duration: AppDuration.slow,
                curve: AppEasing.out,
                builder: (context, animated, _) => CircularProgressIndicator(
                  value: animated / 100,
                  strokeWidth: stroke,
                  strokeCap: StrokeCap.round,
                  color: cs.primary,
                  backgroundColor: cs.surfaceContainerHighest,
                ),
              ),
      ),
    );
  }
}
