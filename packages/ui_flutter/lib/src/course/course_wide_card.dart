import 'package:flutter/material.dart';

import 'package:app_ui/src/course/course_card_data.dart';
import 'package:app_ui/src/course/course_cover_backdrop.dart';
import 'package:app_ui/src/icons/icon_cs.dart';
import 'package:app_ui/src/icons/icon_name.dart';
import 'package:app_ui/src/progress/app_skeleton.dart';
import 'package:app_ui/src/theme/app_theme.dart';
import 'package:app_ui/src/theme/tokens.g.dart';

/// The brand wide course card — Flutter twin of the web `CourseWideCard`.
///
/// A fixed 80x80 thumb ([CourseCoverBackdrop] + a [CourseProgressStrip] that
/// always renders, regardless of state — unlike [CoursePosterCard] there is
/// no completed-badge/locked-scrim split) beside a title/instructor body and
/// a meta row (play glyph, [resumeLabel] or the completion percentage,
/// `completed/lessons`). [loading] swaps the whole card for a skeleton.
/// [interactive] (default `true`) mirrors [CoursePosterCard]'s contract.
class CourseWideCard extends StatefulWidget {
  const CourseWideCard({
    required this.course,
    this.state = CourseCardState.auto,
    this.resumeLabel,
    this.loading = false,
    this.interactive = true,
    this.onTap,
    super.key,
  });

  final CourseCardData course;
  final CourseCardState state;

  /// Translated resume label from the caller (e.g. "Resume 2:05"). Falls
  /// back to the completion percentage when omitted — this widget never
  /// bakes a user-visible string itself, mirroring the web contract.
  final String? resumeLabel;
  final bool loading;
  final bool interactive;

  /// Fires with [course] on activation when [interactive] is true; ignored
  /// otherwise.
  final ValueChanged<CourseCardData>? onTap;

  @override
  State<CourseWideCard> createState() => _CourseWideCardState();
}

class _CourseWideCardState extends State<CourseWideCard> {
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
    final AppSemanticColors sem = context.semanticColors;
    final int pct = courseCardPercent(widget.course, widget.state);
    final String metaLabel = widget.resumeLabel ?? '$pct%';

    List<BoxShadow>? shadow;
    Color background = Colors.transparent;
    if (widget.interactive) {
      if (_focused) {
        shadow = context.shadows.focus;
      } else if (_hovered) {
        shadow = context.shadows.sm;
        background = sem.raised;
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
    final TextStyle metaStyle = (theme.textTheme.bodySmall ?? const TextStyle())
        .copyWith(fontSize: AppFontSize.sm, color: cs.onSurfaceVariant);
    final TextStyle countStyle = metaStyle.copyWith(
      fontFamily: AppTypography.code.fontFamily,
    );

    final Widget thumb = ClipRRect(
      borderRadius: BorderRadius.circular(AppRadius.md),
      child: SizedBox(
        width: _Thumb.size,
        height: _Thumb.size,
        child: Stack(
          fit: StackFit.expand,
          children: <Widget>[
            CourseCoverBackdrop(
              course: widget.course,
              initialsFontSize: AppFontSize.lg,
            ),
            Positioned(
              left: 0,
              right: 0,
              bottom: 0,
              height: CourseProgressStrip.height,
              child: CourseProgressStrip(pct: pct),
            ),
          ],
        ),
      ),
    );

    final Widget body = Expanded(
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
          Padding(
            padding: const EdgeInsets.only(top: 4),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: <Widget>[
                IconCS(
                  name: IconName.play,
                  fill: true,
                  size: _Thumb.metaIconSize,
                  color: cs.primary,
                ),
                const SizedBox(width: 4),
                Text(metaLabel, style: metaStyle),
                Text(' · ', style: metaStyle.copyWith(color: sem.textTertiary)),
                Text(
                  '${widget.course.completed}/${widget.course.lessons}',
                  style: countStyle,
                ),
              ],
            ),
          ),
        ],
      ),
    );

    Widget card = DecoratedBox(
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(AppRadius.md),
        boxShadow: shadow,
      ),
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.s2),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            thumb,
            const SizedBox(width: AppSpacing.s3),
            body,
          ],
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
      child: Padding(
        padding: EdgeInsets.all(AppSpacing.s2),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            AppSkeleton(
              width: _Thumb.size,
              height: _Thumb.size,
              radius: AppSkeletonRadius.md,
            ),
            SizedBox(width: AppSpacing.s3),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: <Widget>[
                  AppSkeleton(
                    width: 200,
                    height: AppFontSize.base,
                    radius: AppSkeletonRadius.sm,
                  ),
                  Padding(
                    padding: EdgeInsets.only(top: 6),
                    child: AppSkeleton(
                      width: 140,
                      height: AppFontSize.sm,
                      radius: AppSkeletonRadius.sm,
                    ),
                  ),
                  Padding(
                    padding: EdgeInsets.only(top: 8),
                    child: AppSkeleton(
                      width: 100,
                      height: AppFontSize.xs,
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

/// Thumb geometry/icon size — a locally-owned micro-scale mirroring the web
/// `.app-course-wide-card__thumb`/`__meta-icon` SCSS block (80px square, 12px
/// meta glyph), both hard-coded there too.
abstract final class _Thumb {
  static const double size = 80;
  static const double metaIconSize = 12;
}
