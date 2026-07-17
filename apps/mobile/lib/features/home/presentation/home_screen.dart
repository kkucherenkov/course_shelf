import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import 'package:app_mobile/app/routes.dart';
import 'package:app_mobile/features/home/domain/home_summary.dart';
import 'package:app_mobile/features/home/presentation/bloc/home_cubit.dart';
import 'package:app_mobile/features/home/presentation/bloc/home_state.dart';
import 'package:app_mobile/features/home/presentation/course_accent.dart';
import 'package:app_mobile/i18n/strings.g.dart';

/// The Home tab — E18-F01-S01.
///
/// Two horizontal carousels (Continue watching, Recently added) plus quick
/// links, driven by [HomeCubit]. Mirrors web Home in a mobile idiom; web's
/// Recently-completed and Your-week sections are a deliberate trim per the
/// card, not an oversight.
///
/// Intrinsically sized on purpose: [AppNavigationShell] hands each tab body a
/// `SliverToBoxAdapter` slot inside its own `CustomScrollView`, so this is a
/// [Column] and every carousel is a fixed-height [SizedBox] around a horizontal
/// `ListView`. A bare vertical `ListView` here would have no bounded height and
/// would throw.
///
/// Pull-to-refresh is deliberately absent from this widget: the shell owns the
/// scrollable, so a `RefreshIndicator` here would be wrapping its own
/// ancestor's scrollable and do nothing. `MainShell` wires
/// `AppNavigationTab.onRefresh` to [HomeCubit.refresh] instead.
class HomeTabBody extends StatelessWidget {
  const HomeTabBody({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<HomeCubit, HomeState>(
      builder: (BuildContext context, HomeState state) {
        return Padding(
          padding: const EdgeInsets.only(bottom: AppSpacing.s8),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            mainAxisSize: MainAxisSize.min,
            children: <Widget>[
              ..._buildContent(context, state),
              _QuickLinks(summary: state.summary),
            ],
          ),
        );
      },
    );
  }

  List<Widget> _buildContent(BuildContext context, HomeState state) {
    final t = context.t.home;

    switch (state.status) {
      case HomeStatus.loading:
        return const <Widget>[_LoadingSkeleton()];

      case HomeStatus.failed:
        return <Widget>[
          Padding(
            padding: const EdgeInsets.symmetric(vertical: AppSpacing.s8),
            child: AppErrorState(
              title: t.error.title,
              message: t.error.message,
              action: AppButton(
                key: const ValueKey<String>('homeRetry'),
                label: context.t.common.retry,
                variant: AppButtonVariant.secondary,
                iconLeading: IconName.refresh,
                onPressed: () => context.read<HomeCubit>().refresh(),
              ),
            ),
          ),
        ];

      case HomeStatus.empty:
        return <Widget>[
          Padding(
            padding: const EdgeInsets.symmetric(vertical: AppSpacing.s8),
            child: AppEmptyState(
              icon: IconName.home,
              title: t.empty.title,
              message: t.empty.message,
            ),
          ),
        ];

      case HomeStatus.loaded:
        final summary = state.summary!;
        return <Widget>[
          // An empty row is dropped whole — header included. Web shows a
          // per-row empty panel, but it has a desktop column to spend on one;
          // here a lone "nothing yet" card between two live carousels costs
          // more vertical room than it earns. Both rows empty is Empty, and
          // never reaches this branch.
          if (summary.continueWatching.isNotEmpty)
            _ContinueWatchingRow(courses: summary.continueWatching),
          if (summary.recentlyAdded.isNotEmpty)
            _RecentlyAddedRow(courses: summary.recentlyAdded),
        ];
    }
  }
}

/// Row heading. Not [AppSectionHeader] — that one is the lesson-list section
/// header (index, lesson count, duration, collapse toggle), a different thing
/// that happens to share the name.
class _RowHeading extends StatelessWidget {
  const _RowHeading(this.label);

