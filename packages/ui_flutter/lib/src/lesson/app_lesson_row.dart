import 'package:flutter/material.dart';

import 'package:app_ui/src/containers/app_row.dart';
import 'package:app_ui/src/icons/icon_cs.dart';
import 'package:app_ui/src/icons/icon_name.dart';
import 'package:app_ui/src/lesson/lesson_download_state.dart';
import 'package:app_ui/src/lesson/lesson_row_state.dart';
import 'package:app_ui/src/progress/app_progress_linear.dart';
import 'package:app_ui/src/progress/app_skeleton.dart';
import 'package:app_ui/src/progress/app_spinner.dart';
import 'package:app_ui/src/theme/app_theme.dart';
import 'package:app_ui/src/theme/tokens.g.dart';

/// A single lesson row inside a course's curriculum list — Flutter twin of
/// the web `AppLessonRow`, plus the mobile-only download affordance
/// (`docs/roadmap/tasks/E17-F02-S02.md`).
///
/// COMPOSITE: built from [AppRow] (layout/interactivity), [IconCS] (leading
/// state icon + trailing materials/download glyphs), [AppProgressLinear]
/// (in-progress underline) and [AppSkeleton] (the `loading` variant) —
/// none of their behaviour is reimplemented here.
///
/// Pure presentational: [state]/[current]/[progress]/[downloadState]/
/// [loading] flow in, [onTap] (row select) and [onDownload] (tapping the
/// `available` cloud-down icon) flow out. The feature layer decides what a
/// tap means (navigate to the player, enqueue a download, etc.) — this
/// widget never calls a repository or bloc directly.
///
/// State → leading icon (mirrors the web `iconName`/`iconState` computeds
/// exactly, including the edge case where [current] wins the *colour* even
/// when [state] is `completed` — the web sets `iconState = current ? '
/// current' : state` independently of the *icon shape*, which still prefers
/// `completed`'s check-circle):
/// - `completed` → check-circle, success colour
/// - `current` → play, accent colour (overrides the state colour above)
/// - `locked` → lock, tertiary colour
/// - otherwise → circle, secondary colour
///
/// [current] also paints the row with [AppRow]'s accent-soft `selected`
/// fill — the web's "no side-stripe" treatment for the actively-viewed
/// lesson.
///
/// [loading] swaps the entire row for a skeleton placeholder (mirrors the
/// web's `v-if="loading"` template swap) — every other prop is ignored.
///
/// [state] `locked` disables [AppRow]'s `interactive` mode entirely (no
/// tap, no focus, no hover/ripple) — the Flutter equivalent of the web's
/// `tabindex="-1"` + `aria-disabled="true"` + early-return in `onActivate`.
///
/// [downloadState] is mobile-only — the production web component has no
/// such prop (see [LessonDownloadState]). `null` omits the trailing
/// download icon entirely.
class AppLessonRow extends StatelessWidget {
  const AppLessonRow({
    required this.num,
    required this.title,
    required this.duration,
    this.state = LessonRowState.notStarted,
    this.materials = false,
    this.current = false,
    this.progress = 0,
    this.downloadState,
    this.loading = false,
    this.onTap,
    this.onDownload,
    super.key,
  });

  /// 1-based lesson number; padded to 2 digits in the leading column.
  final int num;

  /// Lesson title.
  final String title;

  /// Total lesson duration; shown mono-spaced (`H:MM:SS` / `M:SS`) in the
  /// trailing column. The web twin takes `duration: number` (seconds) — a
  /// [Duration] is the idiomatic Dart substitution; the feature layer wraps
  /// its wire-format `durationSeconds` (see `LessonOutlineItem`) with
  /// `Duration(seconds: ...)`.
  final Duration duration;

  /// Lesson state — drives the leading icon and styling.
  final LessonRowState state;

  /// Renders a small PDF icon in the trailing area when true.
  final bool materials;

  /// Highlights the row as the active lesson (accent-soft fill via
  /// [AppRow.selected]; no left side-stripe — mirrors the web's explicit
  /// anti-side-stripe comment).
  final bool current;

  /// 0..100; only rendered (as an [AppProgressLinear] underline) when
  /// [state] is [LessonRowState.inProgress] and `progress > 0`. Out-of-range
  /// values are clamped, mirroring the web's `Math.max(0, Math.min(100,
  /// Math.round(progress)))`.
  final double progress;

