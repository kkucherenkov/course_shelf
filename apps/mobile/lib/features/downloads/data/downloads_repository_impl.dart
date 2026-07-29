import 'dart:async';
import 'dart:developer' as developer;
import 'dart:io';
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

/// The resource being resumed is not the one the bytes on disk came from.
///
/// Derived by the pump, never thrown by the byte source: it comes from
/// comparing the length the server reports now against the one recorded when
/// the transfer started. Its `toString()` is what lands in the row's
/// `lastError`, so it names both numbers.
class _ChangedResourceException implements Exception {
  const _ChangedResourceException({
    required this.expectedTotalBytes,
    required this.servedTotalBytes,
  });

  final int expectedTotalBytes;
  final int servedTotalBytes;

  @override
  String toString() =>
      'Lesson source changed size mid-download: the partial file came from a '
      '$expectedTotalBytes-byte resource, the server now serves '
      '$servedTotalBytes bytes';
}

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
    Duration Function(int attempt) backoff = _defaultBackoff,
  }) : _dao = dao,
       _byteSource = byteSource,
       _keyStore = keyStore,
       _scheduler = scheduler,
       _downloadsDirectory = downloadsDirectory,
       _isOnline = isOnline,
       _backoff = backoff;

  /// Blocks between Drift flushes. 16 x 256 KiB = 4 MiB — per-block would be
  /// ~3200 SQLite transactions for an 800 MB video to save at most 256 KiB of
  /// re-download.
  static const int _flushEveryBlocks = 16;

  static const int _maxAttempts = 5;

  /// 2^n seconds. Only attempts 1 through 4 ever reach here — the 5th fails
  /// the row outright — so the whole ladder is 2s, 4s, 8s, 16s and there is no
  /// ceiling to apply. (An earlier `min(..., 5 minutes)` documented a cap that
  /// `_maxAttempts` makes unreachable.)
  ///
  /// Injected so tests can collapse the window to zero without the production
  /// policy changing — a flapping connection still gets room to settle rather
  /// than spinning the radio.
  static Duration _defaultBackoff(int attempt) =>
      Duration(seconds: 1 << attempt);

  final DownloadsDao _dao;
  final LessonByteSource _byteSource;
  final DownloadKeyStore _keyStore;
  final DownloadSchedulerPort _scheduler;
  final Future<Directory> Function() _downloadsDirectory;
  final Future<bool> Function() _isOnline;
  final Duration Function(int attempt) _backoff;

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
    final DownloadedLesson? row = await _dao.byLessonId(lessonId);
    if (row == null) return;

    // Same guard `retry()` needs, for the same reason: `ChunkedGcmWriter.
    // resume` requires a block-aligned byte count and throws otherwise. A
    // `ready` row's count is `finish()`'s exact total, tail included, so a
    // `resume()` call racing a fast completion (or any other stale-UI call
    // on an already-`ready` row) must restart from zero rather than hand a
    // resume a count it cannot honor. The ordinary case — un-pausing a row
    // genuinely mid-download — is always block-aligned already (see
    // `retry()`'s doc) and is left untouched here.
    final bool blockAligned =
        row.bytesDownloaded % EncryptedFileFormat.blockSize == 0;

    // A row that backed off, was paused, and is now resumed would otherwise go
    // back to `queued` carrying a stale future `nextAttemptAt`: `nextQueued`
    // skips it, so the user taps Resume and nothing happens for up to 16
    // seconds, with no state change to explain the wait. The re-mint budget
    // comes back for the same reason — a pause outliving the 900s token TTL is
    // the *expected* 401, and resume is the gesture that follows it.
    //
    // `attemptCount` is deliberately untouched: resetting the budget is
    // `retry()`'s job, and un-pausing is not a fresh budget.
    _reminted.remove(lessonId);

    await _dao.updateFields(
      DownloadedLessonsCompanion(
        lessonId: Value<String>(lessonId),
        state: const Value<DownloadState>(DownloadState.queued),
        bytesDownloaded: blockAligned
            ? const Value<int>.absent()
            : const Value<int>(0),
        totalBytes: blockAligned
            ? const Value<int?>.absent()
            : const Value<int?>(null),
        nextAttemptAt: const Value<DateTime?>(null),
        updatedAt: Value<DateTime>(DateTime.now().toUtc()),
      ),
    );
    await _scheduler.ensureScheduled();
    _kick();
  }

  @override
  Future<void> cancel(String lessonId) async {
    if (_activeLessonId == lessonId) {
      _activeCancel?.cancel('cancelled');
    }
    // A lesson cancelled after a 401 re-mint and re-enqueued under the same
    // id in this process must get its free re-mint back — the cancelled
    // attempt never proved the identity is genuinely rejected.
    _reminted.remove(lessonId);
    // Deletes the row and reads its `filePath` back in one round trip: a
    // separate `SELECT` then `DELETE` would give the pump's own claim an
    // extra async gap to race through before the row is actually gone.
    final DownloadedLesson? row = await _dao.removeAndReturn(lessonId);
    if (row != null) {
      final File file = File(row.filePath);
      if (file.existsSync()) await file.delete();
    }
  }

  @override
  Future<void> retry(String lessonId) async {
    final DownloadedLesson? row = await _dao.byLessonId(lessonId);
    if (row == null) return;
    // An explicit user retry clears the backoff window and the re-mint guard —
    // they asked for it now, not after the timer the last failure set. It
    // also resets the attempt budget to 0 rather than incrementing it: a
    // `failed` row is already at the cap, so incrementing would give it
    // exactly one more attempt before landing permanently stuck.
    _reminted.remove(lessonId);

    // `ChunkedGcmWriter.resume` requires a block-aligned byte count and
    // throws `ArgumentError` otherwise. A `ready` row's `bytesDownloaded` is
    // `finish()`'s exact total, tail included — block-aligned only by
    // coincidence — so retrying (or resuming) it must restart from zero
    // rather than hand `resume` a count it cannot honor.
    final bool blockAligned =
        row.bytesDownloaded % EncryptedFileFormat.blockSize == 0;

    await _dao.updateFields(
      DownloadedLessonsCompanion(
        lessonId: Value<String>(lessonId),
        state: const Value<DownloadState>(DownloadState.queued),
        bytesDownloaded: Value<int>(blockAligned ? row.bytesDownloaded : 0),
        totalBytes: blockAligned
            ? const Value<int?>.absent()
            : const Value<int?>(null),
        attemptCount: const Value<int>(0),
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
    //
    // Re-queued rather than paused: these were genuinely in flight when the
    // process died, so resuming them is what "resume-on-launch" means. A
    // download the user paused deliberately is already `paused`, not
    // `downloading`, so this cannot override their intent.
    final List<DownloadedLesson> stranded = await _dao.byState(
      DownloadState.downloading,
    );
    for (final DownloadedLesson row in stranded) {
      await _setState(row.lessonId, DownloadState.queued);
    }
    if (stranded.isNotEmpty) _kick();
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

  @override
  Future<void> drain() async {
    _kick();
    await _pump;
  }

  // ── Pump ────────────────────────────────────────────────────────────────

  void _kick() {
    if (_pump != null) return;
    final Future<void> pass = _drain();
    _pump = pass;
    // `pass` (not this chain's result) is what `_pump` holds and what `drain`
    // awaits, so a genuine bug there still surfaces to its caller.
    // This chain exists only to give production's fire-and-forget callers
    // (`enqueueLesson`, `resume`, `retry` all call `_kick()` and walk away —
    // only `drain` awaits `_pump`) a terminal handler: without one, an
    // error escaping `_drain` (`nextQueued`/`isOnline` throwing, or
    // `_onFailure`'s own DB write failing) would be an unhandled error on a
    // Future nobody in production is listening to. There is nothing more
    // useful to do with it than log it and end this pass — the next
    // `_kick()` starts a fresh one, and `reconcileAfterRestart` recovers
    // anything left mid-flight.
    pass
        .catchError((Object error, StackTrace stackTrace) {
          developer.log(
            'Download pump pass failed',
            error: error,
            stackTrace: stackTrace,
            name: 'DownloadsRepositoryImpl',
          );
        })
        .whenComplete(() => _pump = null);
  }

  Future<void> _drain() async {
    while (true) {
      // Rows still inside their backoff window are skipped, not waited on, so a
      // single unreachable lesson never blocks the ones behind it.
      final DownloadedLesson? next = await _dao.nextQueued(
        now: DateTime.now().toUtc(),
      );
      if (next == null) return;

      // Claimed here, before `isOnline()` — a real platform-channel round
      // trip — rather than inside `_download`. A `cancel()`/`pause()` landing
      // in that window must see this lesson as the active one.
      _activeLessonId = next.lessonId;

      if (!await _isOnline()) {
        // Not an error: leave the row queued and burn no attempt. The scheduler
        // and resume-on-launch will come back to it.
        _activeLessonId = null;
        return;
      }

      await _download(next);
    }
  }

  Future<void> _download(DownloadedLesson selected) async {
    final CancelToken cancelToken = CancelToken();
    _activeCancel = cancelToken;

    ChunkedGcmWriter? writer;
    DownloadedLesson row = selected;
    try {
      // Compare-and-swap: only applies while the row is still `queued`. A
      // `pause()` (moves it to `paused`) or a `cancel()` (deletes it) landing
      // in the window between `_drain` claiming this lesson (above) and this
      // write — `isOnline()` is a real platform-channel round trip — affects 0
      // rows, and this pass drops the claim instead of overwriting the user's
      // intent or resurrecting a deleted row.
      final int claimed = await _dao.claimForDownload(
        selected.lessonId,
        DateTime.now().toUtc(),
      );
      if (claimed == 0) {
        return;
      }

      // A `retry()` in that same window is *not* excluded: it sets the row
      // back to `queued`, which is exactly what the swap matches, so the claim
      // succeeds over it. Re-reading here is what makes that harmless —
      // `selected` is a pre-retry snapshot whose `bytesDownloaded` may be the
      // non-block-aligned `finish()` total retry has since reset to 0, and
      // whose `attemptCount` retry has since zeroed. Everything below uses the
      // fresh copy, so no path can run on a stale snapshot.
      final DownloadedLesson? claimedRow = await _dao.byLessonId(
        selected.lessonId,
      );
      if (claimedRow == null) return;
      row = claimedRow;

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

      // A resume sends `Range: bytes=<offset>-` with no validator — no
      // `If-Range`, no ETag — so a lesson re-encoded between pause and resume
      // splices its new bytes straight onto the old ones. Nothing downstream
      // notices: every per-block MAC still verifies (the blocks are sealed
      // here, not by the server), and the completion write overwrites
      // `totalBytes` with the new total, so the planned pre-play size check
      // passes too. The resource's own length is the only validator available
      // without a new wire contract, so a changed one is treated exactly like
      // a 416 — discard everything and start over. Restarting matters beyond
      // the splice: `create()` mints a fresh `fileNonce`, whereas continuing
      // into the existing container would re-seal block indices that the old
      // nonce has already covered with different plaintext.
      final int? expectedTotal = row.totalBytes;
      final int? servedTotal = response.totalBytes;
      if (row.bytesDownloaded > 0 &&
          expectedTotal != null &&
          servedTotal != null &&
          servedTotal != expectedTotal) {
        throw _ChangedResourceException(
          expectedTotalBytes: expectedTotal,
          servedTotalBytes: servedTotal,
        );
      }

      // Recorded on the first response that knows it, not only on the 4 MiB
      // flush: the check above can only fire against a total that was actually
      // persisted, and `_onFailure` persists `bytesDownloaded` without ever
      // persisting `totalBytes`. Without this, any transfer that dropped
      // inside its first 4 MiB would resume with no recorded total and splice
      // undetected.
      if (expectedTotal == null && servedTotal != null) {
        await _persistProgress(row.lessonId, startOffset, servedTotal);
      }

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
      // Deliberately not `writer?.finish()`: that would seal the buffered
      // partial block as block N, but the row persists the pre-flush
      // block-aligned count, so the next attempt's `resume` truncates block N
      // away and re-seals index N — same file nonce, same index, different
      // plaintext. That is nonce reuse under one key, the one failure AES-GCM
      // does not survive. The ordinary crash path is safe only because
      // nothing seals a tail, so the re-fetched block is byte-identical.
      final int? committed = writer?.committedPlaintextBytes;
      try {
        await writer?.close();
      } on Object catch (_) {
        // A close failure must not prevent the failure below from being
        // recorded — that write is what lets the next pump pass (or
        // reconcileAfterRestart) recover this lesson.
      }
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
    // it carries no HTTP status and cannot be a 401/404/416. It is still a
    // transient failure like any other 5xx: it falls through to the same
    // persisted 2^n backoff below — 2s, 4s, 8s, 16s, then `failed` on the 5th
    // attempt — so a flapping connection gets room to settle rather than
    // spinning the radio in a tight retry loop against a host that keeps
    // refusing it.
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

    // 416, or a resource whose length no longer matches the one the partial
    // file came from — the server's file changed under us, so every byte on
    // disk is suspect. Discard and start over rather than splice new bytes
    // onto old. The two are the same condition seen from opposite sides: 416
    // is the server saying the old offset is past the end of the new file, and
    // a changed total is the new file still being long enough to answer at
    // that offset with bytes from somewhere else entirely.
    //
    // Routed through the same attempts gate and backoff as everything else:
    // a server that keeps answering 416 (a zero-length asset makes
    // `Range: bytes=0-` unsatisfiable, which is exactly the state a restart
    // produces) is a server-side fault, not a cheap retry, and without the
    // gate this row would re-select itself at the FIFO head forever —
    // `nextAttemptAt` stays null and `queuedAt` never moves — starving every
    // healthy lesson behind it and never letting `_drain` return.
    if (status == 416 || error is _ChangedResourceException) {
      final int attempts = row.attemptCount + 1;
      final File file = File(row.filePath);
      if (file.existsSync()) await file.delete();

      if (attempts >= _maxAttempts) {
        await _fail(row, error, 0, now);
        return;
      }

      await _dao.updateFields(
        DownloadedLessonsCompanion(
          lessonId: Value<String>(row.lessonId),
          state: const Value<DownloadState>(DownloadState.queued),
          bytesDownloaded: const Value<int>(0),
          totalBytes: const Value<int?>(null),
          attemptCount: Value<int>(attempts),
          nextAttemptAt: Value<DateTime?>(now.add(_backoff(attempts))),
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

    // Persisted rather than slept: the pump skips this row until the window
    // elapses and gets on with the rest of the queue.
    final Duration wait = _backoff(attempts);
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

  /// Returns the number of rows affected — `0` means the row was gone
  /// (`cancel()` deleted it), which `_download` uses to abort before opening
  /// anything.
  Future<int> _setState(String lessonId, DownloadState state) =>
      _dao.updateFields(
        DownloadedLessonsCompanion(
          lessonId: Value<String>(lessonId),
          state: Value<DownloadState>(state),
          updatedAt: Value<DateTime>(DateTime.now().toUtc()),
        ),
      );
}
