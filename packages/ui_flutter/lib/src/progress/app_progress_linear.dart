import 'package:flutter/material.dart';

import 'package:app_ui/src/theme/tokens.g.dart';

/// Determinate/indeterminate horizontal progress bar — Flutter twin of the
/// web `AppProgressLinear`.
///
/// [value] is 0..100 (out-of-range values are clamped); `null` renders the
/// indeterminate sliding-stripe animation, mirroring the web contract where
/// an `undefined` value switches the same markup into its
/// `--indeterminate` variant. [thin] drops the track height from 4px to 2px
/// — both a locally-owned pixel scale, matching how the web owns its own
/// `.app-progress-linear` height rule rather than pulling it from a shared
/// scale (see [trackHeight] / [thinTrackHeight]). Every other metric routes
/// through `Tokens.*`: fill/track colour from [ColorScheme]
/// (`colorScheme.primary` / `colorScheme.surfaceContainerHighest`, the
/// latter aliasing the same `--surface-overlay` token the web substitutes
/// for its bundle `--surface-3`), corner radius from [AppRadius.xs] (2px,
/// matching the web's literal `border-radius: 2px`), and transition/
/// animation timing from [AppDuration] / [AppEasing].
///
/// Must be laid out with a bounded width (e.g. inside a `Column`, or
/// wrapped in a `SizedBox`) — the same requirement Flutter's own
/// `LinearProgressIndicator` has, since the track needs a concrete pixel
/// width to compute the fill/stripe geometry.
class AppProgressLinear extends StatefulWidget {
  const AppProgressLinear({
    this.value,
    this.thin = false,
    this.label,
    super.key,
  });

  /// 0..100; `null` = indeterminate.
  final double? value;

  /// Drops the track height to 2px (locally-owned scale; see class doc).
  final bool thin;

  /// Accessible label surfaced as the `Semantics` label alongside the
  /// numeric percentage value.
  final String? label;

  /// Track height in logical pixels — locally-owned scale (web: 4px).
  static const double trackHeight = 4;

  /// Thin track height in logical pixels — locally-owned scale (web: 2px).
  static const double thinTrackHeight = 2;

  /// Test/inspection key for the fill (determinate) / stripe
  /// (indeterminate) element.
  static const Key fillKey = Key('appProgressLinearFill');

  bool get _indeterminate => value == null;

  double get _clamped => value == null ? 0 : value!.clamp(0, 100).toDouble();

  @override
  State<AppProgressLinear> createState() => _AppProgressLinearState();
}

class _AppProgressLinearState extends State<AppProgressLinear>
    with SingleTickerProviderStateMixin {
  AnimationController? _controller;

  @override
  void initState() {
    super.initState();
    if (widget._indeterminate) _start();
  }

  @override
  void didUpdateWidget(covariant AppProgressLinear oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget._indeterminate && _controller == null) {
      _start();
    } else if (!widget._indeterminate && _controller != null) {
      _controller!.dispose();
      _controller = null;
    }
  }

  void _start() {
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1400),
    )..repeat();
  }

  @override
  void dispose() {
    _controller?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final height = widget.thin
        ? AppProgressLinear.thinTrackHeight
        : AppProgressLinear.trackHeight;
    final radius = BorderRadius.circular(AppRadius.xs);

    return Semantics(
      label: widget.label,
      value: widget._indeterminate ? null : '${widget._clamped.round()}%',
      child: LayoutBuilder(
        builder: (context, constraints) {
          final trackWidth = constraints.maxWidth;
          return ClipRRect(
            borderRadius: radius,
            child: SizedBox(
              width: trackWidth,
              height: height,
              child: ColoredBox(
                color: cs.surfaceContainerHighest,
                child: widget._indeterminate
                    ? _IndeterminateFill(
                        controller: _controller!,
                        trackWidth: trackWidth,
                        height: height,
                        color: cs.primary,
                      )
                    : Align(
                        alignment: Alignment.centerLeft,
                        child: AnimatedContainer(
                          key: AppProgressLinear.fillKey,
                          duration: AppDuration.slow,
                          curve: AppEasing.out,
                          width: trackWidth * (widget._clamped / 100),
                          height: height,
                          color: cs.primary,
                        ),
                      ),
              ),
            ),
          );
        },
      ),
    );
  }
}

/// The indeterminate sliding stripe: a 35%-of-track-width band that
/// translates from -100% to +300% of its own width on an infinite 1.4s
/// loop, mirroring the web's `app-progress-linear-slide` keyframes.
class _IndeterminateFill extends StatelessWidget {
  const _IndeterminateFill({
    required this.controller,
    required this.trackWidth,
    required this.height,
    required this.color,
  });

  final AnimationController controller;
  final double trackWidth;
  final double height;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: controller,
      builder: (context, _) {
        final stripeWidth = trackWidth * 0.35;
        final t = AppEasing.easeDefault.transform(controller.value);
        final left = -stripeWidth + t * 4 * stripeWidth;
        return Stack(
          clipBehavior: Clip.hardEdge,
          children: <Widget>[
            Positioned(
              left: left,
              width: stripeWidth,
              height: height,
              child: ColoredBox(key: AppProgressLinear.fillKey, color: color),
            ),
          ],
        );
      },
    );
  }
}
