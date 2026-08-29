import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import 'package:app_mobile/features/downloads/domain/download_item.dart';
import 'package:app_mobile/features/downloads/presentation/bloc/downloads_bloc.dart';
import 'package:app_mobile/features/downloads/presentation/bloc/downloads_event.dart';
import 'package:app_mobile/features/downloads/presentation/bloc/downloads_state.dart';
import 'package:app_mobile/features/downloads/presentation/widgets/storage_bar.dart';
import 'package:app_mobile/i18n/strings.g.dart';
import 'package:app_mobile/shared/db/tables/downloaded_lessons.dart';
import 'package:app_mobile/shared/format/byte_size.dart';

/// Body of the Downloads tab: storage header, offline banner, and the queue
/// split into In progress / Downloaded / Failed, per
/// `docs/design/cs-mobile-downloads/`.
///
/// The bloc is resolved from above rather than created here — the shell already
/// provides one, and the course-detail screen reads the same instance to answer
/// "is this lesson downloaded?".
///
/// Intrinsically sized — see [BrowseTabBody] for why.
class DownloadsTabBody extends StatelessWidget {
  const DownloadsTabBody({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<DownloadsBloc, DownloadsState>(
      builder: (BuildContext context, DownloadsState state) {
        if (state.isLoading) {
          return const Padding(
            padding: EdgeInsets.symmetric(vertical: AppSpacing.s8),
            child: Center(child: AppSpinner()),
          );
        }

        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: <Widget>[
            StorageBar(
              appUsedBytes: state.appUsedBytes,
              snapshot: state.storage,
            ),
            if (!state.isOnline)
              Padding(
                padding: const EdgeInsets.fromLTRB(
                  AppSpacing.s4,
                  0,
                  AppSpacing.s4,
                  AppSpacing.s2,
                ),
                child: AppBanner(
                  variant: AppFeedbackVariant.warning,
                  title: context.t.downloads.offline.title,
                  body: context.t.downloads.offline.message,
                ),
              ),
            if (state.isEmpty)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: AppSpacing.s8),
                child: AppEmptyState(
                  icon: IconName.cloudDown,
                  title: context.t.downloads.empty.title,
                  message: context.t.downloads.empty.message,
                ),
              )
            else ...<Widget>[
              _Section(
                title: context.t.downloads.sections.inProgress,
                items: state.inProgress,
              ),
              _DownloadedSection(groups: state.downloadedByCourse),
              _Section(
                title: context.t.downloads.sections.failed,
                items: state.failed,
                tone: Theme.of(context).colorScheme.error,
              ),
            ],
          ],
        );
      },
    );
  }
}

/// A flat titled group. Renders nothing at all when empty — an empty "Failed"
/// heading is noise on a healthy queue.
class _Section extends StatelessWidget {
  const _Section({required this.title, required this.items, this.tone});

  final String title;
  final List<DownloadItem> items;
  final Color? tone;

  @override
  Widget build(BuildContext context) {
    if (items.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: <Widget>[
        _SectionHeader(title: title, count: items.length, tone: tone),
        for (final DownloadItem item in items) _DownloadRow(item: item),
      ],
    );
  }
}

/// "Downloaded", subdivided per course with a delete-all affordance on each.
class _DownloadedSection extends StatelessWidget {
  const _DownloadedSection({required this.groups});

  final List<DownloadCourseGroup> groups;

  @override
  Widget build(BuildContext context) {
    if (groups.isEmpty) return const SizedBox.shrink();

    final int total = groups.fold<int>(
      0,
      (int sum, DownloadCourseGroup g) => sum + g.items.length,
    );

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: <Widget>[
        _SectionHeader(
          title: context.t.downloads.sections.downloaded,
          count: total,
        ),
        for (final DownloadCourseGroup group in groups) ...<Widget>[
          _CourseSubhead(group: group),
          for (final DownloadItem item in group.items) _DownloadRow(item: item),
        ],
      ],
    );
  }
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({
    required this.title,
    required this.count,
    this.tone,
  });

  final String title;
  final int count;
  final Color? tone;

  @override
  Widget build(BuildContext context) {
    final ThemeData theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.fromLTRB(
        AppSpacing.s4,
        AppSpacing.s4,
        AppSpacing.s4,
        AppSpacing.s1,
      ),
      child: Row(
        children: <Widget>[
          Text(
            title,
            style: theme.textTheme.titleSmall?.copyWith(color: tone),
          ),
          const SizedBox(width: AppSpacing.s2),
          Text('· $count', style: theme.textTheme.bodySmall),
        ],
      ),
    );
  }
}

class _CourseSubhead extends StatelessWidget {
  const _CourseSubhead({required this.group});

  final DownloadCourseGroup group;

  @override
  Widget build(BuildContext context) {
    final ThemeData theme = Theme.of(context);
    final String courseTitle =
        group.courseTitle ?? context.t.downloads.ungroupedCourse;
    final String? courseId = group.courseId;

    return Padding(
      padding: const EdgeInsets.fromLTRB(
        AppSpacing.s4,
        AppSpacing.s2,
        AppSpacing.s2,
        AppSpacing.s1,
      ),
      child: Row(
        children: <Widget>[
          Expanded(
            child: Text(
              courseTitle,
              style: theme.textTheme.bodySmall,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          // Lessons enqueued without a course have no group to delete —
          // offering the button would promise something the event cannot do.
          if (courseId != null)
            AppIconButton(
              name: IconName.trash,
              size: AppButtonSize.sm,
              variant: AppButtonVariant.ghost,
              semanticLabel: context.t.downloads.deleteAllFor(
                course: courseTitle,
              ),
              onPressed: () => context.read<DownloadsBloc>().add(
                DeleteCourseDownloads(courseId),
              ),
            ),
        ],
      ),
    );
  }
}

class _DownloadRow extends StatelessWidget {
  const _DownloadRow({required this.item});

  final DownloadItem item;

  @override
  Widget build(BuildContext context) {
    final DownloadsBloc bloc = context.read<DownloadsBloc>();
    final TranslationsDownloadsEn t = context.t.downloads;

    return AppDownloadRow(
      // The id is the last-resort label for rows written before the v3
      // migration added the title columns; it is ugly on purpose, so a row
      // that lost its name is visibly wrong rather than blank.
      lessonTitle: item.lessonTitle ?? item.lessonId,
      courseTitle: item.courseTitle ?? t.ungroupedCourse,
      sizeText: formatDownloadBytes(item.totalBytes ?? item.bytesDownloaded),
      state: _toRowState(item.state),
      progress: item.progress ?? 0,
      cancelLabel: t.actions.cancel,
      resumeLabel: t.actions.resume,
      retryLabel: t.actions.retry,
      deleteLabel: t.actions.delete,
      onCancel: () => bloc.add(CancelDownload(item.lessonId)),
      onResume: () => bloc.add(ResumeDownload(item.lessonId)),
      onRetry: () => bloc.add(RetryDownload(item.lessonId)),
      onDelete: () => bloc.add(CancelDownload(item.lessonId)),
      onPause: () => bloc.add(PauseDownload(item.lessonId)),
    );
  }

  /// The persisted queue state and the design-system row state are separate
  /// enums on purpose — `app_ui` must not import the app's Drift schema.
  static AppDownloadState _toRowState(DownloadState state) => switch (state) {
    DownloadState.queued => AppDownloadState.queued,
    DownloadState.downloading => AppDownloadState.downloading,
    DownloadState.paused => AppDownloadState.paused,
    DownloadState.ready => AppDownloadState.ready,
    DownloadState.failed => AppDownloadState.failed,
  };
}
