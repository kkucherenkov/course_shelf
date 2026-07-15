import 'package:drift/drift.dart';

/// Lifecycle of a downloaded lesson file. Drives E19's `EnqueueLesson`,
/// `EnqueueCourse`, `Pause`, `Resume`, `Retry`. Cancel deletes the row rather
/// than adding a terminal state — there is nothing left to resume from.
enum DownloadState { queued, downloading, paused, ready, failed }

/// One row per downloaded lesson.
///
/// Keyed by lessonId because E19-F01-S02's acceptance is literally
/// `downloaded_lessons[lessonId].state == READY`.
///
/// NOTE: the AES-GCM **key is deliberately absent**. E19-F01-S01 specifies a
/// device-bound key in secure storage (`flutter_secure_storage`, already wired
/// in `shared/auth/token_storage.dart`). A key stored beside its own ciphertext
/// is not encryption. Only [nonce] belongs here — nonces must be unique, not
/// secret.
@DataClassName('DownloadedLesson')
class DownloadedLessons extends Table {
  @override
  String get tableName => 'downloaded_lessons';

  TextColumn get lessonId => text()();

  TextColumn get state => textEnum<DownloadState>()();

  /// Absolute path to the encrypted file on disk.
  TextColumn get filePath => text()();

  /// Drives byte-range continuation on resume.
  IntColumn get bytesDownloaded => integer().withDefault(const Constant(0))();

  /// Expected total. E19-F01-S02 checks this against the file size before play
  /// (integrity check, task #126). Null until the first response's
  /// Content-Length is known.
  IntColumn get totalBytes => integer().nullable()();

  /// Per-file AES-GCM IV. Unique per file; not secret.
  BlobColumn get nonce => blob().nullable()();

  /// Why the last attempt failed — supports "deleted local file falls back
  /// gracefully and re-marks the download as failed".
  TextColumn get lastError => text().nullable()();

  DateTimeColumn get updatedAt => dateTime()();

  @override
  Set<Column> get primaryKey => {lessonId};
}
