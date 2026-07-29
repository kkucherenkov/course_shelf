import 'dart:async';
import 'dart:io';
import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:drift/drift.dart' show Value;
import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:app_mobile/features/downloads/data/chunked_gcm_reader.dart';
import 'package:app_mobile/features/downloads/data/downloads_repository_impl.dart';
import 'package:app_mobile/features/downloads/domain/download_item.dart';
import 'package:app_mobile/features/downloads/domain/download_key_store.dart';
import 'package:app_mobile/features/downloads/domain/download_scheduler_port.dart';
import 'package:app_mobile/features/downloads/domain/encrypted_file_format.dart';
import 'package:app_mobile/features/downloads/domain/lesson_byte_source.dart';
import 'package:app_mobile/shared/db/app_database.dart';
import 'package:app_mobile/shared/db/tables/downloaded_lessons.dart';

class _FixedKeyStore implements DownloadKeyStore {
  @override
  Future<Uint8List> keyForDevice() async =>
      Uint8List.fromList(List<int>.generate(32, (int i) => i));
}

class _RecordingScheduler implements DownloadSchedulerPort {
  int scheduled = 0;
  int cancelled = 0;

  @override
  Future<void> ensureScheduled() async => scheduled++;

  @override
  Future<void> cancelAll() async => cancelled++;
}

/// Serves a fixed payload, optionally aborting partway through to model a
/// dropped connection. Records the offset of every fetch so the test can prove
/// the resume asked for the right byte.
class _ScriptedByteSource implements LessonByteSource {
  _ScriptedByteSource({required this.payload, this.abortAfter});

  final Uint8List payload;
  final int? abortAfter;

  final List<int> offsets = <int>[];
  bool aborted = false;

  @override
  Future<RangedResponse> fetchFrom({
    required String lessonId,
    required int offset,
    CancelToken? cancelToken,
  }) async {
    offsets.add(offset);
    final Uint8List slice = Uint8List.sublistView(payload, offset);

    if (abortAfter != null && !aborted) {
      aborted = true;
      final int cut = abortAfter!;
      return RangedResponse(
        bytes:
            Stream<Uint8List>.fromIterable(<Uint8List>[
              Uint8List.sublistView(slice, 0, cut),
            ]).followedBy(
              Stream<Uint8List>.error(
                DioException.connectionError(
                  requestOptions: RequestOptions(),
                  reason: 'socket closed',
                ),
              ),
            ),
        totalBytes: payload.length,
      );
    }

    return RangedResponse(
      bytes: Stream<Uint8List>.value(slice),
      totalBytes: payload.length,
    );
  }
}

extension _Followed on Stream<Uint8List> {
  Stream<Uint8List> followedBy(Stream<Uint8List> next) async* {
    yield* this;
    yield* next;
  }
}

/// Fails the first fetch with a given HTTP status, then serves normally.
/// Models an expired token, a changed source file, or a deleted lesson.
class _StatusFailingByteSource implements LessonByteSource {
  _StatusFailingByteSource({
    required this.status,
    required this.payload,
    this.alwaysFailLessonId,
  });

  final int status;
  final Uint8List payload;

  /// When set, that lesson fails on every call and every other lesson always
  /// succeeds. When null, only the first call fails.
  final String? alwaysFailLessonId;

  int calls = 0;

  @override
  Future<RangedResponse> fetchFrom({
    required String lessonId,
    required int offset,
    CancelToken? cancelToken,
  }) async {
    calls++;
    final bool shouldFail = alwaysFailLessonId == null
        ? calls == 1
        : lessonId == alwaysFailLessonId;
    if (shouldFail) {
      throw DioException.badResponse(
        statusCode: status,
        requestOptions: RequestOptions(),
        response: Response<void>(
          statusCode: status,
          requestOptions: RequestOptions(),
        ),
      );
    }
    return RangedResponse(
      bytes: Stream<Uint8List>.value(Uint8List.sublistView(payload, offset)),
      totalBytes: payload.length,
    );
  }
}

