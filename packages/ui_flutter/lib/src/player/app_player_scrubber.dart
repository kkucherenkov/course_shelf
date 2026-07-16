import 'package:flutter/material.dart';

import 'package:app_ui/src/icons/icon_cs.dart';
import 'package:app_ui/src/icons/icon_name.dart';
import 'package:app_ui/src/theme/app_theme.dart';

/// Locally-owned on-video translucent-white literals for the scrubber's
/// track/buffered fill — mirrors the web `.pc-scrubber-track` /
/// `.pc-scrubber-buf` `rgba(255,255,255,*)`. There is no [ColorScheme] slot
/// for "translucent white painted directly on video" (as opposed to a themed
/// surface), so — like [AppPlayerChrome]'s on-video literals — this is its
/// own scale rather than a token.
abstract final class AppPlayerScrubberOpacity {
  static const double track = 0.18;
  static const double buffered = 0.35;
}

/// The mobile-landscape [AppPlayerChrome] scrubber: a custom-painted
/// track/buffered/played bar with a thumb and chapter ticks, plus bookmark
/// glyphs ([IconCS] `bookmark`, filled) poking above the track.
///
/// There is no `app_ui` primitive for a scrubber — the bar geometry is
/// painted directly via [AppPlayerScrubberPainter]; only the bookmark glyph
/// reuses [IconCS]. Tapping anywhere along the bar fires [onSeek] with the
/// tapped x-fraction (0..1), clamped to the track bounds — mirrors the web
/// `onScrub`'s `(e.clientX - r.left) / r.width` computation.
class AppPlayerScrubber extends StatelessWidget {
  const AppPlayerScrubber({
    required this.playedFraction,
    this.bufferedFraction = 0,
    this.chapterFractions = const <double>[],
    this.bookmarkFractions = const <double>[],
    this.onSeek,
    this.height = 16,
    super.key,
  });

  /// 0..1 fraction of [AppPlayerChrome.duration] already played.
  final double playedFraction;

  /// 0..1 fraction of [AppPlayerChrome.duration] buffered so far.
  final double bufferedFraction;

  /// 0..1 fractions along the bar where a chapter tick is drawn.
  final List<double> chapterFractions;

  /// 0..1 fractions along the bar where a bookmark glyph is drawn.
  final List<double> bookmarkFractions;

  /// Fires with the tapped x-fraction (0..1) of the bar's width.
  final ValueChanged<double>? onSeek;

  /// Bar hit-area height — the web `.pc-scrubber` is `16px` tall (a 3px
  /// track centred within a taller tap target); locally-owned to match.
  final double height;

  static const Key gestureKey = Key('appPlayerScrubberGesture');

  void _handleTapDown(TapDownDetails details, double width) {
    if (onSeek == null || width <= 0) return;
    final double fraction = (details.localPosition.dx / width).clamp(0.0, 1.0);
    onSeek!(fraction);
  }

  @override
  Widget build(BuildContext context) {
    final ColorScheme cs = Theme.of(context).colorScheme;
    final Color bookmarkColor = context.semanticColors.infoFg;

    return SizedBox(
      height: height,
      child: LayoutBuilder(
        builder: (BuildContext context, BoxConstraints constraints) {
          final double width = constraints.maxWidth;
          return GestureDetector(
            key: gestureKey,
            behavior: HitTestBehavior.opaque,
            onTapDown: (TapDownDetails details) =>
                _handleTapDown(details, width),
            child: Stack(
              clipBehavior: Clip.none,
              children: <Widget>[
                Positioned.fill(
                  child: CustomPaint(
                    painter: AppPlayerScrubberPainter(
                      playedFraction: playedFraction.clamp(0.0, 1.0),
                      bufferedFraction: bufferedFraction.clamp(0.0, 1.0),
                      chapterFractions: chapterFractions,
                      trackColor: Colors.white.withValues(
                        alpha: AppPlayerScrubberOpacity.track,
                      ),
                      bufferedColor: Colors.white.withValues(
                        alpha: AppPlayerScrubberOpacity.buffered,
                      ),
                      playedColor: cs.primary,
                      chapterColor: Colors.black,
                    ),
                  ),
                ),
                for (final double fraction in bookmarkFractions)
                  Positioned(
                    left: (fraction.clamp(0.0, 1.0) * width) - 5,
                    top: -4,
                    child: IgnorePointer(
                      child: IconCS(
                        name: IconName.bookmark,
                        size: 10,
                        fill: true,
                        color: bookmarkColor,
                      ),
                    ),
                  ),
              ],
            ),
          );
        },
      ),
    );
  }
}

