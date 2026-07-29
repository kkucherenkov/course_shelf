import 'dart:async';
import 'dart:io';
import 'dart:math';
import 'dart:typed_data';

import 'package:async/async.dart' show StreamGroup;
import 'package:dio/dio.dart';
import 'package:drift/drift.dart' show Value;

import 'package:app_mobile/features/downloads/data/chunked_gcm_writer.dart';
import 'package:app_mobile/features/downloads/domain/download_item.dart';
import 'package:app_mobile/features/downloads/domain/download_key_store.dart';
import 'package:app_mobile/features/downloads/domain/download_scheduler_port.dart';
import 'package:app_mobile/features/downloads/domain/downloads_repository.dart';
import 'package:app_mobile/features/downloads/domain/encrypted_file_format.dart';
import 'package:app_mobile/features/downloads/domain/lesson_byte_source.dart';
import 'package:app_mobile/shared/db/app_database.dart';
import 'package:app_mobile/shared/db/tables/downloaded_lessons.dart';

/// Serial download queue over Drift, the byte source, and the block writer.
///
/// One active download at a time, FIFO by `queuedAt`. Parallel downloads thrash
/// mobile bandwidth and multiply partial-file states for no user-visible gain.
class DownloadsRepositoryImpl implements DownloadsRepository {
  DownloadsRepositoryImpl({
    required DownloadsDao dao,
    required LessonByteSource byteSource,
    required DownloadKeyStore keyStore,
    required DownloadSchedulerPort scheduler,
    required Future<Directory> Function() downloadsDirectory,
    required Future<bool> Function() isOnline,
  }) : _dao = dao,
       _byteSource = byteSource,
       _keyStore = keyStore,
       _scheduler = scheduler,
       _downloadsDirectory = downloadsDirectory,
       _isOnline = isOnline;

  /// Blocks between Drift flushes. 16 x 256 KiB = 4 MiB — per-block would be
  /// ~3200 SQLite transactions for an 800 MB video to save at most 256 KiB of
  /// re-download.
  static const int _flushEveryBlocks = 16;

  static const int _maxAttempts = 5;
  static const Duration _maxBackoff = Duration(minutes: 5);

  final DownloadsDao _dao;
  final LessonByteSource _byteSource;
  final DownloadKeyStore _keyStore;
  final DownloadSchedulerPort _scheduler;
  final Future<Directory> Function() _downloadsDirectory;
  final Future<bool> Function() _isOnline;

  final StreamController<DownloadItem> _progress =
      StreamController<DownloadItem>.broadcast();

  CancelToken? _activeCancel;
  String? _activeLessonId;
  Future<void>? _pump;

  /// Lessons that have already spent their one free token re-mint this run.
  /// Without it, a 401 that means "you genuinely may not have this" would
  /// re-mint and retry forever at zero backoff.
  final Set<String> _reminted = <String>{};

  @override
  Future<void> enqueueLesson(String lessonId, {String? courseId}) async {
    final DownloadedLesson? existing = await _dao.byLessonId(lessonId);
    if (existing?.state == DownloadState.ready) return;

    final Directory dir = await _downloadsDirectory();
    final DateTime now = DateTime.now().toUtc();
    await _dao.upsert(
      DownloadedLessonsCompanion.insert(
        lessonId: lessonId,
        state: DownloadState.queued,
        filePath: existing?.filePath ?? '${dir.path}/$lessonId.csdl',
        updatedAt: now,
        // UTC, always — Drift's TEXT datetime encoding makes ORDER BY
        // lexicographic, so a mixed-offset column sorts wrong.
        queuedAt: Value<DateTime?>(existing?.queuedAt ?? now),
        courseId: Value<String?>(courseId ?? existing?.courseId),
        bytesDownloaded: Value<int>(existing?.bytesDownloaded ?? 0),
        totalBytes: Value<int?>(existing?.totalBytes),
      ),
    );

    await _scheduler.ensureScheduled();
    _kick();
  }

  @override
  Future<void> enqueueCourse(String courseId, List<String> lessonIds) async {
    for (final String lessonId in lessonIds) {
      await enqueueLesson(lessonId, courseId: courseId);
    }
  }

