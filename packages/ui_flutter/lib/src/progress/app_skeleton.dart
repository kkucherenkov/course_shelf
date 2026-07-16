import 'package:flutter/material.dart';

import 'package:app_ui/src/theme/app_theme.dart';
import 'package:app_ui/src/theme/tokens.g.dart';

/// Corner-radius variant for [AppSkeleton] — maps onto [AppRadius] (web:
/// sm/md/pill).
enum AppSkeletonRadius {
  sm,
  md,
  pill;

  double get value => switch (this) {
    AppSkeletonRadius.sm => AppRadius.sm,
    AppSkeletonRadius.md => AppRadius.md,
    AppSkeletonRadius.pill => AppRadius.pill,
  };
}

/// Shimmering placeholder block — Flutter twin of the web `AppSkeleton`.
///
/// Paints a three-stop [AppSemanticColors.skeletonBase] /
/// [AppSemanticColors.skeletonShine] / base gradient whose stops sweep
/// across the box on an infinite 1.4s loop, mirroring the web's
/// `background-position` shimmer keyframes. [width] / [height] take a
/// logical-pixel size directly — Flutter has no `1em`/`100%` CSS-length
/// equivalent for the web's string props — so this twin's defaults
/// (`double.infinity` / 16px) are a locally-owned substitution for the
/// web's `100%` / `1em` defaults: `double.infinity` fills the bounded
/// parent exactly like `width: 100%` (the same idiom Flutter uses
/// elsewhere for "fill available width"), and 16px approximates a `1em`
/// line-height box at the default body font size. Always excluded from
/// the semantics tree, matching the web's `aria-hidden="true"`.
class AppSkeleton extends StatefulWidget {
  const AppSkeleton({
    this.width = double.infinity,
    this.height = 16,
    this.radius = AppSkeletonRadius.sm,
    super.key,
  });

  final double width;
  final double height;
  final AppSkeletonRadius radius;

  @override
  State<AppSkeleton> createState() => _AppSkeletonState();
}

class _AppSkeletonState extends State<AppSkeleton>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1400),
  )..repeat();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final sem = context.semanticColors;
    final borderRadius = BorderRadius.circular(widget.radius.value);

    return ExcludeSemantics(
      child: SizedBox(
        width: widget.width,
        height: widget.height,
        child: AnimatedBuilder(
          animation: _controller,
          builder: (context, _) {
            // Shine centre sweeps from the left edge (-1) to the right
            // edge (+1) each cycle, then jump-cuts back — the same
            // instantaneous loop reset the web's `infinite` (non-alternate)
            // keyframe animation has.
            final shineCenter = -1 + 2 * _controller.value;
            return DecoratedBox(
              decoration: BoxDecoration(
                borderRadius: borderRadius,
                gradient: LinearGradient(
                  begin: Alignment(shineCenter - 1, 0),
                  end: Alignment(shineCenter + 1, 0),
                  stops: const <double>[0, 0.5, 1],
                  colors: <Color>[
                    sem.skeletonBase,
                    sem.skeletonShine,
                    sem.skeletonBase,
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}
