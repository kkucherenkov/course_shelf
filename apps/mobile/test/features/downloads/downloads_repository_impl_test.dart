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

void main() {
  late AppDatabase db;
  late Directory dir;
  late _RecordingScheduler scheduler;

  Uint8List payload(int length) =>
      Uint8List.fromList(List<int>.generate(length, (int i) => i % 251));

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
      final DownloadsRepositoryImpl repo = build(
        _StatusFailingByteSource(
          status: 500,
          payload: payload(10),
          alwaysFailLessonId: 'l1',
        ),
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
    final DownloadsRepositoryImpl repo = build(
      _StatusFailingByteSource(
        status: 500,
        payload: source,
        alwaysFailLessonId: 'bad',
      ),
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

  test('watch emits the item as it progresses', () async {
    final DownloadsRepositoryImpl repo = build(
      _ScriptedByteSource(payload: payload(EncryptedFileFormat.blockSize)),
    );

    final Future<List<DownloadItem?>> collected = repo
        .watch('l1')
        .take(2)
        .toList();

    await repo.enqueueLesson('l1');
    await repo.drainForTest();

    final List<DownloadItem?> items = await collected;
    expect(items.last?.lessonId, 'l1');
  });
}
