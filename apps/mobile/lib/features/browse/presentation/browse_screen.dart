import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import 'package:app_mobile/app/routes.dart';
import 'package:app_mobile/features/browse/domain/browse_course.dart';
import 'package:app_mobile/features/browse/domain/browse_filter.dart';
import 'package:app_mobile/features/browse/presentation/bloc/browse_cubit.dart';
import 'package:app_mobile/features/browse/presentation/bloc/browse_state.dart';
import 'package:app_mobile/features/home/presentation/course_accent.dart';
import 'package:app_mobile/i18n/strings.g.dart';

/// The Browse tab — E18-F01-S02.
///
/// A poster grid over `GET /courses` (2-up on phones, 3-up at tablet width)
/// with a filter/sort bottom sheet. The design (`cs-mobile-browse/app.jsx`)
/// draws Status/Library as checkboxes, but `GET /courses` accepts a single
/// `status` and a single `libraryId` (see `BrowseFilter`), so the sheet
/// single-selects both instead — API-honest over pixel-exact.
///
/// Intrinsically sized on purpose: [AppNavigationShell] hands each tab body a
/// `SliverToBoxAdapter` slot inside its own `CustomScrollView`, so the poster
/// grid below is a non-scrolling `GridView` (`shrinkWrap` +
/// `NeverScrollableScrollPhysics`) — the shell supplies the actual scroll.
///
/// Renders no title of its own: the shell already shows the active tab's
/// label as its platform app bar's large title (mirrors [HomeTabBody]), so a
/// second "Browse" heading in the body would duplicate it.
class BrowseTabBody extends StatelessWidget {
  const BrowseTabBody({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<BrowseCubit, BrowseState>(
      builder: (BuildContext context, BrowseState state) {
        final bool showMeta =
            state.status == BrowseStatus.loading ||
            state.status == BrowseStatus.loaded;
        final bool showChipRail =
            state.filter.activeCount > 0 && state.status != BrowseStatus.failed;

        return Padding(
          padding: const EdgeInsets.only(bottom: AppSpacing.s4),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: <Widget>[
              _TopRow(state: state),
              if (showChipRail)
                _ActiveChipRail(
                  filter: state.filter,
                  libraries: state.libraries,
                ),
              if (showMeta) _MetaRow(state: state),
              _Body(state: state),
            ],
          ),
        );
      },
    );
  }
}

/// Opens the filter/sort sheet. Captures [BrowseCubit] from the calling
/// context *before* presenting — `showModalBottomSheet` pushes onto the
/// enclosing `Navigator`, whose route lives outside the `BlocProvider`
/// subtree, so the sheet cannot `context.read` it back out (mirrors
/// `_openSettings` in `lesson_player_screen.dart`).
Future<void> _openFilterSheet(BuildContext context, BrowseState state) {
  final BrowseCubit cubit = context.read<BrowseCubit>();
  return showModalBottomSheet<void>(
    context: context,
    backgroundColor: Colors.transparent,
    isScrollControlled: true,
    builder: (BuildContext sheetContext) => _BrowseFilterSheet(
      initial: state.filter,
      libraries: state.libraries,
      onApply: (BrowseFilter filter) {
        cubit.applyFilter(filter);
        Navigator.of(sheetContext).pop();
      },
    ),
  );
}

// ── Top row: Filters trigger ────────────────────────────────────────────

class _TopRow extends StatelessWidget {
  const _TopRow({required this.state});

  final BrowseState state;