  /// Mobile-only download state; `null` omits the trailing download icon.
  final LessonDownloadState? downloadState;

  /// Skeleton variant — replaces the entire row when true.
  final bool loading;

  /// Fires when the row is tapped/activated; suppressed while [loading] or
  /// [state] is [LessonRowState.locked] (mirrors the web `onActivate` guard).
  final VoidCallback? onTap;

  /// Fires when the trailing cloud-down icon is tapped (only rendered/
  /// tappable when [downloadState] is [LessonDownloadState.available]).
  /// Enqueuing the download itself is the feature layer's job — this
  /// widget only reports the tap (`docs/roadmap/tasks/E17-F02-S02.md`
  /// acceptance: "intercepted by the feature layer, not the widget").
  final VoidCallback? onDownload;

  static const Key numKey = Key('appLessonRowNum');
  static const Key iconKey = Key('appLessonRowIcon');
  static const Key titleKey = Key('appLessonRowTitle');
  static const Key progressKey = Key('appLessonRowProgress');
  static const Key metaKey = Key('appLessonRowMeta');
  static const Key materialsKey = Key('appLessonRowMaterials');
  static const Key downloadKey = Key('appLessonRowDownload');
  static const Key durationKey = Key('appLessonRowDuration');

  /// Leading lesson-number column width — locally-owned, mirroring the web
  /// `$num-col-w: 24px` (itself flagged there as "exempt from the raw-px
  /// rule").
  static const double _numColumnWidth = 24;

  bool get _locked => state == LessonRowState.locked;

  bool get _showProgressBar =>
      state == LessonRowState.inProgress && progress > 0;

  int get _clampedProgress => progress.clamp(0, 100).round();

  IconName get _iconName {
    if (state == LessonRowState.completed) return IconName.checkCircle;
    if (current) return IconName.play;
    if (_locked) return IconName.lock;
    return IconName.circle;
  }

  Color _iconColor(ColorScheme cs, AppSemanticColors sem) {
    // Mirrors the web `iconState = current ? 'current' : state` computed:
    // `current` wins the *colour* unconditionally, independent of `state`.
    if (current) return cs.primary;
    switch (state) {
      case LessonRowState.completed:
        return sem.successFg;
      case LessonRowState.locked:
        return sem.textTertiary;
      case LessonRowState.notStarted:
      case LessonRowState.inProgress:
        return cs.onSurfaceVariant;
    }
  }

  String get _formattedDuration {
    final int totalSeconds = duration.inSeconds < 0 ? 0 : duration.inSeconds;
    final int hours = totalSeconds ~/ 3600;
    final int minutes = (totalSeconds % 3600) ~/ 60;
    final int secs = totalSeconds % 60;
    if (hours > 0) {
      return '$hours:${minutes.toString().padLeft(2, '0')}:'
          '${secs.toString().padLeft(2, '0')}';
    }
    return '$minutes:${secs.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    if (loading) return _buildLoading();

    final ThemeData theme = Theme.of(context);
    final ColorScheme cs = theme.colorScheme;
    final AppSemanticColors sem = context.semanticColors;

    return Semantics(
      enabled: !_locked,
      child: AppRow(
        leading: _buildLeading(theme, cs, sem),
        body: _buildBody(theme, cs),
        trailing: _buildTrailing(cs, sem),
        selected: current,
        interactive: !_locked,
        onTap: onTap,
      ),
    );
  }

