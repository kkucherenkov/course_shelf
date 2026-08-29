import 'package:equatable/equatable.dart';

import 'package:app_mobile/shared/db/app_database.dart';
import 'package:app_mobile/shared/db/tables/downloaded_lessons.dart';

/// One row of the download queue, as the UI sees it.
///
/// Mirrors the Drift row but keeps `filePath` and `nonce` out — widget code
/// must never learn where the ciphertext lives (E15-F02-S01 acceptance:
/// consumers of Drift are BLoCs only).
class DownloadItem extends Equatable {
  const DownloadItem({
    required this.lessonId,
    required this.state,
    required this.bytesDownloaded,
    required this.totalBytes,
    required this.attemptCount,
    this.courseId,
    this.lastError,
    this.lessonTitle,
    this.courseTitle,
  });

  factory DownloadItem.fromRow(DownloadedLesson row) => DownloadItem(
    lessonId: row.lessonId,
    state: row.state,
    bytesDownloaded: row.bytesDownloaded,
    totalBytes: row.totalBytes,
    attemptCount: row.attemptCount,
    courseId: row.courseId,
    lastError: row.lastError,
    lessonTitle: row.lessonTitle,
    courseTitle: row.courseTitle,
  );

  final String lessonId;
  final String? courseId;
  final DownloadState state;
  final int bytesDownloaded;
  final int? totalBytes;
  final int attemptCount;
  final String? lastError;

  /// Denormalised at enqueue time — see `DownloadedLessons.lessonTitle` for
  /// why the queue row carries its own names. Null on rows written before the
  /// v3 migration.
  final String? lessonTitle;
  final String? courseTitle;

  /// `null` until the server has told us the total — a progress bar cannot be
  /// drawn before the first response arrives.
  double? get progress {
    final int? total = totalBytes;
    if (total == null || total == 0) return null;
    return (bytesDownloaded / total).clamp(0.0, 1.0);
  }

  @override
  List<Object?> get props => <Object?>[
    lessonId,
    courseId,
    state,
    bytesDownloaded,
    totalBytes,
    attemptCount,
    lastError,
    lessonTitle,
    courseTitle,
  ];
}
