import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import 'package:app_mobile/app/routes.dart';
import 'package:app_mobile/features/home/presentation/course_accent.dart';
import 'package:app_mobile/features/search/domain/search_result.dart';
import 'package:app_mobile/features/search/presentation/bloc/search_cubit.dart';
import 'package:app_mobile/features/search/presentation/bloc/search_state.dart';
import 'package:app_mobile/i18n/strings.g.dart';

/// The Search tab — E18-F03-S02 (`cs-mobile-search-settings`).
///
/// Field + five states driven by [SearchCubit]: Recent | Loading | Results |
/// (no-match) Empty | Failed. Intrinsically sized — see [BrowseTabBody] for
/// why: a `Column`, never a bare `ListView`.
///
/// Takes no cubit of its own — `MainShell` provides [SearchCubit] from
/// get_it at the point this body is mounted, the same way it provides
/// `HomeCubit` for [HomeTabBody]. Keeping this widget provider-agnostic is
/// what lets a test drive it with `BlocProvider<SearchCubit>.value` instead
/// of standing up the whole DI graph.
class SearchTabBody extends StatelessWidget {
  const SearchTabBody({super.key});

  @override
  Widget build(BuildContext context) {
    return const Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: <Widget>[_SearchFieldBar(), _SearchResultsBody()],
    );
  }
}

/// How the Search tab's no-results state asks the shell to switch to Browse.
///
/// Mirrors `HomeQuickLinks` (`home_screen.dart`): the tabs are not routes —
/// the shell swaps them through an `IndexedStack` and owns `currentIndex` —
/// so rather than teach Search the shell's tab order, the shell publishes
/// this callback and Search calls it by name.
class SearchQuickLinks extends InheritedWidget {
  const SearchQuickLinks({
    required this.openBrowse,
    required super.child,
    super.key,
  });

  final VoidCallback openBrowse;

  static SearchQuickLinks? of(BuildContext context) =>
      context.dependOnInheritedWidgetOfExactType<SearchQuickLinks>();

  @override
  bool updateShouldNotify(SearchQuickLinks oldWidget) =>
      openBrowse != oldWidget.openBrowse;
}

/// The search field: leading glyph, `TextField`, trailing clear button once
/// there is a value.
///
/// Not [AppSearchField]: that component always renders a visible caption
/// label above the control (`AppFieldFrame`), which the design has no room
/// for here — the shell's own large title already reads "Search". This
/// composes the same [AppFieldBox] chrome directly instead.
///
/// Owns a local [TextEditingController] rather than driving the field purely
/// off [SearchState.query]: the cubit only republishes `query` once the
/// debounced search actually starts (see [SearchCubit.queryChanged]), so
/// gating the clear button off cubit state would leave it a beat behind every
/// keystroke. [BlocListener] resyncs the controller only when the cubit
/// changes `query` out from under it (recent-term tap, clear).
class _SearchFieldBar extends StatefulWidget {
  const _SearchFieldBar();

  @override
  State<_SearchFieldBar> createState() => _SearchFieldBarState();
}

class _SearchFieldBarState extends State<_SearchFieldBar> {
  late final TextEditingController _controller;
  final FocusNode _focusNode = FocusNode();

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController(
      text: context.read<SearchCubit>().state.query,
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  void _syncFrom(String value) {
    if (_controller.text == value) return;
    _controller.value = _controller.value.copyWith(
      text: value,
      selection: TextSelection.collapsed(offset: value.length),
      composing: TextRange.empty,
    );
  }

  @override
  Widget build(BuildContext context) {
    final t = context.t.search;
    final theme = Theme.of(context);
    final cs = theme.colorScheme;
    final cubit = context.read<SearchCubit>();

    return BlocListener<SearchCubit, SearchState>(
      listenWhen: (SearchState p, SearchState c) => p.query != c.query,
      listener: (BuildContext context, SearchState state) =>
          _syncFrom(state.query),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(
          AppSpacing.s4,
          AppSpacing.s2,
          AppSpacing.s4,
          AppSpacing.s3,
        ),
        child: AppFieldBox(
          focusNode: _focusNode,
          size: AppFieldSize.md,
          child: ValueListenableBuilder<TextEditingValue>(
            valueListenable: _controller,
            builder: (BuildContext context, TextEditingValue value, _) {
              final bool hasValue = value.text.isNotEmpty;
              return Row(
                children: <Widget>[
                  IconCS(
                    name: IconName.search,
                    size: 16,
                    color: cs.onSurfaceVariant,
                  ),
                  const SizedBox(width: AppSpacing.s2),
                  Expanded(
                    child: TextField(
                      key: const ValueKey<String>('searchField'),
                      controller: _controller,
                      focusNode: _focusNode,
                      textInputAction: TextInputAction.search,
                      decoration: InputDecoration(
                        isCollapsed: true,
                        border: InputBorder.none,
                        hintText: t.fieldPlaceholder,
                      ),
                      onChanged: cubit.queryChanged,
                    ),
                  ),
                  if (hasValue) ...<Widget>[
                    const SizedBox(width: AppSpacing.s1),
                    AppIconButton(
                      key: const ValueKey<String>('searchFieldClear'),
                      name: IconName.x,
                      semanticLabel: t.clear,
                      variant: AppButtonVariant.ghost,
                      size: AppButtonSize.sm,
                      onPressed: () {
                        _controller.clear();
                        cubit.clearQuery();
                      },
                    ),
                  ],
                ],
              );
            },
          ),
        ),
      ),
    );
  }
}