  Widget _buildLeading(ThemeData theme, ColorScheme cs, AppSemanticColors sem) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: <Widget>[
        SizedBox(
          width: _numColumnWidth,
          child: Text(
            num.toString().padLeft(2, '0'),
            key: numKey,
            textAlign: TextAlign.right,
            style: _numStyle(theme, sem),
          ),
        ),
        const SizedBox(width: AppSpacing.s3),
        IconCS(
          key: iconKey,
          name: _iconName,
          size: 18,
          color: _iconColor(cs, sem),
        ),
      ],
    );
  }

  Widget _buildBody(ThemeData theme, ColorScheme cs) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: <Widget>[
        Text(
          title,
          key: titleKey,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: _titleStyle(theme, cs),
        ),
        if (_showProgressBar)
          Padding(
            padding: const EdgeInsets.only(top: AppSpacing.s1),
            child: AppProgressLinear(
              key: progressKey,
              value: _clampedProgress.toDouble(),
              thin: true,
            ),
          ),
        if (state == LessonRowState.inProgress)
          Padding(
            // Locally-owned 2px — mirrors the web's own literal
            // `.app-lesson-row__meta { margin-top: 2px; }`.
            padding: const EdgeInsets.only(top: 2),
            child: Text(
              '$_clampedProgress% watched',
              key: metaKey,
              style: _metaStyle(theme, cs),
            ),
          ),
      ],
    );
  }

  Widget _buildTrailing(ColorScheme cs, AppSemanticColors sem) {
    final Widget? downloadIcon = _buildDownloadIcon(cs, sem);
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: <Widget>[
        if (materials) ...<Widget>[
          IconCS(
            key: materialsKey,
            name: IconName.pdf,
            size: 14,
            color: cs.onSurfaceVariant,
            semanticLabel: 'Materials available',
          ),
          const SizedBox(width: AppSpacing.s2),
        ],
        if (downloadIcon != null) ...<Widget>[
          downloadIcon,
          const SizedBox(width: AppSpacing.s2),
        ],
        Text(_formattedDuration, key: durationKey),
      ],
    );
  }

  Widget? _buildDownloadIcon(ColorScheme cs, AppSemanticColors sem) {
    switch (downloadState) {
      case null:
        return null;
      case LessonDownloadState.downloaded:
        return IconCS(
          key: downloadKey,
          name: IconName.check,
          size: 14,
          color: sem.successFg,
          semanticLabel: 'Downloaded',
        );
      case LessonDownloadState.downloading:
        return SizedBox(
          key: downloadKey,
          width: 14,
          height: 14,
          child: Center(
            child: AppSpinner(
              size: AppSpinnerSize.sm,
              color: cs.primary,
              semanticLabel: 'Downloading',
            ),
          ),
        );
      case LessonDownloadState.available:
        return Semantics(
          key: downloadKey,
          button: true,
          label: 'Download lesson',
          child: GestureDetector(
            behavior: HitTestBehavior.opaque,
            onTap: onDownload,
            child: IconCS(
              name: IconName.cloudDown,
              size: 14,
              color: cs.onSurfaceVariant,
            ),
          ),
        );
      case LessonDownloadState.failed:
        return IconCS(
          key: downloadKey,
          name: IconName.alert,
          size: 14,
          color: cs.error,
          semanticLabel: 'Download failed',
        );
    }
  }

  Widget _buildLoading() {
    return Semantics(
      label: 'Loading lesson',
      child: const Padding(
        padding: EdgeInsets.all(AppSpacing.s3),
        child: Row(
          children: <Widget>[
            AppSkeleton(width: _numColumnWidth, height: 12),
            SizedBox(width: AppSpacing.s3),
            AppSkeleton(width: 18, height: 18, radius: AppSkeletonRadius.pill),
            SizedBox(width: AppSpacing.s3),
            Expanded(
              child: Align(
                alignment: Alignment.centerLeft,
                child: FractionallySizedBox(
                  widthFactor: 0.7,
                  child: AppSkeleton(height: 12),
                ),
              ),
            ),
            SizedBox(width: AppSpacing.s3),
            AppSkeleton(width: 40, height: 12),
          ],
        ),
      ),
    );
  }

  // The num column reuses AppRow's own established trailing-style recipe
  // (base off the theme's bodySmall, override family/size/colour, add
  // tabular figures) rather than inventing a second way to bind the
  // packaged mono face — see `AppRow`'s `trailingStyle` for the precedent.
  TextStyle _numStyle(ThemeData theme, AppSemanticColors sem) {
    return (theme.textTheme.bodySmall ?? const TextStyle()).copyWith(
      fontFamily: AppTypography.code.fontFamily,
      fontSize: AppFontSize.xs,
      color: sem.textTertiary,
      fontFeatures: const <FontFeature>[FontFeature.tabularFigures()],
    );
  }

  TextStyle _titleStyle(ThemeData theme, ColorScheme cs) {
    return (theme.textTheme.bodySmall ?? const TextStyle()).copyWith(
      fontSize: AppFontSize.sm,
      color: _locked ? cs.onSurfaceVariant : cs.onSurface,
    );
  }

  TextStyle _metaStyle(ThemeData theme, ColorScheme cs) {
    return (theme.textTheme.labelSmall ?? const TextStyle()).copyWith(
      fontSize: AppFontSize.xs,
      color: cs.onSurfaceVariant,
    );
  }
}