  @override
  Widget build(BuildContext context) {
    final t = context.t.browse;

    return Padding(
      padding: const EdgeInsets.fromLTRB(
        AppSpacing.s4,
        AppSpacing.s2,
        AppSpacing.s4,
        AppSpacing.s1,
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.end,
        children: <Widget>[
          AppButton(
            key: const ValueKey<String>('browseFiltersButton'),
            variant: AppButtonVariant.secondary,
            size: AppButtonSize.sm,
            iconLeading: IconName.sliders,
            semanticLabel: t.filterCourses,
            onPressed: () => _openFilterSheet(context, state),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: <Widget>[
                Text(t.filters),
                if (state.filter.activeCount > 0) ...<Widget>[
                  const SizedBox(width: AppSpacing.s2),
                  AppBadge(
                    label: '${state.filter.activeCount}',
                    color: AppBadgeColor.primary,
                    size: AppBadgeSize.sm,
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ── Meta row: count + sort ──────────────────────────────────────────────

class _MetaRow extends StatelessWidget {
  const _MetaRow({required this.state});

  final BrowseState state;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;
    final t = context.t.browse;

    final String countText = state.status == BrowseStatus.loading
        ? '—'
        : t.count(n: state.courses.length);

    return Padding(
      padding: const EdgeInsets.fromLTRB(
        AppSpacing.s4,
        0,
        AppSpacing.s4,
        AppSpacing.s2,
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: <Widget>[
          Text(
            countText,
            style: theme.textTheme.bodySmall?.copyWith(
              fontFamily: AppTypography.code.fontFamily,
              color: cs.onSurfaceVariant,
            ),
          ),
          AppButton(
            key: const ValueKey<String>('browseSortButton'),
            variant: AppButtonVariant.ghost,
            size: AppButtonSize.sm,
            iconLeading: IconName.sort,
            label: _sortLabel(context, state.filter.sort),
            semanticLabel: t.changeSort,
            onPressed: () => _openFilterSheet(context, state),
          ),
        ],
      ),
    );
  }
}

// ── Active-filter chip rail ─────────────────────────────────────────────

class _ActiveChipRail extends StatelessWidget {
  const _ActiveChipRail({required this.filter, required this.libraries});

  final BrowseFilter filter;
  final List<BrowseLibrary> libraries;

  @override
  Widget build(BuildContext context) {
    final t = context.t.browse;
    final cubit = context.read<BrowseCubit>();

    final List<Widget> chips = <Widget>[];

    if (filter.status != BrowseStatusFilter.all) {
      chips.add(
        AppChip(
          key: const ValueKey<String>('browseChipStatus'),
          label: _statusLabel(context, filter.status),
          removable: true,
          onRemove: () => cubit.setStatus(BrowseStatusFilter.all),
        ),
      );
    }
    if (filter.libraryId != null) {
      chips.add(
        AppChip(
          key: const ValueKey<String>('browseChipLibrary'),
          label: _libraryName(filter.libraryId!, libraries),
          removable: true,
          onRemove: () => cubit.setLibrary(null),
        ),
      );
    }

    return Padding(
      padding: const EdgeInsets.fromLTRB(
        AppSpacing.s4,
        0,
        AppSpacing.s4,
        AppSpacing.s2,
      ),
      child: Wrap(
        spacing: AppSpacing.s2,
        runSpacing: AppSpacing.s2,
        crossAxisAlignment: WrapCrossAlignment.center,
        children: <Widget>[
          ...chips,
          TextButton(
            key: const ValueKey<String>('browseClearAllChips'),
            onPressed: cubit.clearFilters,
            child: Text(t.clearAll),
          ),
        ],
      ),
    );
  }
}

String _libraryName(String libraryId, List<BrowseLibrary> libraries) {
  for (final BrowseLibrary library in libraries) {
    if (library.id == libraryId) return library.name;
  }
  // Should not happen in practice — the id came from a library the sheet
  // itself listed — but a raw id beats a crash if it ever does.
  return libraryId;
}

String _statusLabel(BuildContext context, BrowseStatusFilter status) {
  final t = context.t.browse.status;
  return switch (status) {
    BrowseStatusFilter.all => t.all,
    BrowseStatusFilter.notStarted => t.notStarted,
    BrowseStatusFilter.inProgress => t.inProgress,
    BrowseStatusFilter.completed => t.completed,
  };
}

String _sortLabel(BuildContext context, BrowseSort sort) {
  final t = context.t.browse.sort;
  return switch (sort) {
    BrowseSort.recentlyWatched => t.recentlyWatched,
    BrowseSort.newest => t.newest,
    BrowseSort.alphabetical => t.alphabetical,
  };
}

// ── Body: grid / empty / failed ─────────────────────────────────────────

/// How many skeleton cards the loading grid shows — matches the design's
/// `LoadingGrid` default (`cs-mobile-browse/app.jsx`).
const int _skeletonCount = 6;

const CourseCardData _placeholder = CourseCardData(
  id: '',
  title: '',
  instructor: '',
  lessons: 0,
  completed: 0,
  accent: CourseAccent.neutral,
);

class _Body extends StatelessWidget {
  const _Body({required this.state});

  final BrowseState state;

  @override
  Widget build(BuildContext context) {
    switch (state.status) {
      case BrowseStatus.loading:
        return Padding(
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.s4),
          child: _BrowseGrid(
            itemCount: _skeletonCount,
            itemBuilder: (_, _) =>
                const CoursePosterCard(course: _placeholder, loading: true),
          ),
        );

      case BrowseStatus.loaded:
        return Padding(
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.s4),
          child: _BrowseGrid(
            itemCount: state.courses.length,
            itemBuilder: (BuildContext context, int index) {
              final BrowseCourse course = state.courses[index];
              return CoursePosterCard(
                key: ValueKey<String>('browseCourse_${course.id}'),
                course: CourseCardData(
                  id: course.id,
                  title: course.title,
                  instructor: course.instructor,
                  lessons: course.lessonsTotal,
                  completed: course.lessonsCompleted,
                  accent: accentFromId(course.id),
                ),
                onTap: (CourseCardData tapped) => Navigator.of(
                  context,
                ).pushNamed(AppRoutes.course, arguments: tapped.id),
              );
            },
          ),
        );

      case BrowseStatus.empty:
        final t = context.t.browse.empty;
        return Padding(
          padding: const EdgeInsets.symmetric(vertical: AppSpacing.s4),
          child: AppEmptyState(
            icon: IconName.library,
            title: t.title,
            message: t.message,
            action: state.filter.activeCount > 0
                ? AppButton(
                    key: const ValueKey<String>('browseEmptyClearAll'),
                    label: t.clearAll,
                    variant: AppButtonVariant.secondary,
                    onPressed: () => context.read<BrowseCubit>().clearFilters(),
                  )
                : null,
          ),
        );

      case BrowseStatus.failed:
        final t = context.t.browse.error;
        return Padding(
          padding: const EdgeInsets.symmetric(vertical: AppSpacing.s4),
          child: AppErrorState(
            title: t.title,
            message: t.message,
            action: AppButton(
              key: const ValueKey<String>('browseRetry'),
              label: context.t.common.retry,
              variant: AppButtonVariant.secondary,
              iconLeading: IconName.refresh,
              onPressed: () => context.read<BrowseCubit>().retry(),
            ),
          ),
        );
    }
  }
}

/// A non-scrolling poster grid: 2 columns by default, 3 at tablet width. The
/// shell owns the actual scroll (see [BrowseTabBody] doc), so this is
/// `shrinkWrap` + [NeverScrollableScrollPhysics].
///
/// [CoursePosterCard] has no fixed height of its own — a 3:4 cover plus a
/// natural-height title/instructor band underneath (up to a 2-line title +
/// a 1-line instructor, both capped by `maxLines`) — so `childAspectRatio`
/// is derived per cell width rather than hard-coded. [_extraBandHeight]
/// (88) is that worst-case band measured empirically (a two-line title
/// overflowed a tighter estimate derived from the Home carousel's fixed
/// 128×227 poster), with headroom since the grid's cell width varies by
/// device rather than staying fixed like the carousel's.
class _BrowseGrid extends StatelessWidget {
  const _BrowseGrid({required this.itemCount, required this.itemBuilder});

  final int itemCount;
  final Widget Function(BuildContext context, int index) itemBuilder;

  static const double _spacing = AppSpacing.s3;
  static const double _tabletBreakpoint = 600;
  static const double _coverAspect = 4 / 3; // height / width, 3:4 cover
  static const double _extraBandHeight = 88;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (BuildContext context, BoxConstraints constraints) {
        final int cols = constraints.maxWidth >= _tabletBreakpoint ? 3 : 2;
        final double cellWidth =
            (constraints.maxWidth - (cols - 1) * _spacing) / cols;
        final double cellHeight = cellWidth * _coverAspect + _extraBandHeight;
        final double aspectRatio = cellWidth / cellHeight;

        return GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: cols,
            mainAxisSpacing: _spacing,
            crossAxisSpacing: _spacing,
            childAspectRatio: aspectRatio,
          ),
          itemCount: itemCount,
          itemBuilder: itemBuilder,
        );
      },
    );
  }
}

// ── Filter/sort bottom sheet ────────────────────────────────────────────

/// The Sort/Status/Library sheet, opened from [_TopRow] or [_MetaRow].
///
/// Holds its own pending [BrowseFilter] independent of [BrowseCubit] until
/// "Apply" — dismissing without applying (drag-down, tap-outside, back)
/// discards the pending pick, matching typical filter-sheet UX. "Clear all"
/// resets the pending selection in place, without applying or closing, so a
/// user can still fine-tune before committing.
class _BrowseFilterSheet extends StatefulWidget {
  const _BrowseFilterSheet({
    required this.initial,
    required this.libraries,
    required this.onApply,
  });

  final BrowseFilter initial;
  final List<BrowseLibrary> libraries;
  final ValueChanged<BrowseFilter> onApply;

  @override
  State<_BrowseFilterSheet> createState() => _BrowseFilterSheetState();
}

class _BrowseFilterSheetState extends State<_BrowseFilterSheet> {
  late BrowseFilter _pending = widget.initial;

  @override
  Widget build(BuildContext context) {
    final t = context.t.browse;

    final Widget body = Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: <Widget>[
        AppRadioGroup<BrowseSort>(
          key: const ValueKey<String>('browseSheetSort'),
          label: t.sortBy,
          value: _pending.sort,
          options: <AppRadioGroupOption<BrowseSort>>[
            AppRadioGroupOption<BrowseSort>(
              value: BrowseSort.recentlyWatched,
              label: t.sort.recentlyWatched,
            ),
            AppRadioGroupOption<BrowseSort>(
              value: BrowseSort.newest,
              label: t.sort.newest,
            ),
            AppRadioGroupOption<BrowseSort>(
              value: BrowseSort.alphabetical,
              label: t.sort.alphabetical,
            ),
          ],
          onChanged: (BrowseSort sort) =>
              setState(() => _pending = _pending.copyWith(sort: sort)),
        ),
        const SizedBox(height: AppSpacing.s4),
        AppRadioGroup<BrowseStatusFilter>(
          key: const ValueKey<String>('browseSheetStatus'),
          label: t.status.label,
          value: _pending.status,
          options: <AppRadioGroupOption<BrowseStatusFilter>>[
            AppRadioGroupOption<BrowseStatusFilter>(
              value: BrowseStatusFilter.all,
              label: t.status.all,
            ),
            AppRadioGroupOption<BrowseStatusFilter>(
              value: BrowseStatusFilter.notStarted,
              label: t.status.notStarted,
            ),
            AppRadioGroupOption<BrowseStatusFilter>(
              value: BrowseStatusFilter.inProgress,
              label: t.status.inProgress,
            ),
            AppRadioGroupOption<BrowseStatusFilter>(
              value: BrowseStatusFilter.completed,
              label: t.status.completed,
            ),
          ],
          onChanged: (BrowseStatusFilter status) =>
              setState(() => _pending = _pending.copyWith(status: status)),
        ),
        const SizedBox(height: AppSpacing.s4),
        AppRadioGroup<String?>(
          key: const ValueKey<String>('browseSheetLibrary'),
          label: t.library.label,
          value: _pending.libraryId,
          options: <AppRadioGroupOption<String?>>[
            AppRadioGroupOption<String?>(value: null, label: t.library.all),
            for (final BrowseLibrary library in widget.libraries)
              AppRadioGroupOption<String?>(
                value: library.id,
                label: library.name,
              ),
          ],
          onChanged: (String? libraryId) => setState(
            () => _pending = _pending.copyWith(
              libraryId: libraryId,
              clearLibraryId: libraryId == null,
            ),
          ),
        ),
      ],
    );

    return AppBottomSheet(
      title: t.sheetTitle,
      actions: <Widget>[
        AppButton(
          key: const ValueKey<String>('browseSheetClear'),
          label: t.clearAll,
          variant: AppButtonVariant.secondary,
          onPressed: () => setState(() => _pending = const BrowseFilter()),
        ),
        AppButton(
          key: const ValueKey<String>('browseSheetApply'),
          label: t.apply,
          onPressed: () => widget.onApply(_pending),
        ),
      ],
      child: body,
    );
  }
}