class _SearchResultsBody extends StatelessWidget {
  const _SearchResultsBody();

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<SearchCubit, SearchState>(
      builder: (BuildContext context, SearchState state) {
        switch (state.status) {
          case SearchStatus.recent:
            return _RecentSection(recentSearches: state.recentSearches);
          case SearchStatus.loading:
            return const _LoadingSection();
          case SearchStatus.results:
            return _ResultsSection(results: state.results!, query: state.query);
          case SearchStatus.empty:
            return _NoResultsSection(query: state.query);
          case SearchStatus.failed:
            return const _FailedSection();
        }
      },
    );
  }
}

class _SectionHeading extends StatelessWidget {
  const _SectionHeading({required this.label, this.count, this.trailing});

  final String label;
  final int? count;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;

    return Padding(
      padding: const EdgeInsets.fromLTRB(
        AppSpacing.s4,
        AppSpacing.s3,
        AppSpacing.s4,
        AppSpacing.s2,
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: <Widget>[
          Row(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: <Widget>[
              Text(
                label,
                style: theme.textTheme.titleSmall?.copyWith(
                  fontWeight: AppFontWeight.semibold,
                ),
              ),
              if (count != null) ...<Widget>[
                const SizedBox(width: AppSpacing.s2),
                Text(
                  '$count',
                  style: theme.textTheme.bodySmall?.copyWith(
                    fontFamily: AppTypography.code.fontFamily,
                    color: cs.onSurfaceVariant,
                  ),
                ),
              ],
            ],
          ),
          ?trailing,
        ],
      ),
    );
  }
}

// ── Recent ───────────────────────────────────────────────────────────────

class _RecentSection extends StatelessWidget {
  const _RecentSection({required this.recentSearches});

  final List<String> recentSearches;

  @override
  Widget build(BuildContext context) {
    final t = context.t.search.recent;
    final theme = Theme.of(context);

    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: <Widget>[
        _SectionHeading(
          label: t.heading,
          trailing: recentSearches.isEmpty
              ? null
              : TextButton(
                  key: const ValueKey<String>('searchClearRecent'),
                  onPressed: () => context.read<SearchCubit>().clearRecent(),
                  child: Text(t.clear),
                ),
        ),
        if (recentSearches.isEmpty)
          Padding(
            padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.s4,
              vertical: AppSpacing.s2,
            ),
            child: Text(
              t.empty,
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
          )
        else
          for (final String term in recentSearches) _RecentRow(term: term),
        // TODO(E18): subject chips need a catalog-facets endpoint.
      ],
    );
  }
}

class _RecentRow extends StatelessWidget {
  const _RecentRow({required this.term});

  final String term;

