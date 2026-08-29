import 'package:equatable/equatable.dart';

import 'package:app_mobile/features/downloads/domain/download_item.dart';
import 'package:app_mobile/features/downloads/domain/device_storage.dart';
import 'package:app_mobile/features/downloads/domain/downloads_repository.dart';

sealed class DownloadsEvent extends Equatable {
  const DownloadsEvent();

  @override
  List<Object?> get props => const <Object?>[];
}

/// Subscribes to the queue and reconciles anything an app kill stranded.
final class DownloadsStarted extends DownloadsEvent {
  const DownloadsStarted();
}

final class EnqueueLesson extends DownloadsEvent {
  const EnqueueLesson(
    this.lessonId, {
    this.courseId,
    this.lessonTitle,
    this.courseTitle,
  });

  final String lessonId;
  final String? courseId;

  /// Carried because the Downloads tab is offline by nature and has nothing to
  /// look a name up from — see `DownloadedLessons.lessonTitle`.
  final String? lessonTitle;
  final String? courseTitle;

  @override
  List<Object?> get props => <Object?>[
    lessonId,
    courseId,
    lessonTitle,
    courseTitle,
  ];
}

final class EnqueueCourse extends DownloadsEvent {
  const EnqueueCourse(this.courseId, this.lessons);

  final String courseId;
  final List<DownloadRequest> lessons;

  @override
  List<Object?> get props => <Object?>[
    courseId,
    lessons.map((DownloadRequest l) => l.lessonId).toList(),
  ];
}

final class PauseDownload extends DownloadsEvent {
  const PauseDownload(this.lessonId);

  final String lessonId;

  @override
  List<Object?> get props => <Object?>[lessonId];
}

final class ResumeDownload extends DownloadsEvent {
  const ResumeDownload(this.lessonId);

  final String lessonId;

  @override
  List<Object?> get props => <Object?>[lessonId];
}

final class CancelDownload extends DownloadsEvent {
  const CancelDownload(this.lessonId);

  final String lessonId;

  @override
  List<Object?> get props => <Object?>[lessonId];
}

final class RetryDownload extends DownloadsEvent {
  const RetryDownload(this.lessonId);

  final String lessonId;

  @override
  List<Object?> get props => <Object?>[lessonId];
}

/// Internal — a new snapshot arrived from the repository stream.
final class DownloadsUpdated extends DownloadsEvent {
  const DownloadsUpdated(this.items);

  final List<DownloadItem> items;

  @override
  List<Object?> get props => <Object?>[items];
}

/// Deletes every downloaded lesson of one course — the "delete all" affordance
/// on a course group in the Downloads tab.
final class DeleteCourseDownloads extends DownloadsEvent {
  const DeleteCourseDownloads(this.courseId);

  final String courseId;

  @override
  List<Object?> get props => <Object?>[courseId];
}

/// Re-reads device capacity. Fired on start and after the queue changes, since
/// a completed or deleted download moves the numbers.
final class DownloadsStorageRequested extends DownloadsEvent {
  const DownloadsStorageRequested();
}

/// Internal — a fresh storage reading arrived.
final class DownloadsStorageUpdated extends DownloadsEvent {
  const DownloadsStorageUpdated(this.snapshot);

  final StorageSnapshot snapshot;

  @override
  List<Object?> get props => <Object?>[snapshot];
}

/// Connectivity flipped. Drives the offline banner; the queue itself already
/// retries on its own schedule.
final class DownloadsConnectivityChanged extends DownloadsEvent {
  const DownloadsConnectivityChanged({required this.isOnline});

  final bool isOnline;

  @override
  List<Object?> get props => <Object?>[isOnline];
}
