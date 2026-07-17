import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import 'package:app_mobile/app/routes.dart';
import 'package:app_mobile/features/course_detail/domain/course_detail.dart';
import 'package:app_mobile/features/course_detail/presentation/bloc/course_detail_cubit.dart';
import 'package:app_mobile/features/course_detail/presentation/bloc/course_detail_state.dart';
import 'package:app_mobile/features/course_detail/presentation/download_size_formatter.dart';
import 'package:app_mobile/features/home/presentation/course_accent.dart';
import 'package:app_mobile/i18n/strings.g.dart';
import 'package:app_mobile/shared/di/injector.dart';

/// The Course-detail screen — E18-F01-S03.
///
/// A pushed full-screen route (NOT a tab body): collapsing cover hero,
/// Resume/Start + Download-course CTAs, and the curriculum with per-lesson
/// watch state. `courseId` arrives via
/// `Navigator.pushNamed(AppRoutes.course, arguments:)`.
///
/// **Scope note (E19 seam).** The download half of this card is gated on
/// E19's `DownloadsBloc`, which does not exist yet: every [AppLessonRow]
/// below renders `downloadState: null` (no per-lesson download affordance),
/// and the secondary "Download course · `<size>`" CTA — real size, from this
/// card's own download-estimate endpoint — shows a "coming soon" snackbar
/// instead of enqueuing anything.
class CourseDetailScreen extends StatelessWidget {
  const CourseDetailScreen({required this.courseId, super.key});

  final String courseId;

  @override
  Widget build(BuildContext context) {
    return BlocProvider<CourseDetailCubit>(
      create: (_) => getIt<CourseDetailCubit>()..load(courseId),
      child: const CourseDetailView(),
    );
  }
}

/// The screen's view, split from [CourseDetailScreen] so a test can mount it
/// against its own `BlocProvider` without get_it (mirrors
/// `LessonPlayerScreen`/`LessonPlayerView`).
class CourseDetailView extends StatefulWidget {
  const CourseDetailView({super.key});

  @override
  State<CourseDetailView> createState() => _CourseDetailViewState();
}

class _CourseDetailViewState extends State<CourseDetailView> {
  /// Curriculum sections start expanded; collapsing one adds its id here.
  /// Local, presentation-only state — the cubit has no opinion on it.
  final Set<String> _collapsedSectionIds = <String>{};

  void _toggleSection(String sectionId) {
    setState(() {
      if (!_collapsedSectionIds.remove(sectionId)) {
        _collapsedSectionIds.add(sectionId);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<CourseDetailCubit, CourseDetailState>(
      builder: (BuildContext context, CourseDetailState state) {
        switch (state.status) {
          case CourseDetailStatus.loading:
            return const _SimpleScaffold(body: _LoadingBody());
          case CourseDetailStatus.noAccess:
            return const _SimpleScaffold(body: _NoAccessBody());
          case CourseDetailStatus.failed:
            return const _SimpleScaffold(body: _FailedBody());
          case CourseDetailStatus.loaded:
            return _LoadedScaffold(
              detail: state.detail!,
              collapsedSectionIds: _collapsedSectionIds,
              onToggleSection: _toggleSection,
            );
        }
      },
    );
  }
}

/// Shared chrome for the three non-loaded states: a plain [AppBar] with just
/// a back button — there is no course data yet to build the rich collapsing
/// hero from.
class _SimpleScaffold extends StatelessWidget {
  const _SimpleScaffold({required this.body});

  final Widget body;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: AppIconButton(
          name: IconName.chevronLeft,
          semanticLabel: context.t.courseDetail.back,
          variant: AppButtonVariant.ghost,
          onPressed: () => Navigator.of(context).maybePop(),
        ),
      ),
      body: Center(child: body),
    );
  }
}

class _LoadingBody extends StatelessWidget {
  const _LoadingBody();

  @override
  Widget build(BuildContext context) {
    return AppSpinner(
      size: AppSpinnerSize.lg,
      semanticLabel: context.t.common.loading,
    );
  }
}

class _FailedBody extends StatelessWidget {
  const _FailedBody();