  @override
  Widget build(BuildContext context) {
    final t = context.t.search.recent;
    final theme = Theme.of(context);
    final cs = theme.colorScheme;
    final sem = context.semanticColors;
    final cubit = context.read<SearchCubit>();

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.s2),
      child: Row(
        children: <Widget>[
          Expanded(
            child: Material(
              color: Colors.transparent,
              child: InkWell(
                borderRadius: BorderRadius.circular(AppRadius.md),
                onTap: () => cubit.searchRecent(term),
                child: Semantics(
                  button: true,
                  label: t.searchAgain(term: term),
                  excludeSemantics: true,
                  child: Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: AppSpacing.s2,
                      vertical: AppSpacing.s3,
                    ),
                    child: Row(
                      children: <Widget>[
                        IconCS(
                          name: IconName.clock,
                          size: 16,
                          color: sem.textTertiary,
                        ),
                        const SizedBox(width: AppSpacing.s3),
                        Expanded(
                          child: Text(
                            term,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: theme.textTheme.bodyMedium?.copyWith(
                              color: cs.onSurface,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
          AppIconButton(
            name: IconName.x,
            semanticLabel: t.remove(term: term),
            variant: AppButtonVariant.ghost,
            size: AppButtonSize.sm,
            onPressed: () => cubit.removeRecent(term),
          ),
        ],
      ),
    );
  }
}

// ── Loading ──────────────────────────────────────────────────────────────

class _LoadingSection extends StatelessWidget {
  const _LoadingSection();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: AppSpacing.s7),
      child: Center(
        child: AppSpinner(
          size: AppSpinnerSize.lg,
          semanticLabel: context.t.common.loading,
        ),
      ),
    );
  }
}

// ── Results ──────────────────────────────────────────────────────────────

class _ResultsSection extends StatelessWidget {
  const _ResultsSection({required this.results, required this.query});

  final SearchResults results;
  final String query;

  @override
  Widget build(BuildContext context) {
    final t = context.t.search.results;

    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: <Widget>[
        if (results.courses.isNotEmpty) ...<Widget>[
          _SectionHeading(
            label: t.coursesHeading,
            count: results.courses.length,
          ),
          for (final SearchCourseHit hit in results.courses)
            _CourseHitRow(hit: hit, query: query),
        ],
        if (results.lessons.isNotEmpty) ...<Widget>[
          _SectionHeading(
            label: t.lessonsHeading,
            count: results.lessons.length,
          ),
          for (final SearchLessonHit hit in results.lessons)
            _LessonHitRow(hit: hit, query: query),
        ],
      ],
    );
  }
}

/// Fixed thumb geometry for [_CourseHitRow] / [_LessonHitRow] — mirrors the
/// design's 44×44 cover swatch.
abstract final class _Thumb {
  static const double size = 44;
}

class _CourseHitRow extends StatelessWidget {
  const _CourseHitRow({required this.hit, required this.query});

  final SearchCourseHit hit;
  final String query;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;
    final accent = courseAccentColor(accentFromId(hit.id));

    return Material(
      color: Colors.transparent,
      child: InkWell(
        key: ValueKey<String>('searchCourse_${hit.id}'),
        borderRadius: BorderRadius.circular(AppRadius.md),
        // AppRoutes.course is a trivial launch-by-course-id route — the
        // detail screen resolves everything else from `courseId` itself.
        onTap: () => Navigator.of(
          context,
        ).pushNamed(AppRoutes.course, arguments: hit.id),
        child: Padding(
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.s4,
            vertical: AppSpacing.s2,
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Container(
                width: _Thumb.size,
                height: _Thumb.size,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: accent,
                  borderRadius: BorderRadius.circular(AppRadius.sm),
                ),
                child: Text(
                  _glyphFor(hit.title),
                  style: TextStyle(
                    fontFamily: AppTypography.code.fontFamily,
                    fontSize: AppFontSize.md,
                    fontWeight: AppFontWeight.semibold,
                    color: Colors.white.withValues(alpha: 0.92),
                  ),
                ),
              ),
              const SizedBox(width: AppSpacing.s3),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    _HighlightedText(
                      text: hit.title,
                      query: query,
                      style: theme.textTheme.bodyMedium?.copyWith(
                        fontWeight: AppFontWeight.medium,
                        color: cs.onSurface,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      context.t.search.results.lessonsCount(
                        n: hit.lessonsTotal,
                      ),
                      style: theme.textTheme.bodySmall?.copyWith(
                        fontFamily: AppTypography.code.fontFamily,
                        color: cs.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _glyphFor(String title) {
    final words = title.trim().split(RegExp(r'\s+'));
    return words
        .take(2)
        .map((String w) => w.isEmpty ? '' : w[0].toUpperCase())
        .join();
  }
}

class _LessonHitRow extends StatelessWidget {
  const _LessonHitRow({required this.hit, required this.query});

  final SearchLessonHit hit;
  final String query;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;
    final accent = courseAccentColor(accentFromId(hit.courseId));

    return Material(
      color: Colors.transparent,
      child: InkWell(
        key: ValueKey<String>('searchLesson_${hit.id}'),
        borderRadius: BorderRadius.circular(AppRadius.md),
        // AppRoutes.lesson is a trivial launch-by-lesson-id route — the
        // player screen resolves everything else from `lessonId` itself.
        onTap: () => Navigator.of(
          context,
        ).pushNamed(AppRoutes.lesson, arguments: hit.id),
        child: Padding(
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.s4,
            vertical: AppSpacing.s2,
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Container(
                width: _Thumb.size,
                height: _Thumb.size,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: accent,
                  borderRadius: BorderRadius.circular(AppRadius.sm),
                ),
                child: IconCS(
                  name: IconName.play,
                  fill: true,
                  size: 16,
                  color: Colors.white.withValues(alpha: 0.92),
                ),
              ),
              const SizedBox(width: AppSpacing.s3),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    _HighlightedText(
                      text: hit.title,
                      query: query,
                      style: theme.textTheme.bodyMedium?.copyWith(
                        fontWeight: AppFontWeight.medium,
                        color: cs.onSurface,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '${hit.courseTitle} · ${hit.sectionTitle}',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: cs.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ),
              IconCS(
                name: IconName.chevronRight,
                size: 15,
                color: context.semanticColors.textTertiary,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Highlights the first case-insensitive match of [query] inside [text].
/// Falls back to plain text when there is no match — a fiddly multi-match
/// highlighter is left as a follow-up.
class _HighlightedText extends StatelessWidget {
  const _HighlightedText({required this.text, required this.query, this.style});

  final String text;
  final String query;
  final TextStyle? style;

  @override
  Widget build(BuildContext context) {
    final trimmed = query.trim();
    final baseStyle = style ?? const TextStyle();
    if (trimmed.isEmpty) {
      return Text(
        text,
        maxLines: 2,
        overflow: TextOverflow.ellipsis,
        style: baseStyle,
      );
    }

    final idx = text.toLowerCase().indexOf(trimmed.toLowerCase());
    if (idx < 0) {
      return Text(
        text,
        maxLines: 2,
        overflow: TextOverflow.ellipsis,
        style: baseStyle,
      );
    }

    final cs = Theme.of(context).colorScheme;
    final highlightStyle = baseStyle.copyWith(
      backgroundColor: cs.primary.withValues(alpha: 0.18),
      color: cs.primary,
      fontWeight: AppFontWeight.semibold,
    );

    return RichText(
      maxLines: 2,
      overflow: TextOverflow.ellipsis,
      text: TextSpan(
        style: baseStyle,
        children: <InlineSpan>[
          TextSpan(text: text.substring(0, idx)),
          TextSpan(
            text: text.substring(idx, idx + trimmed.length),
            style: highlightStyle,
          ),
          TextSpan(text: text.substring(idx + trimmed.length)),
        ],
      ),
    );
  }
}

// ── No results ───────────────────────────────────────────────────────────

class _NoResultsSection extends StatelessWidget {
  const _NoResultsSection({required this.query});

  final String query;

  @override
  Widget build(BuildContext context) {
    final t = context.t.search.noResults;
    final quickLinks = SearchQuickLinks.of(context);

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: AppSpacing.s7),
      child: AppEmptyState(
        icon: IconName.search,
        title: t.title(query: query),
        message: t.message,
        // The shell publishes a Browse-tab switch (SearchQuickLinks, mirrors
        // Home's HomeQuickLinks) — only render the button when that seam is
        // actually there, so a bare Widget test never ships a dead control.
        action: quickLinks == null
            ? null
            : AppButton(
                key: const ValueKey<String>('searchBrowseLibrary'),
                label: t.browseLibrary,
                variant: AppButtonVariant.secondary,
                iconLeading: IconName.library,
                onPressed: quickLinks.openBrowse,
              ),
      ),
    );
  }
}

// ── Failed ───────────────────────────────────────────────────────────────

class _FailedSection extends StatelessWidget {
  const _FailedSection();

  @override
  Widget build(BuildContext context) {
    final t = context.t.search.error;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: AppSpacing.s7),
      child: AppErrorState(
        title: t.title,
        message: t.message,
        action: AppButton(
          key: const ValueKey<String>('searchRetry'),
          label: context.t.common.retry,
          variant: AppButtonVariant.secondary,
          iconLeading: IconName.refresh,
          onPressed: () => context.read<SearchCubit>().retry(),
        ),
      ),
    );
  }
}
