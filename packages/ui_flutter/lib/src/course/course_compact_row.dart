import 'package:flutter/material.dart';

import 'package:app_ui/src/course/course_card_data.dart';
import 'package:app_ui/src/progress/app_progress_linear.dart';
import 'package:app_ui/src/progress/app_skeleton.dart';
import 'package:app_ui/src/theme/app_theme.dart';
import 'package:app_ui/src/theme/tokens.g.dart';

/// The brand compact list row — Flutter twin of the web `CourseCompactRow`.
///
/// A bare accent-colour thumb (no glyph — unlike [CoursePosterCard]/
/// [CourseWideCard], this row has no `CourseCoverBackdrop`), a single-line
/// title, a fixed-width `AppProgressLinear` bar, and a trailing percentage
/// label. Always a focusable, tappable button (the web component has no
/// `interactive` prop to opt out of): tap/Enter/Space fire [onTap] with
/// [course]. [loading] swaps the row for a skeleton.
class CourseCompactRow extends StatefulWidget {
  const CourseCompactRow({
    required this.course,
    this.state = CourseCardState.auto,
    this.loading = false,
    this.onTap,
    super.key,
  });

  final CourseCardData course;
  final CourseCardState state;
  final bool loading;
  final ValueChanged<CourseCardData>? onTap;

  @override
  State<CourseCompactRow> createState() => _CourseCompactRowState();
}

class _CourseCompactRowState extends State<CourseCompactRow> {
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
    final Color thumbColor =
        widget.course.cover ?? courseAccentColor(widget.course.accent);

    final TextStyle titleStyle =
        (theme.textTheme.bodyMedium ?? const TextStyle()).copyWith(
          fontSize: AppFontSize.sm,
          fontWeight: AppFontWeight.medium,
          color: cs.onSurface,
          height: AppLeading.snug,
        );
    final TextStyle pctStyle = (theme.textTheme.bodySmall ?? const TextStyle())
        .copyWith(
          fontFamily: AppTypography.code.fontFamily,
          fontSize: AppFontSize.xs,
          color: cs.onSurfaceVariant,
        );

    final Widget row = Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.s2,
        vertical: AppSpacing.s1,
      ),
      decoration: BoxDecoration(
        color: _hovered ? sem.raised : Colors.transparent,
        borderRadius: BorderRadius.circular(AppRadius.sm),
        boxShadow: _focused ? context.shadows.focus : null,
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: <Widget>[
          Container(
            width: _Thumb.size,
            height: _Thumb.size,
            decoration: BoxDecoration(
              color: thumbColor,
              borderRadius: BorderRadius.circular(AppRadius.sm),
            ),
          ),
          const SizedBox(width: AppSpacing.s2),
          Expanded(
            child: Text(
              widget.course.title,
              style: titleStyle,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          const SizedBox(width: AppSpacing.s2),
          SizedBox(
            width: _Bar.width,
            child: AppProgressLinear(value: pct.toDouble(), thin: true),
          ),
          const SizedBox(width: AppSpacing.s2),
          SizedBox(
            width: _Bar.pctLabelWidth,
            child: Text('$pct%', style: pctStyle, textAlign: TextAlign.right),
          ),
        ],
      ),
    );

    return Material(
      color: Colors.transparent,
      borderRadius: BorderRadius.circular(AppRadius.sm),
      child: InkWell(
        onTap: () => widget.onTap?.call(widget.course),
        onHover: _setHovered,
        onFocusChange: _setFocused,
        borderRadius: BorderRadius.circular(AppRadius.sm),
        overlayColor: const WidgetStatePropertyAll<Color>(Colors.transparent),
        splashFactory: NoSplash.splashFactory,
        focusColor: Colors.transparent,
        child: Semantics(button: true, label: widget.course.title, child: row),
      ),
    );
  }

  Widget _buildSkeleton() {
    return const ExcludeSemantics(
      child: Padding(
        padding: EdgeInsets.symmetric(
          horizontal: AppSpacing.s2,
          vertical: AppSpacing.s1,
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: <Widget>[
            AppSkeleton(
              width: _Thumb.size,
              height: _Thumb.size,
              radius: AppSkeletonRadius.sm,
            ),
            SizedBox(width: AppSpacing.s2),
            Expanded(
              child: AppSkeleton(
                width: 120,
                height: AppFontSize.sm,
                radius: AppSkeletonRadius.sm,
              ),
            ),
            SizedBox(width: AppSpacing.s2),
            AppSkeleton(
              width: 48,
              height: AppFontSize.xs,
              radius: AppSkeletonRadius.sm,
            ),
          ],
        ),
      ),
    );
  }
}

/// Thumb/bar geometry — a locally-owned micro-scale mirroring the web
/// `.app-course-compact-row__thumb`/`__bar`/`__pct` SCSS block (32px thumb, 64px
/// bar, 32px pct column), all hard-coded there too.
abstract final class _Thumb {
  static const double size = 32;
}

abstract final class _Bar {
  static const double width = 64;
  static const double pctLabelWidth = 32;
}