  @override
  Future<void> pause(String lessonId) async {
    if (_activeLessonId == lessonId) {
      _activeCancel?.cancel('paused');
    }
    await _setState(lessonId, DownloadState.paused);
  }

  @override
  Future<void> resume(String lessonId) async {
    await _setState(lessonId, DownloadState.queued);
    await _scheduler.ensureScheduled();
    _kick();
  }

  @override
  Future<void> cancel(String lessonId) async {
    if (_activeLessonId == lessonId) {
      _activeCancel?.cancel('cancelled');
    }
    final DownloadedLesson? row = await _dao.byLessonId(lessonId);
    if (row != null) {
      final File file = File(row.filePath);
      if (file.existsSync()) await file.delete();
    }
    await _dao.remove(lessonId);
  }

  @override
  Future<void> retry(String lessonId) async {
    final DownloadedLesson? row = await _dao.byLessonId(lessonId);
    if (row == null) return;
    // An explicit user retry clears the backoff window and the re-mint guard —
    // they asked for it now, not after the timer the last failure set.
    _reminted.remove(lessonId);
    await _dao.updateFields(
      DownloadedLessonsCompanion(
        lessonId: Value<String>(lessonId),
        state: const Value<DownloadState>(DownloadState.queued),
        attemptCount: Value<int>(row.attemptCount + 1),
        nextAttemptAt: const Value<DateTime?>(null),
        lastError: const Value<String?>(null),
        updatedAt: Value<DateTime>(DateTime.now().toUtc()),
      ),
    );
    _kick();
  }

  @override
  Future<void> reconcileAfterRestart() async {
    // An app kill can only ever leave a row `downloading`. Nothing was
    // committed mid-block, so the file needs no repair — only the row does.
    final List<DownloadedLesson> stranded = await _dao.byState(
      DownloadState.downloading,
    );
    for (final DownloadedLesson row in stranded) {
      await _setState(row.lessonId, DownloadState.paused);
    }
  }

  @override
  Stream<DownloadItem?> watch(String lessonId) {
    final Stream<DownloadItem?> persisted = _dao
        .watch(lessonId)
        .map(
          (DownloadedLesson? row) =>
              row == null ? null : DownloadItem.fromRow(row),
        );
    // The DAO stream only fires on the 4 MiB flushes, which would make a
    // progress bar jump. Merge the in-memory ticks for the active item.
    return StreamGroup.merge<DownloadItem?>(<Stream<DownloadItem?>>[
      persisted,
      _progress.stream.where((DownloadItem i) => i.lessonId == lessonId),
    ]);
  }

  @override
  Stream<List<DownloadItem>> watchAll() => _dao.watchAll().map(
    (List<DownloadedLesson> rows) =>
        rows.map(DownloadItem.fromRow).toList(growable: false),
  );

  /// Test seam — awaits the pump so a test does not have to poll.
  Future<void> drainForTest() async {
    _kick();
    await _pump;
  }

  // ── Pump ────────────────────────────────────────────────────────────────

  void _kick() {
    _pump ??= _drain().whenComplete(() => _pump = null);
  }

  Future<void> _drain() async {
    while (true) {
      // Rows still inside their backoff window are skipped, not waited on, so a
      // single unreachable lesson never blocks the ones behind it.
      final DownloadedLesson? next = await _dao.nextQueued(
        now: DateTime.now().toUtc(),
      );
      if (next == null) return;

      if (!await _isOnline()) {
        // Not an error: leave the row queued and burn no attempt. The scheduler
        // and resume-on-launch will come back to it.
        return;
      }

      await _download(next);
    }
  }

