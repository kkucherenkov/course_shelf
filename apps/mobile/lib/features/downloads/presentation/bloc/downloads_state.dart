import 'package:equatable/equatable.dart';

import 'package:app_mobile/features/downloads/domain/device_storage.dart';
import 'package:app_mobile/features/downloads/domain/download_item.dart';
import 'package:app_mobile/shared/db/tables/downloaded_lessons.dart';

/// One course's worth of finished downloads, as the Downloaded section shows
/// them: a header carrying the course name and a delete-all affordance, over
/// its lessons.
class DownloadCourseGroup extends Equatable {
  const DownloadCourseGroup({
    required this.courseId,
    required this.courseTitle,
    required this.items,
  });

  /// `null` for lessons enqueued on their own — they are grouped together
  /// under a single "ungrouped" heading rather than each getting a section.
  final String? courseId;
  final String? courseTitle;
  final List<DownloadItem> items;

  int get totalBytes => items.fold<int>(
    0,
    (int sum, DownloadItem item) => sum + item.bytesDownloaded,
  );

  @override
  List<Object?> get props => <Object?>[courseId, courseTitle, items];
}

class DownloadsState extends Equatable {
  const DownloadsState({
    this.items = const <DownloadItem>[],
    this.isLoading = true,
    this.storage,
    this.isOnline = true,
  });

  final List<DownloadItem> items;
  final bool isLoading;

  /// Device capacity, or `null` when it has not been read (no platform
  /// implementation wired, or the plugin declined to answer). The bar then
  /// shows CourseShelf's own usage without the "of N free" half.
  final StorageSnapshot? storage;

  /// Drives the offline banner only. The queue's own retry schedule is
  /// unaffected by this flag.
  final bool isOnline;

  /// Lets a lesson row ask "what is my download doing?" without scanning.
  DownloadItem? itemFor(String lessonId) {
    for (final DownloadItem item in items) {
      if (item.lessonId == lessonId) return item;
    }
    return null;
  }

  /// Queued, downloading or paused — everything still on its way.
  List<DownloadItem> get inProgress => items
      .where(
        (DownloadItem i) =>
            i.state == DownloadState.queued ||
            i.state == DownloadState.downloading ||
            i.state == DownloadState.paused,
      )
      .toList(growable: false);

  List<DownloadItem> get failed => items
      .where((DownloadItem i) => i.state == DownloadState.failed)
      .toList(growable: false);

  /// Finished downloads, grouped by course.
  ///
  /// Insertion-ordered so the grouping follows the queue's own ordering rather
  /// than sorting by a title that may be null.
  List<DownloadCourseGroup> get downloadedByCourse {
    final Map<String?, List<DownloadItem>> byCourse =
        <String?, List<DownloadItem>>{};
    final Map<String?, String?> titles = <String?, String?>{};

    for (final DownloadItem item in items) {
      if (item.state != DownloadState.ready) continue;
      (byCourse[item.courseId] ??= <DownloadItem>[]).add(item);
      titles[item.courseId] ??= item.courseTitle;
    }

    return byCourse.entries
        .map(
          (MapEntry<String?, List<DownloadItem>> e) => DownloadCourseGroup(
            courseId: e.key,
            courseTitle: titles[e.key],
            items: e.value,
          ),
        )
        .toList(growable: false);
  }

  /// Bytes CourseShelf is holding. Summed from the queue rather than stat-ing
  /// files: the numbers are already in memory, and a partial download's
  /// on-disk size is exactly what it has written.
  int get appUsedBytes => items.fold<int>(
    0,
    (int sum, DownloadItem item) => sum + item.bytesDownloaded,
  );

  /// True only once loading has finished — an empty list mid-load is not an
  /// empty state, and showing "Nothing downloaded yet" during the first frame
  /// is a flash of the wrong answer.
  bool get isEmpty => !isLoading && items.isEmpty;

  DownloadsState copyWith({
    List<DownloadItem>? items,
    bool? isLoading,
    StorageSnapshot? storage,
    bool? isOnline,
  }) => DownloadsState(
    items: items ?? this.items,
    isLoading: isLoading ?? this.isLoading,
    storage: storage ?? this.storage,
    isOnline: isOnline ?? this.isOnline,
  );

  @override
  List<Object?> get props => <Object?>[items, isLoading, storage, isOnline];
}