/// Yields [payload] in fixed-size pieces rather than one `Stream.value`
/// chunk, so the per-chunk mechanics (the flush cadence, progress ticks,
/// mid-flight pause) are actually exercised instead of completing in one
/// step. [onBeforeChunk], when given, is awaited before each chunk is
/// produced — since an `async*` generator only advances past a `yield` once
/// its single subscriber asks for the next value, this lets a test
/// deterministically observe (or act on) exactly what has been committed so
/// far, with no reliance on real wall-clock timing.
///
/// Also honors [CancelToken] cancellation, mirroring what a real Dio stream
/// does: once cancelled, the stream errors with the token's `cancelError`
/// (type `cancel`) instead of continuing to emit, which is what lets a
/// mid-flight `pause()`/`cancel()` actually stop the download rather than
/// being silently overwritten once the fake source runs to completion.
class _FlushObservingByteSource implements LessonByteSource {
  _FlushObservingByteSource({
    required this.payload,
    required this.chunkSize,
    this.onBeforeChunk,
  });

  final Uint8List payload;
  final int chunkSize;
  final Future<void> Function(int chunkIndex)? onBeforeChunk;

  @override
  Future<RangedResponse> fetchFrom({
    required String lessonId,
    required int offset,
    CancelToken? cancelToken,
  }) async {
    return RangedResponse(
      bytes: _chunks(offset, cancelToken),
      totalBytes: payload.length,
    );
  }

  Stream<Uint8List> _chunks(int offset, CancelToken? cancelToken) async* {
    int index = 0;
    int position = offset;
    while (position < payload.length) {
      final Future<void> Function(int)? hook = onBeforeChunk;
      if (hook != null) await hook(index);
      if (cancelToken?.isCancelled ?? false) {
        throw cancelToken!.cancelError!;
      }
      final int end = (position + chunkSize).clamp(0, payload.length);
      yield Uint8List.sublistView(payload, position, end);
      position = end;
      index++;
    }
  }
}

