import 'package:flutter/material.dart';

import 'package:app_ui/src/course/course_card_data.dart';
import 'package:app_ui/src/theme/tokens.g.dart';

/// Shared cover backdrop for [CoursePosterCard] and [CourseWideCard]: an
/// accent-colour (or [CourseCardData.cover] override) block carrying the
/// course's initials and a bottom gradient scrim, mirroring the web
/// `use-course-card.ts` composable's `coverStyle`/`coverInitials`
/// (`CourseCompactRow` does NOT use this — its thumb is a bare accent block
/// with no glyph, matching the web component).
///
/// Purely decorative: wrapped in [ExcludeSemantics] since the accessible name
/// comes from the card root (`Semantics(button:, label:)`), mirroring the web
/// `aria-hidden="true"` on the initials span and overlay div.
class CourseCoverBackdrop extends StatelessWidget {
  const CourseCoverBackdrop({
    required this.course,
    required this.initialsFontSize,
    super.key,
  });

  final CourseCardData course;

  /// Web uses `--text-3xl` (poster) / `--text-lg` (wide) for the initials
  /// glyph — pass the matching [AppFontSize] constant.
  final double initialsFontSize;

  @override
  Widget build(BuildContext context) {
    final Color background = course.cover ?? courseAccentColor(course.accent);
    final TextStyle initialsStyle =
        (Theme.of(context).textTheme.titleLarge ?? const TextStyle()).copyWith(
          fontSize: initialsFontSize,
          fontWeight: AppFontWeight.bold,
          // Web: `color: rgba(255, 255, 255, 0.85)` — a literal, not a
          // token, on both twins.
          color: Colors.white.withValues(alpha: 0.85),
          letterSpacing: AppTracking.wide * initialsFontSize,
          height: 1,
        );

    return ExcludeSemantics(
      child: DecoratedBox(
        decoration: BoxDecoration(color: background),
        child: Stack(
          fit: StackFit.expand,
          children: <Widget>[
            Center(
              child: Text(
                courseCardInitials(course.title),
                style: initialsStyle,
              ),
            ),
            DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  stops: const <double>[0.5, 1],
                  colors: <Color>[
                    Colors.transparent,
                    Colors.black.withValues(alpha: AppOpacity.overlay),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// The bottom accent-fill strip shared by [CoursePosterCard] and
/// [CourseWideCard], mirroring the web `__strip`/`__strip-fill`.
///
/// Deliberately NOT built on `AppProgressLinear`: that primitive reads its
/// track/fill colours from the ambient [ColorScheme] (an opaque
/// `surfaceContainerHighest` track), whereas this strip sits over an
/// arbitrary-colour cover image and needs the web's literal translucent-white
/// track (`rgba(255, 255, 255, 0.25)`) to stay legible on every accent. The
/// fill colour (`cs.primary`) and width-animation technique (bounded
/// [LayoutBuilder] + [AnimatedContainer], `AppDuration.slow` /
/// `AppEasing.out`) are copied verbatim from `AppProgressLinear` so the two
/// only diverge where the visual context genuinely requires it.
class CourseProgressStrip extends StatelessWidget {
  const CourseProgressStrip({required this.pct, super.key});

  final int pct;

  /// Strip height in logical pixels — locally-owned scale mirroring the web
  /// literal `height: 3px` (not part of the shared design-token scale).
  static const double height = 3;

  static const Key fillKey = Key('courseProgressStripFill');

  @override
  Widget build(BuildContext context) {
    final ColorScheme cs = Theme.of(context).colorScheme;
    final double clamped = pct.clamp(0, 100).toDouble();

    return ExcludeSemantics(
      child: LayoutBuilder(
        builder: (BuildContext context, BoxConstraints constraints) {
          final double trackWidth = constraints.maxWidth;
          return SizedBox(
            width: trackWidth,
            height: height,
            child: ColoredBox(
              color: Colors.white.withValues(alpha: 0.25),
              child: Align(
                alignment: Alignment.centerLeft,
                child: AnimatedContainer(
                  key: fillKey,
                  duration: AppDuration.slow,
                  curve: AppEasing.out,
                  width: trackWidth * (clamped / 100),
                  height: height,
                  color: cs.primary,
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}
