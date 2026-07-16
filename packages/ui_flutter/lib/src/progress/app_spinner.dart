import 'dart:math' as math;

import 'package:flutter/material.dart';

/// Diameter scale for [AppSpinner] — locally-owned (web: 12 / 16 / 24px),
/// the same pattern `AppButtonSize` uses to own its own pixel ramp rather
/// than pulling it from `Tokens.*`.
enum AppSpinnerSize {
  sm,
  md,
  lg;

  /// Diameter in logical pixels.
  double get dimension => switch (this) {
    AppSpinnerSize.sm => 12,
    AppSpinnerSize.md => 16,
    AppSpinnerSize.lg => 24,
  };
}

/// Indeterminate rotating-ring spinner — Flutter twin of the web
/// `AppSpinner`.
///
/// Paints with [color] if given, else the ambient [DefaultTextStyle]
/// colour, else `colorScheme.onSurface` — mirroring the web component's
/// `border: 2px solid currentcolor` contract (callers tint it via the
/// ambient text colour rather than a required prop) and matching this
/// package's existing convention for spinners: see `AppButtonSpinner` in
/// `app_button_style.dart`, which resolves its colour the same way.
class AppSpinner extends StatefulWidget {
  const AppSpinner({
    this.size = AppSpinnerSize.md,
    this.color,
    this.semanticLabel = 'Loading',
    super.key,
  });

  final AppSpinnerSize size;

  /// Overrides the inherited ambient text colour.
  final Color? color;

  /// Accessible label; web default is "Loading". Pass `null` to render
  /// decoratively (no `Semantics` label).
  final String? semanticLabel;

  @override
  State<AppSpinner> createState() => _AppSpinnerState();
}

class _AppSpinnerState extends State<AppSpinner>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 650),
  )..repeat();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final resolved =
        widget.color ??
        DefaultTextStyle.of(context).style.color ??
        Theme.of(context).colorScheme.onSurface;
    final dimension = widget.size.dimension;

    return Semantics(
      label: widget.semanticLabel,
      child: RotationTransition(
        turns: _controller,
        child: SizedBox(
          width: dimension,
          height: dimension,
          child: CustomPaint(painter: AppSpinnerPainter(color: resolved)),
        ),
      ),
    );
  }
}

/// Paints the spinner's ~3/4 ring. The web version achieves this look with
/// a CSS-only trick (a circular border with one side's colour set to
/// `transparent`); `BoxDecoration`'s circle border requires uniform side
/// colours, so that trick has no direct Flutter equivalent — this repaints
/// the same visual as a stroked, gapped arc instead.
@immutable
class AppSpinnerPainter extends CustomPainter {
  const AppSpinnerPainter({required this.color, this.strokeWidth = 2});

  final Color color;
  final double strokeWidth;

  @override
  void paint(Canvas canvas, Size size) {
    final rect = (Offset.zero & size).deflate(strokeWidth / 2);
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth;
    canvas.drawArc(rect, -math.pi / 2, 1.5 * math.pi, false, paint);
  }

  @override
  bool shouldRepaint(covariant AppSpinnerPainter oldDelegate) =>
      oldDelegate.color != color || oldDelegate.strokeWidth != strokeWidth;
}
