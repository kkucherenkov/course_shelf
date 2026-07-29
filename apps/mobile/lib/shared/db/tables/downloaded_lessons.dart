import 'package:drift/drift.dart';

/// Lifecycle of a downloaded lesson file. Drives E19's `EnqueueLesson`,
/// `EnqueueCourse`, `Pause`, `Resume`, `Retry`. Cancel deletes the row rather
/// than adding a terminal state — there is nothing left to resume from.
///
/// Persisted by name via `textEnum`, so these names are a storage contract:
/// renaming a value silently breaks every row already on disk (a download
/// stuck mid-state, with no error).
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

  /// Parent course. Nullable because a lesson can be enqueued on its own;
  /// `EnqueueCourse` and course-level cancel need it to group rows.
  TextColumn get courseId => text().nullable()();

  /// Failed attempts so far. Drives the `2^n` backoff — a backoff needs a
  /// count to back off on.
  IntColumn get attemptCount => integer().withDefault(const Constant(0))();

  /// FIFO position in the queue. **Always write UTC** — see the ordering
  /// warning in `downloads_dao.dart`; Drift's TEXT datetime encoding makes
  /// `ORDER BY` lexicographic, so a column holding mixed offsets sorts wrong.
  ///
  /// Nullable so the v1 -> v2 migration can add it to a populated table; the
  /// migration backfills existing rows from `updatedAt`, and the repository
  /// always sets it on insert. SQLite sorts NULL first, which is the correct
  /// fallback ordering anyway (an un-backfilled row is the oldest).
  DateTimeColumn get queuedAt => dateTime().nullable()();

  /// Earliest UTC instant at which this row may be attempted again. Null means
  /// "eligible now".
  ///
  /// Backoff is persisted rather than slept: `_drain` skips rows whose window
  /// has not elapsed and moves to the next item. Sleeping inside the pump would
  /// make one unreachable lesson freeze every healthy download behind it —
  /// on a 40-lesson course enqueue, up to 5 attempts x 5 minutes each.
  DateTimeColumn get nextAttemptAt => dateTime().nullable()();

  DateTimeColumn get updatedAt => dateTime()();

  @override
  Set<Column> get primaryKey => {lessonId};
}
