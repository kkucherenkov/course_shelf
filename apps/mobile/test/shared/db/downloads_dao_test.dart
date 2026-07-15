// `isNotNull`/`isNull` collide with the matchers of the same name from
// `package:flutter_test`.
import 'package:drift/drift.dart' hide isNotNull, isNull;
import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:app_mobile/shared/db/app_database.dart';
import 'package:app_mobile/shared/db/tables/downloaded_lessons.dart';

void main() {
  late AppDatabase db;
  final now = DateTime.utc(2026, 7, 15);

  DownloadedLessonsCompanion entry(
    String lessonId,
    DownloadState state,
  ) =>
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
}