  Future<void> _download(DownloadedLesson row) async {
    final CancelToken cancelToken = CancelToken();
    _activeCancel = cancelToken;
    _activeLessonId = row.lessonId;

    await _setState(row.lessonId, DownloadState.downloading);

    ChunkedGcmWriter? writer;
    try {
      final Uint8List key = await _keyStore.keyForDevice();
      final File file = File(row.filePath);

      // The row is the source of truth. resume() truncates the file down to the
      // block boundary the row implies, discarding at most 4 MiB the flush
      // cadence had not yet recorded.
      writer = row.bytesDownloaded > 0 && file.existsSync()
          ? await ChunkedGcmWriter.resume(
              file: file,
              key: key,
              committedPlaintextBytes: row.bytesDownloaded,
            )
          : await ChunkedGcmWriter.create(file: file, key: key);

      final int startOffset = writer.committedPlaintextBytes;
      final RangedResponse response = await _byteSource.fetchFrom(
        lessonId: row.lessonId,
        offset: startOffset,
        cancelToken: cancelToken,
      );

      int lastFlushed = writer.committedPlaintextBytes;
      await for (final Uint8List chunk in response.bytes) {
        await writer.add(chunk);
        final int committed = writer.committedPlaintextBytes;
        _progress.add(
          DownloadItem(
            lessonId: row.lessonId,
            courseId: row.courseId,
            state: DownloadState.downloading,
            bytesDownloaded: committed,
            totalBytes: response.totalBytes ?? row.totalBytes,
            attemptCount: row.attemptCount,
          ),
        );

        final int sinceFlush = committed - lastFlushed;
        if (sinceFlush >= _flushEveryBlocks * EncryptedFileFormat.blockSize) {
          await _persistProgress(row.lessonId, committed, response.totalBytes);
          lastFlushed = committed;
        }
      }

      final int total = await writer.finish();
      await writer.close();
      writer = null;

      _reminted.remove(row.lessonId);
      await _dao.updateFields(
        DownloadedLessonsCompanion(
          lessonId: Value<String>(row.lessonId),
          state: const Value<DownloadState>(DownloadState.ready),
          bytesDownloaded: Value<int>(total),
          totalBytes: Value<int?>(response.totalBytes ?? total),
          nextAttemptAt: const Value<DateTime?>(null),
          lastError: const Value<String?>(null),
          updatedAt: Value<DateTime>(DateTime.now().toUtc()),
        ),
      );
    } on Object catch (error) {
      final int? committed = writer?.committedPlaintextBytes;
      await writer?.finish().catchError((_) => 0);
      await writer?.close();
      await _onFailure(row, error, committed);
    } finally {
      _activeCancel = null;
      _activeLessonId = null;
    }
  }

