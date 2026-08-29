// `isNotNull`/`isNull` collide with the matchers of the same name from
// `package:flutter_test`. `Uint8List` comes through drift's own export, so
// no separate `dart:typed_data` import is needed.
import 'package:drift/drift.dart' hide isNotNull, isNull;
import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:app_mobile/shared/db/app_database.dart';
import 'package:app_mobile/shared/db/tables/downloaded_lessons.dart';

void main() {
  late AppDatabase db;
  final now = DateTime.utc(2026, 7, 15);

  DownloadedLessonsCompanion entry(String lessonId, DownloadState state) =>
      DownloadedLessonsCompanion.insert(
        lessonId: lessonId,
        state: state,
        filePath: '/tmp/$lessonId.enc',
        updatedAt: now,
      );

  setUp(() => db = AppDatabase(NativeDatabase.memory()));
  tearDown(() => db.close());

  test('round-trips a download, defaulting bytesDownloaded to 0', () async {
    await db.downloadsDao.upsert(entry('l1', DownloadState.queued));
    final got = await db.downloadsDao.byLessonId('l1');
    expect(got, isNotNull);
    expect(got!.state, DownloadState.queued);
    expect(got.bytesDownloaded, 0);
    expect(got.totalBytes, isNull);
    expect(got.nonce, isNull);
  });

  test('nonce round-trips as written bytes', () async {
    final nonce = Uint8List.fromList(List.generate(12, (i) => i));
    await db.downloadsDao.upsert(
      entry('l1', DownloadState.downloading).copyWith(nonce: Value(nonce)),
    );
    final got = await db.downloadsDao.byLessonId('l1');
    expect(got!.nonce, nonce);
  });

  test('upsert advances state without duplicating the row', () async {
    await db.downloadsDao.upsert(entry('l1', DownloadState.queued));
    await db.downloadsDao.upsert(
      entry('l1', DownloadState.ready).copyWith(
        bytesDownloaded: const Value(1024),
        totalBytes: const Value(1024),
      ),
    );
    final all = await db.downloadsDao.byState(DownloadState.ready);
    expect(all.length, 1);
    expect(all.single.bytesDownloaded, 1024);
    expect(await db.downloadsDao.byState(DownloadState.queued), isEmpty);
  });

  test('byState finds only the requested state', () async {
    await db.downloadsDao.upsert(entry('l1', DownloadState.ready));
    await db.downloadsDao.upsert(entry('l2', DownloadState.failed));
    final ready = await db.downloadsDao.byState(DownloadState.ready);
    expect(ready.single.lessonId, 'l1');
  });

  test('remove deletes the row (cancel has no terminal state)', () async {
    await db.downloadsDao.upsert(entry('l1', DownloadState.downloading));
    await db.downloadsDao.remove('l1');
    expect(await db.downloadsDao.byLessonId('l1'), isNull);
  });

  group('queue columns (schema v2)', () {
    test('nextQueued returns the oldest queued row, UTC-ordered', () async {
      final DateTime early = DateTime.utc(2026, 7, 29, 8);
      final DateTime late_ = DateTime.utc(2026, 7, 29, 9);

      await db.downloadsDao.upsert(
        DownloadedLessonsCompanion.insert(
          lessonId: 'l-late',
          state: DownloadState.queued,
          filePath: '/tmp/l-late.csdl',
          updatedAt: late_,
          queuedAt: Value<DateTime?>(late_),
        ),
      );
      await db.downloadsDao.upsert(
        DownloadedLessonsCompanion.insert(
          lessonId: 'l-early',
          state: DownloadState.queued,
          filePath: '/tmp/l-early.csdl',
          updatedAt: early,
          queuedAt: Value<DateTime?>(early),
        ),
      );

      final DownloadedLesson? next = await db.downloadsDao.nextQueued(
        now: DateTime.utc(2026, 7, 29, 12),
      );
      expect(next?.lessonId, 'l-early');
    });

    test('nextQueued skips a row still inside its backoff window', () async {
      final DateTime now = DateTime.utc(2026, 7, 29, 10);
      await db.downloadsDao.upsert(
        DownloadedLessonsCompanion.insert(
          lessonId: 'backing-off',
          state: DownloadState.queued,
          filePath: '/tmp/backing-off.csdl',
          updatedAt: now,
          queuedAt: Value<DateTime?>(now),
          nextAttemptAt: Value<DateTime?>(now.add(const Duration(minutes: 5))),
        ),
      );

      // Still in backoff — the pump must move past it rather than sleep on it.
      expect(await db.downloadsDao.nextQueued(now: now), isNull);
      // Window elapsed.
      expect(
        (await db.downloadsDao.nextQueued(
          now: now.add(const Duration(minutes: 6)),
        ))?.lessonId,
        'backing-off',
      );
    });

    test('nextQueued ignores rows that are not queued', () async {
      await db.downloadsDao.upsert(
        DownloadedLessonsCompanion.insert(
          lessonId: 'l1',
          state: DownloadState.ready,
          filePath: '/tmp/l1.csdl',
          updatedAt: DateTime.utc(2026, 7, 29),
          queuedAt: Value<DateTime?>(DateTime.utc(2026, 7, 29)),
        ),
      );

      expect(
        await db.downloadsDao.nextQueued(now: DateTime.utc(2026, 7, 29, 12)),
        isNull,
      );
    });

    test(
      'byCourseId groups a whole course for EnqueueCourse / Cancel',
      () async {
        for (final String id in <String>['a', 'b']) {
          await db.downloadsDao.upsert(
            DownloadedLessonsCompanion.insert(
              lessonId: id,
              state: DownloadState.queued,
              filePath: '/tmp/$id.csdl',
              updatedAt: DateTime.utc(2026, 7, 29),
              courseId: const Value<String?>('c1'),
              queuedAt: Value<DateTime?>(DateTime.utc(2026, 7, 29)),
            ),
          );
        }

        final List<DownloadedLesson> rows = await db.downloadsDao.byCourseId(
          'c1',
        );
        expect(rows.map((DownloadedLesson r) => r.lessonId), <String>[
          'a',
          'b',
        ]);
      },
    );

    test('attemptCount defaults to 0', () async {
      await db.downloadsDao.upsert(
        DownloadedLessonsCompanion.insert(
          lessonId: 'l1',
          state: DownloadState.queued,
          filePath: '/tmp/l1.csdl',
          updatedAt: DateTime.utc(2026, 7, 29),
        ),
      );

      final DownloadedLesson? row = await db.downloadsDao.byLessonId('l1');
      expect(row?.attemptCount, 0);
    });
  });
}
