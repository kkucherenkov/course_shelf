import 'package:flutter/material.dart';

import 'package:app_ui/src/course/course_card_data.dart';
import 'package:app_ui/src/course/course_cover_backdrop.dart';
import 'package:app_ui/src/icons/icon_cs.dart';
import 'package:app_ui/src/icons/icon_name.dart';
import 'package:app_ui/src/progress/app_skeleton.dart';
import 'package:app_ui/src/theme/app_theme.dart';
import 'package:app_ui/src/theme/tokens.g.dart';

/// The brand poster course card — Flutter twin of the web `CoursePosterCard`.
///
/// A 3:4 cover ([CourseCoverBackdrop]) topped with a completed-state check
/// badge, a locked-state scrim, or an in-progress [CourseProgressStrip],
/// under a two-line title + single-line instructor body. [loading] swaps the
/// whole card for a skeleton. [interactive] (default `true`) keeps standalone
/// button semantics — tap/Enter/Space fire [onTap] with [course]; pass
/// `false` when the card is wrapped in a link/route that already owns
/// navigation and focus, mirroring the web `interactive` prop (no nested
/// interactive control, no [onTap] firing).
class CoursePosterCard extends StatefulWidget {
  const CoursePosterCard({
    required this.course,
    this.state = CourseCardState.auto,
    this.loading = false,
    this.interactive = true,
    this.onTap,
    super.key,
  });

  final CourseCardData course;
  final CourseCardState state;
  final bool loading;
  final bool interactive;

  /// Fires with [course] on activation when [interactive] is true; ignored
  /// otherwise (mirrors the web `shouldActivate` guard).
  final ValueChanged<CourseCardData>? onTap;

  @override
  State<CoursePosterCard> createState() => _CoursePosterCardState();
}

class _CoursePosterCardState extends State<CoursePosterCard> {
  bool _hovered = false;
  bool _focused = false;

  void _setHovered(bool value) {
    if (_hovered == value) return;
    setState(() => _hovered = value);
  }

  void _setFocused(bool value) {
    if (_focused == value) return;
    setState(() => _focused = value);
  }

  @override
  Widget build(BuildContext context) {
    if (widget.loading) return _buildSkeleton();

    final ThemeData theme = Theme.of(context);
    final ColorScheme cs = theme.colorScheme;
    final CourseCardRealState realState = courseCardRealState(
      widget.course,
      widget.state,
    );
    final int pct = courseCardPercent(widget.course, widget.state);

    List<BoxShadow>? shadow;
    if (widget.interactive) {
      if (_focused) {
        shadow = context.shadows.focus;
      } else if (_hovered) {
        shadow = context.shadows.sm;
      }
    }

    final TextStyle titleStyle =
        (theme.textTheme.bodyLarge ?? const TextStyle()).copyWith(
          fontSize: AppFontSize.base,
          fontWeight: AppFontWeight.semibold,
          color: cs.onSurface,
          height: AppLeading.snug,
        );
    final TextStyle instructorStyle =
        (theme.textTheme.bodySmall ?? const TextStyle()).copyWith(
          fontSize: AppFontSize.sm,
          color: cs.onSurfaceVariant,
        );

    final Widget cover = AspectRatio(
      aspectRatio: 3 / 4,
      child: Stack(
        fit: StackFit.expand,
        children: <Widget>[
          CourseCoverBackdrop(
            course: widget.course,
            initialsFontSize: AppFontSize.s3xl,
          ),
          if (realState == CourseCardRealState.completed)
            Positioned(
              top: AppSpacing.s2,
              right: AppSpacing.s2,
              child: ExcludeSemantics(
                child: Container(
                  width: _Badge.diameter,
                  height: _Badge.diameter,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: context.semanticColors.successFg,
                    shape: BoxShape.circle,
                  ),
                  child: const IconCS(
                    name: IconName.check,
                    size: _Badge.iconSize,
                    color: Colors.white,
                  ),
                ),
              ),
            )
          else if (realState == CourseCardRealState.locked)
            ExcludeSemantics(
              child: Container(
                color: Colors.black.withValues(alpha: AppOpacity.overlay),
                alignment: Alignment.center,
                child: const IconCS(
                  name: IconName.lock,
                  size: _Badge.lockIconSize,
                  color: Colors.white,
                ),
              ),
            )
          else
            Positioned(
              left: 0,
              right: 0,
              bottom: 0,
              height: CourseProgressStrip.height,
              child: CourseProgressStrip(pct: pct),
            ),
        ],
      ),
    );

    final Widget body = Padding(
      padding: const EdgeInsets.fromLTRB(
        AppSpacing.s1,
        AppSpacing.s2,
        AppSpacing.s1,
        AppSpacing.s1,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          Text(
            widget.course.title,
            style: titleStyle,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          if (widget.course.instructor.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 2),
              child: Text(
                widget.course.instructor,
                style: instructorStyle,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
        ],
      ),
    );

    Widget card = DecoratedBox(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(AppRadius.md),
        boxShadow: shadow,
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(AppRadius.md),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: <Widget>[cover, body],
        ),
      ),
    );

    if (widget.interactive) {
      card = Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(AppRadius.md),
        child: InkWell(
          onTap: () => widget.onTap?.call(widget.course),
          onHover: _setHovered,
          onFocusChange: _setFocused,
          borderRadius: BorderRadius.circular(AppRadius.md),
          overlayColor: const WidgetStatePropertyAll<Color>(Colors.transparent),
          splashFactory: NoSplash.splashFactory,
          child: Semantics(
            button: true,
            label: widget.course.title,
            child: card,
          ),
        ),
      );
    }

    return card;
  }

  Widget _buildSkeleton() {
    return const ExcludeSemantics(
      child: ClipRRect(
        borderRadius: BorderRadius.all(Radius.circular(AppRadius.md)),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: <Widget>[
            AspectRatio(
              aspectRatio: 3 / 4,
              child: AppSkeleton(
                width: double.infinity,
                height: double.infinity,
                radius: AppSkeletonRadius.md,
              ),
            ),
            Padding(
              padding: EdgeInsets.fromLTRB(
                AppSpacing.s1,
                AppSpacing.s2,
                AppSpacing.s1,
                AppSpacing.s1,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: <Widget>[
                  AppSkeleton(
                    width: 160,
                    height: AppFontSize.base,
                    radius: AppSkeletonRadius.sm,
                  ),
                  Padding(
                    padding: EdgeInsets.only(top: 6),
                    child: AppSkeleton(
                      width: 100,
                      height: AppFontSize.sm,
                      radius: AppSkeletonRadius.sm,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Completed-badge / locked-scrim icon geometry — a locally-owned micro-scale
/// mirroring the web `.app-course-poster-card__badge`/`__scrim` SCSS block (28px
/// circle, 16px check glyph, 20px lock glyph), all hard-coded there too.
abstract final class _Badge {
  static const double diameter = 28;
  static const double iconSize = 16;
  static const double lockIconSize = 20;
}