  Future<void> _onFailure(
    DownloadedLesson row,
    Object error,
    int? committedPlaintextBytes,
  ) async {
    if (error is DioException && error.type == DioExceptionType.cancel) {
      // pause() and cancel() already wrote the right state.
      if (committedPlaintextBytes != null) {
        await _persistProgress(
          row.lessonId,
          committedPlaintextBytes,
          row.totalBytes,
        );
      }
      return;
    }

    // A dropped socket, timeout, or DNS failure never reached the server, so
    // it carries no HTTP status and cannot be a 401/404/416 — it is a network
    // blip, not evidence the lesson or the ciphertext is bad. It still burns
    // an attempt, so a permanently unreachable host eventually lands in
    // `failed` rather than spinning the pump forever on the same lesson, but
    // it skips the backoff window: unlike a genuine server rejection, a
    // dropped socket is likely to clear on the very next attempt, and a
    // persisted wait here would stall the resume this brief's writer/reader
    // design exists to make cheap.
    if (error is DioException && error.type != DioExceptionType.badResponse) {
      final int attempts = row.attemptCount + 1;
      if (attempts >= _maxAttempts) {
        await _fail(
          row,
          error,
          committedPlaintextBytes,
          DateTime.now().toUtc(),
        );
        return;
      }
      await _dao.updateFields(
        DownloadedLessonsCompanion(
          lessonId: Value<String>(row.lessonId),
          state: const Value<DownloadState>(DownloadState.queued),
          bytesDownloaded: Value<int>(
            committedPlaintextBytes ?? row.bytesDownloaded,
          ),
          attemptCount: Value<int>(attempts),
          nextAttemptAt: const Value<DateTime?>(null),
          lastError: Value<String?>(error.toString()),
          updatedAt: Value<DateTime>(DateTime.now().toUtc()),
        ),
      );
      return;
    }

    final int? status = error is DioException
        ? error.response?.statusCode
        : null;
    final DateTime now = DateTime.now().toUtc();

    // 404 — the lesson or its file is gone server-side. Retrying cannot bring
    // it back, and burning five attempts on it delays everything behind it.
    if (status == 404) {
      await _fail(row, error, committedPlaintextBytes, now);
      return;
    }

    // 401 — the signed token expired mid-transfer, which is the *expected*
    // outcome of a pause longer than the 900s TTL. One free re-mint: requeue
    // with no backoff and no attempt burned, because nothing is actually wrong.
    // `_reminted` guards against a genuinely rejected identity looping forever.
    if (status == 401 && !_reminted.contains(row.lessonId)) {
      _reminted.add(row.lessonId);
      await _dao.updateFields(
        DownloadedLessonsCompanion(
          lessonId: Value<String>(row.lessonId),
          state: const Value<DownloadState>(DownloadState.queued),
          bytesDownloaded: Value<int>(
            committedPlaintextBytes ?? row.bytesDownloaded,
          ),
          nextAttemptAt: const Value<DateTime?>(null),
          updatedAt: Value<DateTime>(now),
        ),
      );
      return;
    }

    // 416 — the server's file changed under us, so every byte on disk is
    // suspect. Discard and start over rather than splice new bytes onto old.
    if (status == 416) {
      final File file = File(row.filePath);
      if (file.existsSync()) await file.delete();
      await _dao.updateFields(
        DownloadedLessonsCompanion(
          lessonId: Value<String>(row.lessonId),
          state: const Value<DownloadState>(DownloadState.queued),
          bytesDownloaded: const Value<int>(0),
          totalBytes: const Value<int?>(null),
          attemptCount: Value<int>(row.attemptCount + 1),
          nextAttemptAt: const Value<DateTime?>(null),
          lastError: Value<String?>(error.toString()),
          updatedAt: Value<DateTime>(now),
        ),
      );
      return;
    }

    final int attempts = row.attemptCount + 1;
    if (attempts >= _maxAttempts) {
      await _fail(row, error, committedPlaintextBytes, now);
      return;
    }

    // 2^n seconds, capped. Persisted rather than slept: the pump skips this row
    // until the window elapses and gets on with the rest of the queue.
    final Duration wait = Duration(
      seconds: min(1 << attempts, _maxBackoff.inSeconds),
    );
    await _dao.updateFields(
      DownloadedLessonsCompanion(
        lessonId: Value<String>(row.lessonId),
        state: const Value<DownloadState>(DownloadState.queued),
        bytesDownloaded: Value<int>(
          committedPlaintextBytes ?? row.bytesDownloaded,
        ),
        attemptCount: Value<int>(attempts),
        nextAttemptAt: Value<DateTime?>(now.add(wait)),
        lastError: Value<String?>(error.toString()),
        updatedAt: Value<DateTime>(now),
      ),
    );
  }

  Future<void> _fail(
    DownloadedLesson row,
    Object error,
    int? committedPlaintextBytes,
    DateTime now,
  ) => _dao.updateFields(
    DownloadedLessonsCompanion(
      lessonId: Value<String>(row.lessonId),
      state: const Value<DownloadState>(DownloadState.failed),
      bytesDownloaded: Value<int>(
        committedPlaintextBytes ?? row.bytesDownloaded,
      ),
      attemptCount: Value<int>(row.attemptCount + 1),
      nextAttemptAt: const Value<DateTime?>(null),
      lastError: Value<String?>(error.toString()),
      updatedAt: Value<DateTime>(now),
    ),
  );

  Future<void> _persistProgress(
    String lessonId,
    int bytesDownloaded,
    int? totalBytes,
  ) => _dao.updateFields(
    DownloadedLessonsCompanion(
      lessonId: Value<String>(lessonId),
      bytesDownloaded: Value<int>(bytesDownloaded),
      totalBytes: Value<int?>(totalBytes),
      updatedAt: Value<DateTime>(DateTime.now().toUtc()),
    ),
  );

  Future<void> _setState(String lessonId, DownloadState state) =>
      _dao.updateFields(
        DownloadedLessonsCompanion(
          lessonId: Value<String>(lessonId),
          state: Value<DownloadState>(state),
          updatedAt: Value<DateTime>(DateTime.now().toUtc()),
        ),
      );
}