  @override
  Widget build(BuildContext context) {
    final t = context.t.courseDetail.error;
    return AppErrorState(
      title: t.title,
      message: t.message,
      action: AppButton(
        key: const ValueKey<String>('courseDetailRetry'),
        label: context.t.common.retry,
        variant: AppButtonVariant.secondary,
        iconLeading: IconName.refresh,
        onPressed: () => context.read<CourseDetailCubit>().retry(),
      ),
    );
  }
}

class _NoAccessBody extends StatelessWidget {
  const _NoAccessBody();

  @override
  Widget build(BuildContext context) {
    final t = context.t.courseDetail.noAccess;
    return AppNoPermission(
      title: t.title,
      message: t.message,
      // A disabled seam, not a dead control masquerading as live: there is no
      // enrollment flow yet, so this only communicates the affordance exists.
      action: AppButton(
        key: const ValueKey<String>('courseDetailEnrollSeam'),
        label: context.t.courseDetail.primary.enroll,
        iconLeading: IconName.lock,
        disabled: true,
        onPressed: null,
      ),
    );
  }
}

/// The rich, loaded render: collapsing cover hero + progress + CTAs +
/// curriculum, all inside one [CustomScrollView] this screen owns.
class _LoadedScaffold extends StatelessWidget {
  const _LoadedScaffold({
    required this.detail,
    required this.collapsedSectionIds,
    required this.onToggleSection,
  });

  final CourseDetail detail;
  final Set<String> collapsedSectionIds;
  final ValueChanged<String> onToggleSection;

  static const double _heroHeight = 200;