  final String label;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(
        AppSpacing.s4,
        AppSpacing.s5,
        AppSpacing.s4,
        AppSpacing.s3,
      ),
      child: Text(
        label,
        // Derived from the theme, never a bare AppTextStyles.* — a raw style
        // carries no font family and falls through to the platform font.
        style: Theme.of(context).textTheme.titleMedium?.copyWith(
              fontWeight: AppFontWeight.semibold,
            ),
      ),
    );
  }
}

/// Fixed-height horizontal carousel — the only shape a tab body can scroll in.
class _Carousel extends StatelessWidget {
  const _Carousel({
    required this.height,
    required this.itemWidth,
    required this.itemCount,
    required this.itemBuilder,
  });

  final double height;
  final double itemWidth;
  final int itemCount;
  final Widget Function(BuildContext context, int index) itemBuilder;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: height,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.s4),
        itemCount: itemCount,
        separatorBuilder: (_, _) => const SizedBox(width: AppSpacing.s3),
        itemBuilder: (BuildContext context, int index) => SizedBox(
          width: itemWidth,
          child: itemBuilder(context, index),
        ),
      ),
    );
  }
}

/// Card geometry. The carousel needs a bounded height, and these are the
/// heights the cards actually render at the widths below (measured, not
/// guessed): the wide card is thumb-driven (80 + 2×s2 padding), the poster is
/// a 3:4 cover plus its title/meta band.
abstract final class _CardSize {
  // Design's `minWidth: 240` is a floor, not a fixed size — the wide card's
  // meta row (play glyph + percent + completed/total) overflows its slot by a
  // few px at exactly 240, and clears at ~248. 256 gives a small margin while
  // staying close to the reference.
  static const double wideWidth = 256;
  static const double wideHeight = 96;

  static const double posterWidth = 128;
  static const double posterHeight = 227;

  /// How many skeleton cards a loading row shows. Enough to reach the right
  /// edge of a phone and imply "more over there".
  static const int skeletonCount = 4;
}

class _ContinueWatchingRow extends StatelessWidget {
  const _ContinueWatchingRow({required this.courses});

  final List<ContinueWatchingCourse> courses;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      mainAxisSize: MainAxisSize.min,
      children: <Widget>[
        _RowHeading(context.t.home.continueWatching.heading),
        _Carousel(
          height: _CardSize.wideHeight,
          itemWidth: _CardSize.wideWidth,
          itemCount: courses.length,
          itemBuilder: (BuildContext context, int index) {
            final course = courses[index];
            return CourseWideCard(
              key: ValueKey<String>('homeContinue_${course.courseId}'),
              course: CourseCardData(
                id: course.courseId,
                title: course.courseTitle,
                // Web maps the same field to '' — the wire item carries no
                // instructor, and the card omits the line entirely when empty
                // rather than rendering a blank one.
                instructor: '',
                lessons: course.lessonsTotal,
                completed: course.lessonsCompleted,
                accent: accentFromId(course.courseId),
              ),
              onTap: (_) => Navigator.of(context).pushNamed(
                AppRoutes.lesson,
                arguments: course.lastSeenLessonId,
              ),
            );
          },
        ),
      ],
    );
  }
}

class _RecentlyAddedRow extends StatelessWidget {
  const _RecentlyAddedRow({required this.courses});

  final List<RecentlyAddedCourse> courses;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      mainAxisSize: MainAxisSize.min,
      children: <Widget>[
        _RowHeading(context.t.home.recentlyAdded.heading),
        _Carousel(
          height: _CardSize.posterHeight,
          itemWidth: _CardSize.posterWidth,
          itemCount: courses.length,
          itemBuilder: (BuildContext context, int index) {
            final course = courses[index];
            return CoursePosterCard(
              key: ValueKey<String>('homeRecent_${course.courseId}'),
              course: CourseCardData(
                id: course.courseId,
                title: course.courseTitle,
                instructor: '',
                lessons: course.lessonCount,
                completed: 0,
                accent: accentFromId(course.courseId),
              ),
              // Web opens /courses/{id} here. There is no course-detail route
              // in the mobile tree yet (AppRoutes has sign-in/sign-up/forgot/
              // lesson only), so the card is non-interactive rather than wired
              // to an invented destination. Whichever card adds course detail
              // gives this an onTap.
              interactive: false,
            );
          },
        ),
      ],
    );
  }
}

