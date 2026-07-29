import 'package:equatable/equatable.dart';

import 'package:app_mobile/features/downloads/domain/download_item.dart';

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
  const EnqueueLesson(this.lessonId, {this.courseId});

  final String lessonId;
  final String? courseId;

  @override
  List<Object?> get props => <Object?>[lessonId, courseId];
}

final class EnqueueCourse extends DownloadsEvent {
  const EnqueueCourse(this.courseId, this.lessonIds);

  final String courseId;
  final List<String> lessonIds;

  @override
  List<Object?> get props => <Object?>[courseId, lessonIds];
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