void main() {
  late AppDatabase db;
  late Directory dir;
  late _RecordingScheduler scheduler;

  Uint8List payload(int length) =>
      Uint8List.fromList(List<int>.generate(length, (int i) => i % 251));

  // Collapses the persisted backoff to zero so a test's single
  // `drainForTest()` pass can observe a retry without waiting out the real
  // window. The two tests that assert the production formula itself
  // construct `DownloadsRepositoryImpl` directly instead of going through
  // this helper, so they get the real default.
  DownloadsRepositoryImpl build(
    LessonByteSource source, {
    bool online = true,
  }) => DownloadsRepositoryImpl(
    dao: DownloadsDao(db),
    byteSource: source,
    keyStore: _FixedKeyStore(),
    scheduler: scheduler,
    downloadsDirectory: () async => dir,
    isOnline: () async => online,
    backoff: (_) => Duration.zero,
  );

  setUp(() async {
    db = AppDatabase(NativeDatabase.memory());
    dir = await Directory.systemTemp.createTemp('csdl_repo');
    scheduler = _RecordingScheduler();
  });

  tearDown(() async {
    await db.close();
    await dir.delete(recursive: true);
  });

  test('a clean download ends ready with the plaintext intact', () async {
    final Uint8List source = payload(EncryptedFileFormat.blockSize + 777);
    final DownloadsRepositoryImpl repo = build(
      _ScriptedByteSource(payload: source),
    );

    await repo.enqueueLesson('l1', courseId: 'c1');
    await repo.drainForTest();

    final DownloadedLesson? row = await db.downloadsDao.byLessonId('l1');
    expect(row?.state, DownloadState.ready);
    expect(row?.bytesDownloaded, source.length);
    expect(row?.totalBytes, source.length);

    final ChunkedGcmReader reader = await ChunkedGcmReader.open(
      file: File(row!.filePath),
      key: await _FixedKeyStore().keyForDevice(),
    );
    expect(await reader.read(0, reader.plaintextLength), source);
    await reader.close();
  });

  test('a dropped socket resumes from the last committed block', () async {
    final Uint8List source = payload(EncryptedFileFormat.blockSize * 3);
    final _ScriptedByteSource script = _ScriptedByteSource(
      payload: source,
      // Abort after 1.5 blocks: one block is committed, the half is discarded.
      abortAfter:
          EncryptedFileFormat.blockSize + EncryptedFileFormat.blockSize ~/ 2,
    );
    final DownloadsRepositoryImpl repo = build(script);

    await repo.enqueueLesson('l1');
    await repo.drainForTest();

    expect(script.offsets.first, 0);
    expect(
      script.offsets.last,
      EncryptedFileFormat.blockSize,
      reason: 'resume starts at the last committed block, not mid-block',
    );

    final DownloadedLesson? row = await db.downloadsDao.byLessonId('l1');
    expect(row?.state, DownloadState.ready);
    expect(row?.bytesDownloaded, source.length);
  });

  test('offline keeps the row queued and burns no attempt', () async {
    final DownloadsRepositoryImpl repo = build(
      _ScriptedByteSource(payload: payload(10)),
      online: false,
    );

    await repo.enqueueLesson('l1');
    await repo.drainForTest();

    final DownloadedLesson? row = await db.downloadsDao.byLessonId('l1');
    expect(row?.state, DownloadState.queued);
    expect(row?.attemptCount, 0);
  });

  test('404 fails at once instead of spending five attempts', () async {
    final DownloadsRepositoryImpl repo = build(
      _StatusFailingByteSource(status: 404, payload: payload(10)),
    );

    await repo.enqueueLesson('l1');
    await repo.drainForTest();

    final DownloadedLesson? row = await db.downloadsDao.byLessonId('l1');
    expect(row?.state, DownloadState.failed);
    expect(row?.attemptCount, 1, reason: 'retrying cannot un-delete a lesson');
  });

  test('401 re-mints once, burns no attempt, and completes', () async {
    final Uint8List source = payload(2048);
    final _StatusFailingByteSource script = _StatusFailingByteSource(
      status: 401,
      payload: source,
    );
    final DownloadsRepositoryImpl repo = build(script);

    await repo.enqueueLesson('l1');
    await repo.drainForTest();

    final DownloadedLesson? row = await db.downloadsDao.byLessonId('l1');
    expect(row?.state, DownloadState.ready);
    // A token that outlived its 900s TTL during a pause is the expected case,
    // not a fault — it must not count against the retry budget.
    expect(row?.attemptCount, 0);
    expect(script.calls, 2);
  });

  test('416 discards the partial file and restarts from zero', () async {
    final Uint8List source = payload(EncryptedFileFormat.blockSize * 2);
    final DownloadsRepositoryImpl repo = build(
      _StatusFailingByteSource(status: 416, payload: source),
    );

    await repo.enqueueLesson('l1');
    await repo.drainForTest();

    final DownloadedLesson? row = await db.downloadsDao.byLessonId('l1');
    expect(row?.state, DownloadState.ready);
    expect(row?.bytesDownloaded, source.length);
  });

  test(
    'a transient failure parks the row rather than sleeping on it',
    () async {
      final Stopwatch clock = Stopwatch()..start();
      // Constructed directly, without the `build()` helper's zero-backoff
      // override, so this genuinely proves the persisted 2^n window rather
      // than a window that was collapsed to nothing.
      final DownloadsRepositoryImpl repo = DownloadsRepositoryImpl(
        dao: DownloadsDao(db),
        byteSource: _StatusFailingByteSource(
          status: 500,
          payload: payload(10),
          alwaysFailLessonId: 'l1',
        ),
        keyStore: _FixedKeyStore(),
        scheduler: scheduler,
        downloadsDirectory: () async => dir,
        isOnline: () async => true,
      );

      await repo.enqueueLesson('l1');
      await repo.drainForTest();
      clock.stop();

      final DownloadedLesson? row = await db.downloadsDao.byLessonId('l1');
      expect(row?.state, DownloadState.queued);
      expect(row?.attemptCount, 1);
      expect(row?.nextAttemptAt?.isAfter(DateTime.now().toUtc()), isTrue);
      // The pump returns immediately; the backoff lives in the row, not in an
      // await. If this ever sleeps, the assertion below is what catches it.
      expect(clock.elapsed, lessThan(const Duration(seconds: 2)));
    },
  );

  test('a backed-off item does not block a healthy one behind it', () async {
    final Uint8List source = payload(2048);
    // Constructed directly, without the `build()` helper's zero-backoff
    // override, so 'bad' genuinely lands in a future backoff window — the
    // property this test exists to prove only means something if the skip
    // is real.
    final DownloadsRepositoryImpl repo = DownloadsRepositoryImpl(
      dao: DownloadsDao(db),
      byteSource: _StatusFailingByteSource(
        status: 500,
        payload: source,
        alwaysFailLessonId: 'bad',
      ),
      keyStore: _FixedKeyStore(),
      scheduler: scheduler,
      downloadsDirectory: () async => dir,
      isOnline: () async => true,
    );

    // 'bad' is enqueued first, so FIFO puts it at the head of the queue.
    await repo.enqueueLesson('bad');
    await repo.enqueueLesson('good');
    await repo.drainForTest();

    expect(
      (await db.downloadsDao.byLessonId('bad'))?.state,
      DownloadState.queued,
    );
    expect(
      (await db.downloadsDao.byLessonId('good'))?.state,
      DownloadState.ready,
      reason: 'a whole-course enqueue must not stall behind one bad lesson',
    );
  });

  test('cancel deletes both the row and the partial file', () async {
    final Uint8List source = payload(EncryptedFileFormat.blockSize * 2);
    final DownloadsRepositoryImpl repo = build(
      _ScriptedByteSource(payload: source),
    );

    await repo.enqueueLesson('l1');
    await repo.drainForTest();
    final String path = (await db.downloadsDao.byLessonId('l1'))!.filePath;

    await repo.cancel('l1');

    expect(await db.downloadsDao.byLessonId('l1'), isNull);
    expect(File(path).existsSync(), isFalse);
  });

  test('a pause landing before the claim is not overwritten', () async {
    final DownloadsRepositoryImpl repo = build(
      _ScriptedByteSource(payload: payload(2048)),
    );

    await repo.enqueueLesson('l1');
    await repo.pause('l1');
    await repo.drainForTest();

    final DownloadedLesson? row = await db.downloadsDao.byLessonId('l1');
    expect(
      row?.state,
      DownloadState.paused,
      reason: "the pump must not overwrite the user's pause",
    );
    expect(row?.bytesDownloaded, 0, reason: 'nothing should have been fetched');
  });

  test('a cancel landing before the claim leaves no orphan file', () async {
    final DownloadsRepositoryImpl repo = build(
      _ScriptedByteSource(payload: payload(2048)),
    );

    await repo.enqueueLesson('l1');
    // Computed, not read back from the DB: an extra `await` here (reading the
    // row just written) gives the fire-and-forget pump one more event-loop
    // turn to race ahead of `cancel()` below — `enqueueLesson`'s own path
    // construction is deterministic (`'${dir.path}/$lessonId.csdl'` for a
    // fresh lesson), so there is no need to pay for that turn.
    final String path = '${dir.path}/l1.csdl';
    await repo.cancel('l1');
    await repo.drainForTest();

    expect(await db.downloadsDao.byLessonId('l1'), isNull);
    expect(
      File(path).existsSync(),
      isFalse,
      reason: 'an aborted claim must not re-create the ciphertext file',
    );
  });

  test('reconcileAfterRestart moves a killed download to paused', () async {
    await db.downloadsDao.upsert(
      DownloadedLessonsCompanion.insert(
        lessonId: 'l1',
        state: DownloadState.downloading,
        filePath: '${dir.path}/l1.csdl',
        updatedAt: DateTime.utc(2026, 7, 29),
        queuedAt: Value<DateTime?>(DateTime.utc(2026, 7, 29)),
      ),
    );

    await build(
      _ScriptedByteSource(payload: payload(1)),
    ).reconcileAfterRestart();

    final DownloadedLesson? row = await db.downloadsDao.byLessonId('l1');
    expect(row?.state, DownloadState.paused);
  });

  test('enqueue asks the OS for a background window', () async {
    final DownloadsRepositoryImpl repo = build(
      _ScriptedByteSource(payload: payload(10)),
      online: false,
    );

    await repo.enqueueLesson('l1');

    expect(scheduler.scheduled, greaterThan(0));
  });

  test('enqueueCourse skips lessons that are already ready', () async {
    await db.downloadsDao.upsert(
      DownloadedLessonsCompanion.insert(
        lessonId: 'done',
        state: DownloadState.ready,
        filePath: '${dir.path}/done.csdl',
        updatedAt: DateTime.utc(2026, 7, 29),
        courseId: const Value<String?>('c1'),
        queuedAt: Value<DateTime?>(DateTime.utc(2026, 7, 29)),
      ),
    );

    final DownloadsRepositoryImpl repo = build(
      _ScriptedByteSource(payload: payload(10)),
      online: false,
    );
    await repo.enqueueCourse('c1', <String>['done', 'fresh']);

    expect(
      (await db.downloadsDao.byLessonId('done'))?.state,
      DownloadState.ready,
    );
    expect(
      (await db.downloadsDao.byLessonId('fresh'))?.state,
      DownloadState.queued,
    );
  });

  test(
    'watch emits a downloading tick with non-zero bytes, then ready',
    () async {
      // Two chunks, so the in-memory `_progress` tick after the first one
      // fires — with real bytes committed — before the row ever reaches
      // `ready`. A single-chunk source (the DAO-only case the old version of
      // this test used) can pass without `StreamGroup.merge` or a single
      // `_progress.add` call ever being exercised.
      final Uint8List source = payload(EncryptedFileFormat.blockSize * 2);
      final DownloadsRepositoryImpl repo = build(
        _FlushObservingByteSource(
          payload: source,
          chunkSize: EncryptedFileFormat.blockSize,
        ),
      );

      final List<DownloadItem?> items = <DownloadItem?>[];
      final Completer<void> reachedReady = Completer<void>();
      final StreamSubscription<DownloadItem?> subscription = repo
          .watch('l1')
          .listen((DownloadItem? item) {
            items.add(item);
            if (item?.state == DownloadState.ready &&
                !reachedReady.isCompleted) {
              reachedReady.complete();
            }
          });

      await repo.enqueueLesson('l1');
      await repo.drainForTest();
      await reachedReady.future;
      await subscription.cancel();

      expect(
        items.any(
          (DownloadItem? i) =>
              i?.state == DownloadState.downloading &&
              (i?.bytesDownloaded ?? 0) > 0,
        ),
        isTrue,
        reason:
            'a real in-flight progress tick must actually arrive, not just '
            'the DAO half of the merged stream',
      );
      expect(items.last?.state, DownloadState.ready);
      expect(items.last?.bytesDownloaded, source.length);
    },
  );

  test(
    'the 4 MiB flush cadence persists an intermediate byte count before completion',
    () async {
      // 17 one-block chunks: the 16th completes the flush threshold exactly,
      // and the 17th is the short remainder that finishes the download. Every
      // prior test's payload topped out at 3 blocks against a 16-block
      // threshold, so `_persistProgress`'s flush branch never actually ran.
      const int totalBlocks = 17;
      final Uint8List source = payload(
        EncryptedFileFormat.blockSize * totalBlocks,
      );
      bool observedIntermediateFlush = false;

      final _FlushObservingByteSource fake = _FlushObservingByteSource(
        payload: source,
        chunkSize: EncryptedFileFormat.blockSize,
        onBeforeChunk: (int index) async {
          // About to yield the 17th (final) chunk: the prior 16 have already
          // been committed and awaited by `_download`'s `await for`, so the
          // flush this commit is named for must already be in the DB.
          if (index == 16) {
            final DownloadedLesson? row = await db.downloadsDao.byLessonId(
              'l1',
            );
            expect(row?.bytesDownloaded, EncryptedFileFormat.blockSize * 16);
            expect(row?.state, DownloadState.downloading);
            observedIntermediateFlush = true;
          }
        },
      );

      final DownloadsRepositoryImpl repo = build(fake);
      await repo.enqueueLesson('l1');
      await repo.drainForTest();

      expect(
        observedIntermediateFlush,
        isTrue,
        reason: 'the flush assertion must actually have run',
      );
      final DownloadedLesson? row = await db.downloadsDao.byLessonId('l1');
      expect(row?.state, DownloadState.ready);
      expect(row?.bytesDownloaded, source.length);
    },
  );

  test(
    'pausing mid-flight parks the row with a block-aligned byte count',
    () async {
      final Uint8List source = payload(EncryptedFileFormat.blockSize * 3);
      late DownloadsRepositoryImpl repo;

      final _FlushObservingByteSource fake = _FlushObservingByteSource(
        payload: source,
        chunkSize: EncryptedFileFormat.blockSize,
        onBeforeChunk: (int index) async {
          // One whole block (chunk 0) is already committed. Pause before the
          // second block arrives, while bytes are still (notionally) in
          // flight, and prove the row lands on a block-aligned count rather
          // than whatever the writer's internal buffer happened to hold.
          if (index == 1) {
            await repo.pause('l1');
          }
        },
      );

      repo = build(fake);
      await repo.enqueueLesson('l1');
      await repo.drainForTest();

      final DownloadedLesson? row = await db.downloadsDao.byLessonId('l1');
      expect(row?.state, DownloadState.paused);
      expect(row?.bytesDownloaded, EncryptedFileFormat.blockSize);
    },
  );

  test('pause parks a not-yet-started row', () async {
    final DownloadsRepositoryImpl repo = build(
      _ScriptedByteSource(payload: payload(10)),
      online: false,
    );
    await repo.enqueueLesson('l1');

    await repo.pause('l1');

    final DownloadedLesson? row = await db.downloadsDao.byLessonId('l1');
    expect(row?.state, DownloadState.paused);
  });

  test('resume requeues a paused row and the pump completes it', () async {
    bool online = false;
    final DownloadsRepositoryImpl repo = DownloadsRepositoryImpl(
      dao: DownloadsDao(db),
      byteSource: _ScriptedByteSource(payload: payload(10)),
      keyStore: _FixedKeyStore(),
      scheduler: scheduler,
      downloadsDirectory: () async => dir,
      isOnline: () async => online,
      backoff: (_) => Duration.zero,
    );

    await repo.enqueueLesson('l1');
    await repo.pause('l1');
    expect(
      (await db.downloadsDao.byLessonId('l1'))?.state,
      DownloadState.paused,
    );

    online = true;
    await repo.resume('l1');
    await repo.drainForTest();

    final DownloadedLesson? row = await db.downloadsDao.byLessonId('l1');
    expect(row?.state, DownloadState.ready);
    expect(
      scheduler.scheduled,
      greaterThan(1),
      reason: 'resume asks for another background window too',
    );
  });

  test('resume on a non-block-aligned byte count restarts from zero instead of '
      'throwing', () async {
    // A stale UI call racing a fast completion (or any other call on an
    // already-`ready` row) hits the same non-block-aligned count `retry()`
    // guards against — `resume()` must not hand it to `ChunkedGcmWriter.
    // resume` either.
    const int oddCount = EncryptedFileFormat.blockSize + 777;
    final String filePath = '${dir.path}/l1.csdl';
    await db.downloadsDao.upsert(
      DownloadedLessonsCompanion.insert(
        lessonId: 'l1',
        state: DownloadState.ready,
        filePath: filePath,
        updatedAt: DateTime.utc(2026, 7, 29),
        queuedAt: Value<DateTime?>(DateTime.utc(2026, 7, 29)),
        bytesDownloaded: const Value<int>(oddCount),
        totalBytes: const Value<int?>(oddCount),
      ),
    );
    await File(
      filePath,
    ).writeAsBytes(List<int>.filled(EncryptedFileFormat.headerLength + 100, 0));

    final Uint8List source = payload(500);
    final DownloadsRepositoryImpl repo = build(
      _ScriptedByteSource(payload: source),
    );

    await repo.resume('l1');
    await repo.drainForTest();

    final DownloadedLesson? row = await db.downloadsDao.byLessonId('l1');
    expect(row?.state, DownloadState.ready);
    expect(row?.bytesDownloaded, source.length);
  });

  test(
    'retry resets the attempt budget instead of incrementing past the cap',
    () async {
      await db.downloadsDao.upsert(
        DownloadedLessonsCompanion.insert(
          lessonId: 'l1',
          state: DownloadState.failed,
          filePath: '${dir.path}/l1.csdl',
          updatedAt: DateTime.utc(2026, 7, 29),
          queuedAt: Value<DateTime?>(DateTime.utc(2026, 7, 29)),
          attemptCount: const Value<int>(5),
        ),
      );

      final DownloadsRepositoryImpl repo = build(
        _ScriptedByteSource(payload: payload(10)),
      );
      await repo.retry('l1');

      final DownloadedLesson? afterRetry = await db.downloadsDao.byLessonId(
        'l1',
      );
      expect(
        afterRetry?.attemptCount,
        0,
        reason:
            'a fresh retry gets a full budget, not one more increment past '
            'the cap',
      );
      expect(afterRetry?.state, DownloadState.queued);

      await repo.drainForTest();
      expect(
        (await db.downloadsDao.byLessonId('l1'))?.state,
        DownloadState.ready,
      );
    },
  );

  test('retry on a non-block-aligned byte count restarts from zero instead of '
      'throwing', () async {
    // Mirrors what `finish()` actually persists for a `ready` row: the
    // exact tail-included total, which is block-aligned only by
    // coincidence.
    const int oddCount = EncryptedFileFormat.blockSize + 777;
    final String filePath = '${dir.path}/l1.csdl';
    await db.downloadsDao.upsert(
      DownloadedLessonsCompanion.insert(
        lessonId: 'l1',
        state: DownloadState.failed,
        filePath: filePath,
        updatedAt: DateTime.utc(2026, 7, 29),
        queuedAt: Value<DateTime?>(DateTime.utc(2026, 7, 29)),
        bytesDownloaded: const Value<int>(oddCount),
        totalBytes: const Value<int?>(oddCount),
      ),
    );
    // A stale file left on disk from whatever produced the non-aligned
    // count. Without the fix, `_download` sees `bytesDownloaded > 0` and
    // this file existing, and calls `ChunkedGcmWriter.resume` with a count
    // that is not a whole number of blocks — which throws `ArgumentError`.
    await File(
      filePath,
    ).writeAsBytes(List<int>.filled(EncryptedFileFormat.headerLength + 100, 0));

    final Uint8List source = payload(500);
    final DownloadsRepositoryImpl repo = build(
      _ScriptedByteSource(payload: source),
    );

    await repo.retry('l1');
    await repo.drainForTest();

    final DownloadedLesson? row = await db.downloadsDao.byLessonId('l1');
    expect(row?.state, DownloadState.ready);
    expect(row?.bytesDownloaded, source.length);
  });

  test('watchAll reflects every row, oldest queuedAt first', () async {
    final DownloadsRepositoryImpl repo = build(
      _ScriptedByteSource(payload: payload(10)),
      online: false,
    );

    await repo.enqueueLesson('a');
    await repo.enqueueLesson('b');

    final List<DownloadItem> rows = await repo.watchAll().first;
    expect(rows.map((DownloadItem i) => i.lessonId).toList(), <String>[
      'a',
      'b',
    ]);
  });

  test(
    'a persistently-416 lesson reaches failed instead of hanging the queue',
    () async {
      final DownloadsRepositoryImpl repo = build(
        _StatusFailingByteSource(
          status: 416,
          payload: payload(10),
          alwaysFailLessonId: 'l1',
        ),
      );

      await repo.enqueueLesson('l1');
      // A regression back to the unbounded loop hangs `_drain` forever;
      // `.timeout` turns that into a fast, readable test failure instead of
      // stalling the whole suite.
      await repo.drainForTest().timeout(const Duration(seconds: 5));

      final DownloadedLesson? row = await db.downloadsDao.byLessonId('l1');
      expect(row?.state, DownloadState.failed);
    },
  );
}