  @override
  Widget build(BuildContext context) {
    final _PrimaryCta primary = _resolvePrimaryCta(context, detail);

    return Scaffold(
      body: CustomScrollView(
        slivers: <Widget>[
          _CourseHeroAppBar(summary: detail.summary, height: _heroHeight),
          SliverToBoxAdapter(child: _ProgressRow(summary: detail.summary)),
          SliverToBoxAdapter(
            child: _CtaColumn(primary: primary, estimate: detail.estimate),
          ),
          const SliverToBoxAdapter(child: Divider(height: 1)),
          SliverPadding(
            padding: const EdgeInsets.symmetric(vertical: AppSpacing.s2),
            sliver: SliverList(
              delegate: SliverChildListDelegate(<Widget>[
                for (final CourseDetailSection section in detail.sections)
                  _SectionBlock(
                    section: section,
                    open: !collapsedSectionIds.contains(section.id),
                    onToggle: () => onToggleSection(section.id),
                    currentLessonId: primary.targetLessonId,
                  ),
              ]),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Hero ─────────────────────────────────────────────────────────────────

class _CourseHeroAppBar extends StatelessWidget {
  const _CourseHeroAppBar({required this.summary, required this.height});

  final CourseDetailSummary summary;
  final double height;

  @override
  Widget build(BuildContext context) {
    final CourseAccent accent = accentFromId(summary.id);
    final Color background = courseAccentColor(accent);
    final CourseCardData cover = CourseCardData(
      id: summary.id,
      title: summary.title,
      instructor: summary.instructor ?? '',
      lessons: summary.lessonsTotal,
      completed: summary.lessonsCompleted,
      accent: accent,
    );

    return SliverAppBar(
      expandedHeight: height,
      pinned: true,
      backgroundColor: background,
      automaticallyImplyLeading: false,
      leading: Padding(
        padding: const EdgeInsets.all(AppSpacing.s2),
        child: _HeroIconButton(
          key: const ValueKey<String>('courseDetailBack'),
          icon: IconName.chevronLeft,
          semanticLabel: context.t.courseDetail.back,
          onTap: () => Navigator.of(context).maybePop(),
        ),
      ),
      actions: <Widget>[
        Padding(
          padding: const EdgeInsets.all(AppSpacing.s2),
          child: _HeroIconButton(
            key: const ValueKey<String>('courseDetailMore'),
            icon: IconName.more,
            semanticLabel: context.t.courseDetail.more,
            onTap: () => _showComingSoonSnackBar(context),
          ),
        ),
      ],
      flexibleSpace: FlexibleSpaceBar(
        background: Stack(
          fit: StackFit.expand,
          children: <Widget>[
            CourseCoverBackdrop(
              course: cover,
              initialsFontSize: AppFontSize.s5xl,
            ),
            Positioned(
              left: AppSpacing.s4,
              right: AppSpacing.s4,
              bottom: AppSpacing.s4,
              child: _HeroCaption(summary: summary),
            ),
          ],
        ),
      ),
    );
  }
}

class _HeroCaption extends StatelessWidget {
  const _HeroCaption({required this.summary});

  final CourseDetailSummary summary;

  @override
  Widget build(BuildContext context) {
    final String? librarySlug = summary.librarySlug;
    final String? instructor = summary.instructor;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: <Widget>[
        if (librarySlug != null && librarySlug.isNotEmpty)
          Text(
            librarySlug,
            style: TextStyle(
              fontFamily: AppTypography.code.fontFamily,
              fontSize: AppFontSize.xs,
              color: Colors.white70,
              letterSpacing: AppTracking.wide * AppFontSize.xs,
            ),
          ),
        Text(
          summary.title,
          key: const ValueKey<String>('courseDetailTitle'),
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(
            fontSize: AppFontSize.lg,
            fontWeight: AppFontWeight.semibold,
            color: Colors.white,
            height: 1.2,
          ),
        ),
        if (instructor != null && instructor.isNotEmpty)
          Padding(
            padding: const EdgeInsets.only(top: 2),
            child: Text(
              instructor,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                fontSize: AppFontSize.sm,
                color: Colors.white70,
              ),
            ),
          ),
      ],
    );
  }
}

/// Circular translucent control sitting over the cover art — the back/more
/// buttons. Not [AppIconButton]: that component's variants are all
/// theme-surface colours, but this sits on an arbitrary accent photo and
/// needs a fixed translucent-black chip to stay legible on every accent.
class _HeroIconButton extends StatelessWidget {
  const _HeroIconButton({
    required this.icon,
    required this.semanticLabel,
    required this.onTap,
    super.key,
  });

  final IconName icon;
  final String semanticLabel;
  final VoidCallback onTap;

  static const double _size = 32;

  @override
  Widget build(BuildContext context) {
    // IconCS is painted centred over the InkWell rather than threaded through
    // its child, so the ripple fills the full circle instead of just the
    // glyph's bounding box.
    return Stack(
      alignment: Alignment.center,
      children: <Widget>[
        Semantics(
          button: true,
          label: semanticLabel,
          excludeSemantics: true,
          child: Material(
            color: Colors.black.withValues(alpha: 0.45),
            shape: const CircleBorder(),
            child: InkWell(
              customBorder: const CircleBorder(),
              onTap: onTap,
              child: const SizedBox(width: _size, height: _size),
            ),
          ),
        ),
        IgnorePointer(
          child: IconCS(name: icon, size: 18, color: Colors.white),
        ),
      ],
    );
  }
}

// ── Progress ─────────────────────────────────────────────────────────────

class _ProgressRow extends StatelessWidget {
  const _ProgressRow({required this.summary});

  final CourseDetailSummary summary;

  @override
  Widget build(BuildContext context) {
    final int percent = summary.progressPercent;
    final bool isComplete = percent >= 100;
    final ThemeData theme = Theme.of(context);
    final ColorScheme cs = theme.colorScheme;
    final AppSemanticColors sem = context.semanticColors;
    final t = context.t.courseDetail.progress;

    final TextStyle captionStyle =
        (theme.textTheme.bodySmall ?? const TextStyle()).copyWith(
          fontSize: AppFontSize.xs,
          color: cs.onSurfaceVariant,
        );

    return Padding(
      padding: const EdgeInsets.fromLTRB(
        AppSpacing.s4,
        AppSpacing.s3,
        AppSpacing.s4,
        AppSpacing.s2,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: <Widget>[
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: <Widget>[
              Text(
                isComplete
                    ? t.completed
                    : t.ofLessons(
                        completed: summary.lessonsCompleted,
                        total: summary.lessonsTotal,
                      ),
                style: captionStyle,
              ),
              Text(
                '$percent%',
                style: captionStyle.copyWith(
                  fontFamily: AppTypography.code.fontFamily,
                  color: isComplete ? sem.successFg : cs.onSurfaceVariant,
                  fontFeatures: const <FontFeature>[
                    FontFeature.tabularFigures(),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.s2),
          AppProgressLinear(value: percent.toDouble()),
        ],
      ),
    );
  }
}

// ── CTAs ─────────────────────────────────────────────────────────────────

class _CtaColumn extends StatelessWidget {
  const _CtaColumn({required this.primary, required this.estimate});

  final _PrimaryCta primary;
  final CourseDownloadEstimate? estimate;

  @override
  Widget build(BuildContext context) {
    final t = context.t.courseDetail;
    final CourseDownloadEstimate? est = estimate;
    final String downloadLabel = est == null
        ? t.download.cta
        : t.download.ctaWithSize(size: formatDownloadBytes(est.totalBytes));

    return Padding(
      padding: const EdgeInsets.fromLTRB(
        AppSpacing.s4,
        AppSpacing.s2,
        AppSpacing.s4,
        AppSpacing.s4,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: <Widget>[
          AppButton(
            key: const ValueKey<String>('courseDetailPrimaryCta'),
            label: primary.label,
            iconLeading: primary.icon,
            block: true,
            disabled: primary.targetLessonId == null,
            onPressed: primary.targetLessonId == null
                ? null
                : () => Navigator.of(context).pushNamed(
                    AppRoutes.lesson,
                    arguments: primary.targetLessonId,
                  ),
          ),
          const SizedBox(height: AppSpacing.s2),
          AppButton(
            key: const ValueKey<String>('courseDetailDownloadCta'),
            label: downloadLabel,
            variant: AppButtonVariant.secondary,
            iconLeading: IconName.cloudDown,
            block: true,
            // TODO(E19): enqueue full-course download once DownloadsBloc lands.
            onPressed: () => _showComingSoonSnackBar(context),
          ),
          if (primary.resumeNote != null) ...<Widget>[
            const SizedBox(height: AppSpacing.s2),
            Row(
              children: <Widget>[
                IconCS(
                  name: IconName.cornerDownRight,
                  size: 12,
                  color: context.semanticColors.textTertiary,
                ),
                const SizedBox(width: AppSpacing.s2),
                Expanded(
                  child: Text(
                    t.upNext(note: primary.resumeNote!),
                    key: const ValueKey<String>('courseDetailResumeNote'),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style:
                        (Theme.of(context).textTheme.bodySmall ??
                                const TextStyle())
                            .copyWith(
                              fontSize: AppFontSize.xs,
                              color: Theme.of(
                                context,
                              ).colorScheme.onSurfaceVariant,
                            ),
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}

void _showComingSoonSnackBar(BuildContext context) {
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(
      content: Text(context.t.common.comingSoon),
      behavior: SnackBarBehavior.floating,
    ),
  );
}

// ── Curriculum ───────────────────────────────────────────────────────────

class _SectionBlock extends StatelessWidget {
  const _SectionBlock({
    required this.section,
    required this.open,
    required this.onToggle,
    required this.currentLessonId,
  });

  final CourseDetailSection section;
  final bool open;
  final VoidCallback onToggle;
  final String? currentLessonId;

  @override
  Widget build(BuildContext context) {
    final t = context.t.courseDetail.curriculum;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: <Widget>[
        AppSectionHeader(
          idx: section.position,
          title: section.title,
          count: section.lessons.length,
          duration: Duration(seconds: section.totalDurationSeconds),
          open: open,
          onToggle: onToggle,
          sectionLabel: t.section,
          lessonLabel: t.lesson,
          lessonsLabel: t.lessons,
        ),
        if (open)
          for (final CourseDetailLesson lesson in section.lessons)
            AppLessonRow(
              key: ValueKey<String>('courseDetailLesson_${lesson.id}'),
              num: lesson.position,
              title: lesson.title,
              duration: Duration(seconds: lesson.durationSeconds),
              state: _rowState(lesson.state),
              materials: lesson.hasMaterials,
              current:
                  lesson.id == currentLessonId &&
                  lesson.state == CourseDetailLessonState.inProgress,
              progress: lesson.progressPercent.toDouble(),
              // TODO(E19): per-lesson download state + tap-to-enqueue once
              // DownloadsBloc lands.
              downloadState: null,
              onDownload: null,
              onTap: () => Navigator.of(
                context,
              ).pushNamed(AppRoutes.lesson, arguments: lesson.id),
            ),
      ],
    );
  }

  LessonRowState _rowState(CourseDetailLessonState state) => switch (state) {
    CourseDetailLessonState.inProgress => LessonRowState.inProgress,
    CourseDetailLessonState.completed => LessonRowState.completed,
    CourseDetailLessonState.locked => LessonRowState.locked,
    CourseDetailLessonState.notStarted => LessonRowState.notStarted,
  };
}

// ── Primary CTA derivation ──────────────────────────────────────────────

/// The resolved primary CTA: label + icon + which lesson tapping it opens.
/// [targetLessonId] is `null` only for a course with zero lessons, which
/// disables the button rather than navigating nowhere.
class _PrimaryCta {
  const _PrimaryCta({
    required this.label,
    required this.icon,
    required this.targetLessonId,
    required this.resumeNote,
  });

  final String label;
  final IconName icon;
  final String? targetLessonId;

  /// `'{Section title} · {Lesson title}'` — only set when this is a "Resume"
  /// CTA. Untranslated data; the widget wraps it with `courseDetail.upNext`.
  final String? resumeNote;
}

/// Derives the primary CTA from progress (E18-F01-S03):
/// - `percent == 0` -> Start course, target = first lesson.
/// - `0 < percent < 100` -> Resume, target = first in-progress lesson, else
///   first not-started lesson.
/// - `percent == 100` -> Watch again, target = first lesson.
_PrimaryCta _resolvePrimaryCta(BuildContext context, CourseDetail detail) {
  final t = context.t.courseDetail.primary;
  final List<CourseDetailLesson> flat = <CourseDetailLesson>[
    for (final CourseDetailSection section in detail.sections)
      ...section.lessons,
  ];

  if (flat.isEmpty) {
    return _PrimaryCta(
      label: t.start,
      icon: IconName.play,
      targetLessonId: null,
      resumeNote: null,
    );
  }

  final int percent = detail.summary.progressPercent;

  if (percent >= 100) {
    return _PrimaryCta(
      label: t.watchAgain,
      icon: IconName.refresh,
      targetLessonId: flat.first.id,
      resumeNote: null,
    );
  }

  if (percent <= 0) {
    return _PrimaryCta(
      label: t.start,
      icon: IconName.play,
      targetLessonId: flat.first.id,
      resumeNote: null,
    );
  }

  final CourseDetailLesson target =
      _firstMatching(flat, CourseDetailLessonState.inProgress) ??
      _firstMatching(flat, CourseDetailLessonState.notStarted) ??
      flat.first;
  final CourseDetailSection? owningSection = _sectionOf(
    detail.sections,
    target.id,
  );

  return _PrimaryCta(
    label: t.resume,
    icon: IconName.play,
    targetLessonId: target.id,
    resumeNote: owningSection == null
        ? null
        : '${owningSection.title} · ${target.title}',
  );
}

CourseDetailLesson? _firstMatching(
  List<CourseDetailLesson> lessons,
  CourseDetailLessonState state,
) {
  for (final CourseDetailLesson lesson in lessons) {
    if (lesson.state == state) return lesson;
  }
  return null;
}

CourseDetailSection? _sectionOf(
  List<CourseDetailSection> sections,
  String lessonId,
) {
  for (final CourseDetailSection section in sections) {
    for (final CourseDetailLesson lesson in section.lessons) {
      if (lesson.id == lessonId) return section;
    }
  }
  return null;
}