/// Paints the scrubber's track / buffered fill / played fill / thumb /
/// chapter ticks. Mirrors the web `.pc-scrubber-*` stack of absolutely
/// positioned divs as one painted surface.
@immutable
class AppPlayerScrubberPainter extends CustomPainter {
  const AppPlayerScrubberPainter({
    required this.playedFraction,
    required this.bufferedFraction,
    required this.chapterFractions,
    required this.trackColor,
    required this.bufferedColor,
    required this.playedColor,
    required this.chapterColor,
    this.barThickness = 3,
    this.thumbRadius = 5.5,
    this.chapterWidth = 2,
    this.chapterHeight = 9,
  });

  final double playedFraction;
  final double bufferedFraction;
  final List<double> chapterFractions;
  final Color trackColor;
  final Color bufferedColor;
  final Color playedColor;
  final Color chapterColor;

  /// Track/buffered/played bar thickness — web `height: 3px`.
  final double barThickness;

  /// Thumb circle radius — web `width/height: 11px` (radius 5.5).
  final double thumbRadius;

  /// Chapter tick width/height — web `width: 2px; height: 9px`.
  final double chapterWidth;
  final double chapterHeight;

  Rect _barRect(Size size, double fraction) => Rect.fromLTWH(
    0,
    size.height / 2 - barThickness / 2,
    size.width * fraction.clamp(0.0, 1.0),
    barThickness,
  );

  @override
  void paint(Canvas canvas, Size size) {
    final double midY = size.height / 2;
    final Paint paint = Paint()..style = PaintingStyle.fill;
    final Radius barRadius = Radius.circular(barThickness / 2);

    paint.color = trackColor;
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTWH(0, midY - barThickness / 2, size.width, barThickness),
        barRadius,
      ),
      paint,
    );

    paint.color = bufferedColor;
    canvas.drawRRect(
      RRect.fromRectAndRadius(_barRect(size, bufferedFraction), barRadius),
      paint,
    );

    paint.color = playedColor;
    canvas.drawRRect(
      RRect.fromRectAndRadius(_barRect(size, playedFraction), barRadius),
      paint,
    );

    paint.color = chapterColor;
    for (final double fraction in chapterFractions) {
      final double x = size.width * fraction.clamp(0.0, 1.0);
      final Rect tick = Rect.fromCenter(
        center: Offset(x, midY),
        width: chapterWidth,
        height: chapterHeight,
      );
      canvas.drawRRect(
        RRect.fromRectAndRadius(tick, const Radius.circular(1)),
        paint,
      );
    }

    paint.color = playedColor;
    canvas.drawCircle(
      Offset(size.width * playedFraction.clamp(0.0, 1.0), midY),
      thumbRadius,
      paint,
    );
  }

  @override
  bool shouldRepaint(covariant AppPlayerScrubberPainter oldDelegate) =>
      oldDelegate.playedFraction != playedFraction ||
      oldDelegate.bufferedFraction != bufferedFraction ||
      oldDelegate.chapterFractions != chapterFractions ||
      oldDelegate.trackColor != trackColor ||
      oldDelegate.bufferedColor != bufferedColor ||
      oldDelegate.playedColor != playedColor ||
      oldDelegate.chapterColor != chapterColor;
}
