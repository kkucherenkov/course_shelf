// Only `Value` is needed from drift here — a narrow `show` avoids pulling in
// drift's `isNull`, which collides with the matcher of the same name from
// `package:flutter_test`.
import 'package:drift/drift.dart' show Value;
import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:app_mobile/shared/db/app_database.dart';
import 'package:app_mobile/shared/db/tables/outbox_op.dart';

void main() {
  late AppDatabase db;

  final t0 = DateTime.utc(2026, 7, 15, 10);
  final t1 = DateTime.utc(2026, 7, 15, 11);

  setUp(() => db = AppDatabase(NativeDatabase.memory()));
  tearDown(() => db.close());

  group('progress_outbox', () {
    ProgressOutboxCompanion entry(String lessonId, int pos, DateTime at) =>
        ProgressOutboxCompanion.insert(
          lessonId: lessonId,
          positionSeconds: pos,
          durationSeconds: 600,
          clientUpdatedAt: at,
          queuedAt: at,
        );

    test('coalesces: two writes for one lesson leave a single newest row',
        () async {
      await db.progressOutboxDao.enqueue(entry('l1', 10, t0));
      await db.progressOutboxDao.enqueue(entry('l1', 90, t1));

      final pending = await db.progressOutboxDao.pending();
      expect(pending.length, 1, reason: 'unique(lessonId) must coalesce');
      expect(pending.single.positionSeconds, 90);
      expect(pending.single.clientUpdatedAt, t1);
    });

    test('keeps separate lessons separate', () async {
      await db.progressOutboxDao.enqueue(entry('l1', 10, t0));
      await db.progressOutboxDao.enqueue(entry('l2', 10, t0));
      expect((await db.progressOutboxDao.pending()).length, 2);
    });

    test('pending is chronological and caps at the batch limit', () async {
      // Insert in REVERSE chronological order (l249 first, l0 last) so
      // SQLite's rowid insertion order is the exact opposite of the
      // chronological order the test asserts. If `pending()` merely returned
      // rows in insertion order (no working `ORDER BY`), this would produce
      // l249..l50 instead of l0..l199, and the assertion below would fail.
      for (var i = 249; i >= 0; i--) {
        await db.progressOutboxDao
            .enqueue(entry('l$i', i, t0.add(Duration(seconds: i))));
      }
      final page = await db.progressOutboxDao.pending();
      expect(page.length, 200, reason: '/progress/batch maxItems is 200');
      expect(
        page.map((e) => e.lessonId).toList(),
        List.generate(200, (i) => 'l$i'),
        reason: 'must be the 200 chronologically earliest rows, in order',
      );
    });

    test('clear removes only the named lessons', () async {
      await db.progressOutboxDao.enqueue(entry('l1', 10, t0));
      await db.progressOutboxDao.enqueue(entry('l2', 10, t0));
      await db.progressOutboxDao.clear(['l1']);
      final pending = await db.progressOutboxDao.pending();
      expect(pending.single.lessonId, 'l2');
    });

    test('a local DateTime is normalized to UTC on write', () async {
      final local = DateTime(2026, 7, 15, 11);
      await db.progressOutboxDao.enqueue(entry('l1', 10, local));

      final row = (await db.progressOutboxDao.pending()).single;
      expect(row.clientUpdatedAt.isUtc, isTrue);
      expect(row.clientUpdatedAt, local.toUtc());
      expect(row.queuedAt.isUtc, isTrue);
      expect(row.queuedAt, local.toUtc());
    });

    test('pending is chronological across mixed local/UTC writes', () async {
      // This machine's local zone is UTC+04:00 (`DateTime(..., 23)` is
      // 19:00Z), so `earlyLocal` is the earlier instant even though its
      // wall-clock hour (23) is numerically larger than `laterUtc`'s (21).
      // Unnormalized, drift renders `earlyLocal` as
      // "...T23:00:00.000 +04:00" and `laterUtc` as "...T21:00:00.000Z" —
      // lexicographically "23" > "21", so `ORDER BY queued_at` would rank
      // the later row first. This proves the write-boundary UTC
      // normalization keeps that ordering chronological instead.
      final earlyLocal = DateTime(2026, 7, 15, 23); // local, == 19:00Z
      final laterUtc = DateTime.utc(2026, 7, 15, 21); // 21:00Z
      // Enqueue the LATER row first and the EARLIER row second, so rowid
      // insertion order is the opposite of chronological order. If
      // `pending()` merely reproduced insertion order (no working
      // `ORDER BY`, or a working `ORDER BY` undone by unnormalized mixed
      // zones), this would return ['late', 'early'] instead.
      await db.progressOutboxDao.enqueue(entry('late', 2, laterUtc));
      await db.progressOutboxDao.enqueue(entry('early', 1, earlyLocal));

      final pending = await db.progressOutboxDao.pending();
      expect(pending.map((e) => e.lessonId).toList(), ['early', 'late']);
    });
  });

  group('notes_outbox', () {
    test('coalesces per lesson, newest op wins', () async {
      await db.notesOutboxDao.enqueue(
        NotesOutboxCompanion.insert(
          lessonId: 'l1',
          op: OutboxOp.update,
          clientUpdatedAt: t0,
          queuedAt: t0,
        ),
      );
      await db.notesOutboxDao.enqueue(
        NotesOutboxCompanion.insert(
          lessonId: 'l1',
          op: OutboxOp.delete,
          clientUpdatedAt: t1,
          queuedAt: t1,
        ),
      );
      final pending = await db.notesOutboxDao.pending();
      expect(pending.length, 1);
      expect(pending.single.op, OutboxOp.delete);
      expect(pending.single.body, isNull);
    });

    test('a local DateTime is normalized to UTC on write', () async {
      final local = DateTime(2026, 7, 15, 11);
      await db.notesOutboxDao.enqueue(
        NotesOutboxCompanion.insert(
          lessonId: 'l1',
          op: OutboxOp.update,
          clientUpdatedAt: local,
          queuedAt: local,
        ),
      );

      final row = (await db.notesOutboxDao.pending()).single;
      expect(row.clientUpdatedAt.isUtc, isTrue);
      expect(row.clientUpdatedAt, local.toUtc());
      expect(row.queuedAt.isUtc, isTrue);
      expect(row.queuedAt, local.toUtc());
    });
  });

  group('bookmarks_outbox', () {
    BookmarksOutboxCompanion create(String localId) =>
        BookmarksOutboxCompanion.insert(
          localId: localId,
          lessonId: 'l1',
          op: OutboxOp.create,
          clientUpdatedAt: t0,
          queuedAt: t0,
        );

    test('appends: two creates on one lesson stay two rows', () async {
      await db.bookmarksOutboxDao.enqueue(create('b1'));
      await db.bookmarksOutboxDao.enqueue(create('b2'));
      expect(
        (await db.bookmarksOutboxDao.pending()).length,
        2,
        reason: 'each bookmark is a distinct entity — must NOT coalesce',
      );
    });

    test('an offline create has a null serverId', () async {
      await db.bookmarksOutboxDao.enqueue(create('b1'));
      final row = (await db.bookmarksOutboxDao.pending()).single;
      expect(
        row.serverId,
        isNull,
        reason: 'nullable serverId IS the collapse contract',
      );
    });

    test('create then update on one localId collapses to a single row',
        () async {
      await db.bookmarksOutboxDao.enqueue(create('b1'));
      await db.bookmarksOutboxDao.enqueue(
        BookmarksOutboxCompanion.insert(
          localId: 'b1',
          lessonId: 'l1',
          op: OutboxOp.update,
          positionSeconds: const Value(99),
          label: const Value('edited'),
          clientUpdatedAt: t1,
          queuedAt: t1,
        ),
      );

      final pending = await db.bookmarksOutboxDao.pending();
      expect(
        pending.length,
        1,
        reason: 'the update overwrites the create at enqueue time',
      );
      final row = pending.single;
      expect(row.op, OutboxOp.update);
      expect(row.positionSeconds, 99);
      expect(
        row.serverId,
        isNull,
        reason:
            'no create row survives to drain — it collapsed into this update',
      );
    });

    test('a local DateTime is normalized to UTC on write', () async {
      final local = DateTime(2026, 7, 15, 11);
      await db.bookmarksOutboxDao.enqueue(
        BookmarksOutboxCompanion.insert(
          localId: 'b1',
          lessonId: 'l1',
          op: OutboxOp.create,
          clientUpdatedAt: local,
          queuedAt: local,
        ),
      );

      final row = (await db.bookmarksOutboxDao.pending()).single;
      expect(row.clientUpdatedAt.isUtc, isTrue);
      expect(row.clientUpdatedAt, local.toUtc());
      expect(row.queuedAt.isUtc, isTrue);
      expect(row.queuedAt, local.toUtc());
    });
  });
}