class _LoadingSkeleton extends StatelessWidget {
  const _LoadingSkeleton();

  @override
  Widget build(BuildContext context) {
    // Real cards in `loading` mode, not bespoke AppSkeleton boxes: the skeleton
    // then keeps the card's own geometry for free and cannot drift from it.
    const placeholder = CourseCardData(
      id: '',
      title: '',
      instructor: '',
      lessons: 0,
      completed: 0,
      accent: CourseAccent.neutral,
    );

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      mainAxisSize: MainAxisSize.min,
      children: <Widget>[
        _RowHeading(context.t.home.continueWatching.heading),
        _Carousel(
          height: _CardSize.wideHeight,
          itemWidth: _CardSize.wideWidth,
          itemCount: _CardSize.skeletonCount,
          itemBuilder: (_, _) =>
              const CourseWideCard(course: placeholder, loading: true),
        ),
        _RowHeading(context.t.home.recentlyAdded.heading),
        _Carousel(
          height: _CardSize.posterHeight,
          itemWidth: _CardSize.posterWidth,
          itemCount: _CardSize.skeletonCount,
          itemBuilder: (_, _) =>
              const CoursePosterCard(course: placeholder, loading: true),
        ),
      ],
    );
  }
}

/// Downloads · Library — the card's third section.
///
/// Rendered in every state so the row does not jump as Home resolves. Downloads
/// is local and always reachable; Library is disabled until a summary says
/// there is at least one library to open, which is the whole reason Home reads
/// `/libraries`.
class _QuickLinks extends StatelessWidget {
  const _QuickLinks({required this.summary});

  final HomeSummary? summary;

  @override
  Widget build(BuildContext context) {
    final t = context.t.home.quickLinks;
    final hasLibraries = (summary?.libraryCount ?? 0) > 0;

    return Padding(
      padding: const EdgeInsets.fromLTRB(
        AppSpacing.s4,
        AppSpacing.s5,
        AppSpacing.s4,
        0,
      ),
      child: Row(
        children: <Widget>[
          Expanded(
            child: AppButton(
              key: const ValueKey<String>('homeQuickDownloads'),
              label: t.downloads,
              variant: AppButtonVariant.secondary,
              iconLeading: IconName.cloudDown,
              onPressed: () => HomeQuickLinks.of(context)?.openDownloads(),
            ),
          ),
          const SizedBox(width: AppSpacing.s3),
          Expanded(
            child: AppButton(
              key: const ValueKey<String>('homeQuickLibrary'),
              label: t.library,
              variant: AppButtonVariant.secondary,
              iconLeading: IconName.library,
              disabled: !hasLibraries,
              onPressed: () => HomeQuickLinks.of(context)?.openLibrary(),
            ),
          ),
        ],
      ),
    );
  }
}

/// How Home asks the shell to change tabs.
///
/// The quick links are cross-tab navigation, but the tabs are not routes — the
/// shell swaps them through an `IndexedStack` and owns `currentIndex`. Rather
/// than teach Home the shell's tab order, the shell publishes its two
/// destinations here and Home calls them by name.
class HomeQuickLinks extends InheritedWidget {
  const HomeQuickLinks({
    required this.openDownloads,
    required this.openLibrary,
    required super.child,
    super.key,
  });

  final VoidCallback openDownloads;
  final VoidCallback openLibrary;

  static HomeQuickLinks? of(BuildContext context) =>
      context.dependOnInheritedWidgetOfExactType<HomeQuickLinks>();

  @override
  bool updateShouldNotify(HomeQuickLinks oldWidget) =>
      openDownloads != oldWidget.openDownloads ||
      openLibrary != oldWidget.openLibrary;
}
