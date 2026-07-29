# E19-F01-S01 DownloadsBloc Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give `apps/mobile` a BLoC-managed download queue that fetches lesson video over HTTP byte ranges, stores it encrypted at rest in 256 KiB AES-GCM blocks, resumes correctly after a pause or an app kill, and serves the decrypted bytes to `video_player` over a local loopback HTTP server.

**Architecture:** Feature-first under `apps/mobile/lib/features/downloads/`, matching the existing `features/player/` split. `domain/` holds ports and pure logic with zero IO; `data/` holds Dio, filesystem, crypto, secure storage, and platform scheduling; `presentation/bloc/` holds the BLoC. Drift is the source of truth for resume position, and the on-disk file is truncated down to match it on every resume.

**Tech Stack:** Flutter 3.44, `flutter_bloc` 9, `drift` 2.34, `dio` 5.10, `cryptography` 2.9, `flutter_secure_storage` 10.3, `workmanager` 0.9, `connectivity_plus` 7.3, `bloc_test` 10, `mocktail` 1.

**Spec:** [`docs/superpowers/specs/2026-07-28-e19-downloads-bloc-design.md`](../specs/2026-07-28-e19-downloads-bloc-design.md)

**Branch:** `feat/e19-downloads-bloc` (already created, spec committed at `ce4e061`)

## Global Constraints

Every task's requirements implicitly include this section.

- **Lints** (`apps/mobile/analysis_options.yaml`): `strict-casts`, `strict-inference`, `strict-raw-types` are all on. `always_use_package_imports` — every import inside `apps/mobile` must be `package:app_mobile/...`, never relative. `prefer_final_locals`, `prefer_const_constructors`, `prefer_const_declarations`, `avoid_print`. Declare local types explicitly; the surrounding code does.
- **Container format:** magic `"CSDL"`, version `1`, header **24 bytes**, block size **262144** (256 KiB) of plaintext, AES-GCM tag **16 bytes**, nonce **12 bytes**.
- **Persistence cadence:** flush `bytesDownloaded` to Drift every **16 blocks (4 MiB)**, plus on pause, cancel, and completion.
- **Retry policy:** backoff `2^n` seconds capped at **5 minutes**, **5 attempts**, then `failed`.
- **HTTP verbs:** `stream-url` and `download-url` are **GET**. Never POST.
- **Key storage:** the AES key lives only in `flutter_secure_storage`, never in Drift. iOS options must set `accessibility: KeychainAccessibility.first_unlock` — the package default is `unlocked`, which makes the key unreadable to a background task on a locked device.
- **Tests:** everything runs under `flutter test`. No test may require a device, emulator, or network.
- **Run tests from** `/home/kkucherenkov/projects/petProjects/course_shelf/apps/mobile` using an absolute `cd`. A relative `cd apps/mobile` can land in a different repo on this machine.
- **No user-visible strings** without a `slang` key. No task in this plan adds UI, so no new strings are expected.

---

### Task 1: Fix the stream-url / download-url HTTP verb

`apps/mobile` calls two GET-only routes with POST. NestJS 404s an unmatched method+path, so both fail against a real backend. The player tests fake `LessonPlayerRepository` wholesale, so nothing caught it. This task fixes both call sites and adds a test that pins the verbs.

**Files:**
- Create: `apps/mobile/test/support/recording_http_adapter.dart`
- Modify: `apps/mobile/lib/features/player/data/lesson_player_api.dart:63,136`
- Modify: `apps/mobile/lib/features/player/domain/lesson_player_repository.dart:14`
- Test: `apps/mobile/test/features/player/lesson_player_api_verb_test.dart`

**Interfaces:**
- Consumes: nothing.
- Produces: `RecordingHttpAdapter` — a `dio` `HttpClientAdapter` fake used by Tasks 7 and 8.
  - `RecordingHttpAdapter({required ResponseBody Function(RequestOptions) respond})`
  - `List<RequestOptions> get requests`
  - `RequestOptions get lastRequest`

- [ ] **Step 1: Write the test-support adapter**

This is shared infrastructure, not a test itself. It records every request Dio makes and lets each test script the response.

```dart
// apps/mobile/test/support/recording_http_adapter.dart
import 'dart:typed_data';

import 'package:dio/dio.dart';

/// A [HttpClientAdapter] that records every request and returns a scripted
/// response. Lets a test assert on the exact method, path, and headers Dio put
/// on the wire without opening a socket.
///
/// `respond` receives the outgoing [RequestOptions] and returns the
/// [ResponseBody] to hand back, so a single adapter can answer different routes
/// differently and can vary its answer by call count.
class RecordingHttpAdapter implements HttpClientAdapter {
  RecordingHttpAdapter({required this.respond});

  final ResponseBody Function(RequestOptions options) respond;

  final List<RequestOptions> requests = <RequestOptions>[];

  RequestOptions get lastRequest => requests.last;

  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) async {
    requests.add(options);
    return respond(options);
  }

  @override
  void close({bool force = false}) {}
}
```

- [ ] **Step 2: Write the failing verb test**

```dart
// apps/mobile/test/features/player/lesson_player_api_verb_test.dart
import 'package:dio/dio.dart';
import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:app_mobile/features/player/data/lesson_player_api.dart';
import 'package:app_mobile/shared/db/app_database.dart';

import 'package:app_mobile/../test/support/recording_http_adapter.dart';

void main() {
  late AppDatabase db;
  late Dio dio;
  late RecordingHttpAdapter adapter;

  setUp(() {
    db = AppDatabase(NativeDatabase.memory());
    adapter = RecordingHttpAdapter(
      respond: (RequestOptions options) => ResponseBody.fromString(
        '{"url":"/api/v1/stream/lessons/l1?token=t","token":"t",'
        '"expiresAt":"2026-07-29T10:15:00Z"}',
        200,
        headers: <String, List<String>>{
          Headers.contentTypeHeader: <String>[Headers.jsonContentType],
        },
      ),
    );
    dio = Dio(BaseOptions(baseUrl: 'http://localhost:3000'))
      ..httpClientAdapter = adapter;
  });

  tearDown(() => db.close());

  // These two routes are GET in openapi.yaml, GET in the NestJS controller,
  // and GET in the generated TS client that apps/web uses. apps/mobile used
  // POST, which NestJS answers with 404. Pin the verb so it cannot regress.
  test('resolveVideoSource issues GET, not POST', () async {
    final LessonPlayerApi api = LessonPlayerApi(
      dio: dio,
      downloadsDao: DownloadsDao(db),
    );

    await api.resolveVideoSource('l1');

    expect(adapter.lastRequest.method, 'GET');
    expect(adapter.lastRequest.path, '/api/v1/lessons/l1/stream-url');
  });

  test('issueMaterialDownloadUrl issues GET, not POST', () async {
    final LessonPlayerApi api = LessonPlayerApi(
      dio: dio,
      downloadsDao: DownloadsDao(db),
    );

    await api.issueMaterialDownloadUrl(lessonId: 'l1', materialId: 'm1');

    expect(adapter.lastRequest.method, 'GET');
    expect(
      adapter.lastRequest.path,
      '/api/v1/lessons/l1/materials/m1/download-url',
    );
  });
}
```

The `package:app_mobile/../test/...` import above is wrong — `always_use_package_imports` forbids a relative import, but `test/` is not inside `lib/` so it has no package path. Use this instead, which the analyzer accepts because the lint only governs files under `lib/`:

```dart
import '../../support/recording_http_adapter.dart';
```

Replace the import line accordingly before running.

- [ ] **Step 3: Run the test to verify it fails**

```bash
cd /home/kkucherenkov/projects/petProjects/course_shelf/apps/mobile
flutter test test/features/player/lesson_player_api_verb_test.dart
```

Expected: both tests FAIL with `Expected: 'GET' Actual: 'POST'`.

- [ ] **Step 4: Fix both call sites**

In `apps/mobile/lib/features/player/data/lesson_player_api.dart`, line 62-63:

```dart
    final Response<Map<String, dynamic>> response = await _dio
        .get<Map<String, dynamic>>('/api/v1/lessons/$lessonId/stream-url');
```

and line 134-137:

```dart
    final Response<Map<String, dynamic>> response = await _dio
        .get<Map<String, dynamic>>(
          '/api/v1/lessons/$lessonId/materials/$materialId/download-url',
        );
```

In `apps/mobile/lib/features/player/domain/lesson_player_repository.dart`, line 14, correct the doc comment:

```dart
  /// A ready local download when one exists, else `GET /lessons/{id}/stream-url`.
```

- [ ] **Step 5: Run the test to verify it passes**

```bash
cd /home/kkucherenkov/projects/petProjects/course_shelf/apps/mobile
flutter test test/features/player/lesson_player_api_verb_test.dart
```

Expected: PASS, 2 tests.

- [ ] **Step 6: Run the full suite to confirm nothing regressed**

```bash
cd /home/kkucherenkov/projects/petProjects/course_shelf/apps/mobile
flutter analyze && flutter test
```

Expected: `No issues found!` and `All tests passed!` with 267 tests (265 baseline + 2 new).

- [ ] **Step 7: Commit**

```bash
cd /home/kkucherenkov/projects/petProjects/course_shelf
git add apps/mobile/lib/features/player apps/mobile/test
git commit -m "fix(mobile): stream-url and download-url are GET, not POST

apps/mobile POSTed to two routes that are GET in openapi.yaml, in the NestJS
controller, and in the generated TS client apps/web consumes. NestJS answers an
unmatched method+path with 404, so both calls failed against a real backend.
Invisible to the suite because the player tests fake LessonPlayerRepository
above the HTTP layer.

Adds RecordingHttpAdapter and a test that pins both verbs.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Dependencies and Drift schema v2

The queue needs three columns the table does not have. `AppDatabase.onUpgrade` has been an empty hook since E15 waiting for exactly this.

**Files:**
- Modify: `apps/mobile/pubspec.yaml`
- Modify: `apps/mobile/lib/shared/db/tables/downloaded_lessons.dart`
- Modify: `apps/mobile/lib/shared/db/app_database.dart:64-77`
- Modify: `apps/mobile/lib/shared/db/daos/downloads_dao.dart`
- Test: `apps/mobile/test/shared/db/downloads_dao_test.dart` (exists — extend it)

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `DownloadedLessons.courseId` → `TextColumn` nullable
  - `DownloadedLessons.attemptCount` → `IntColumn`, default 0
  - `DownloadedLessons.queuedAt` → `DateTimeColumn` nullable, always written UTC
  - `DownloadsDao.nextQueued()` → `Future<DownloadedLesson?>`
  - `DownloadsDao.byCourseId(String)` → `Future<List<DownloadedLesson>>`

- [ ] **Step 1: Add the three dependencies**

```bash
cd /home/kkucherenkov/projects/petProjects/course_shelf/apps/mobile
flutter pub add cryptography workmanager connectivity_plus
```

Expected resolution: `cryptography 2.9.0`, `workmanager 0.9.0+3`, `connectivity_plus 7.3.1`.

Then annotate them in `pubspec.yaml`, matching the file's existing habit of explaining why each dependency exists:

```yaml
  # AES-GCM for downloads-at-rest (E19-F01-S01). Pure Dart, so the block
  # writer/reader are testable under `flutter test` with no platform channel.
  cryptography: ^2.9.0
  # Opportunistic background resume. Android registers a worker, iOS a
  # BGAppRefreshTask; both only ever ask the queue to "resume what's
  # unfinished". Neither carries a whole transfer — see the E19-F01-S01 design.
  workmanager: ^0.9.0+3
  # Lets the queue distinguish "offline" (stay queued, no attempt burned) from
  # "failed" (count an attempt, back off).
  connectivity_plus: ^7.3.1
```

- [ ] **Step 2: Write the failing migration + ordering test**

Append to `apps/mobile/test/shared/db/downloads_dao_test.dart`:

```dart
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

      final DownloadedLesson? next = await db.downloadsDao.nextQueued();
      expect(next?.lessonId, 'l-early');
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

      expect(await db.downloadsDao.nextQueued(), isNull);
    });

    test('byCourseId groups a whole course for EnqueueCourse / Cancel', () async {
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

      final List<DownloadedLesson> rows = await db.downloadsDao.byCourseId('c1');
      expect(rows.map((DownloadedLesson r) => r.lessonId), <String>['a', 'b']);
    });

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
```

Make sure the file imports `Value` from drift — the existing outbox test shows the house pattern and the reason:

```dart
// Only `Value` is needed from drift here — a narrow `show` avoids pulling in
// drift's `isNull`, which collides with the matcher of the same name from
// `package:flutter_test`.
import 'package:drift/drift.dart' show Value;
```

- [ ] **Step 3: Run to verify it fails**

```bash
cd /home/kkucherenkov/projects/petProjects/course_shelf/apps/mobile
flutter test test/shared/db/downloads_dao_test.dart
```

Expected: compile error — `queuedAt` / `courseId` / `attemptCount` are not parameters of `DownloadedLessonsCompanion.insert`, and `nextQueued` / `byCourseId` are undefined.

- [ ] **Step 4: Add the columns**

In `apps/mobile/lib/shared/db/tables/downloaded_lessons.dart`, add inside the class, after `lastError`:

```dart
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
```

- [ ] **Step 5: Bump the schema and fill the migration hook**

In `apps/mobile/lib/shared/db/app_database.dart`, replace lines 63-77:

```dart
  @override
  int get schemaVersion => 2;

  @override
  MigrationStrategy get migration => MigrationStrategy(
    onCreate: (m) => m.createAll(),
    // v1 -> v2 (E19-F01-S01): downloaded_lessons gains the queue columns.
    onUpgrade: (m, from, to) async {
      if (from < 2) {
        await m.addColumn(downloadedLessons, downloadedLessons.courseId);
        await m.addColumn(downloadedLessons, downloadedLessons.attemptCount);
        await m.addColumn(downloadedLessons, downloadedLessons.queuedAt);
        // Pre-v2 rows have no queue position. `updatedAt` is the best proxy
        // available and preserves their relative order.
        await m.database.customStatement(
          'UPDATE downloaded_lessons SET queued_at = updated_at '
          'WHERE queued_at IS NULL',
        );
      }
    },
    beforeOpen: (details) async {
      // Drift disables foreign keys by default; cached_sections and
      // cached_lessons rely on them.
      await customStatement('PRAGMA foreign_keys = ON');
    },
  );
```

- [ ] **Step 6: Add the two DAO queries**

In `apps/mobile/lib/shared/db/daos/downloads_dao.dart`, add before `remove`:

```dart
  /// Oldest `queued` row — the pump's next unit of work.
  ///
  /// Ordering by `queuedAt` is safe only because every writer normalizes it to
  /// UTC (see the class doc above): Drift's TEXT datetime encoding makes
  /// `ORDER BY` lexicographic, so a mixed-offset column would sort wrong.
  Future<DownloadedLesson?> nextQueued() =>
      (select(downloadedLessons)
            ..where((t) => t.state.equalsValue(DownloadState.queued))
            ..orderBy(<OrderClauseGenerator<$DownloadedLessonsTable>>[
              (t) => OrderingTerm(expression: t.queuedAt),
            ])
            ..limit(1))
          .getSingleOrNull();

  /// Every row belonging to one course — `EnqueueCourse` and course-level
  /// cancel operate on the group.
  Future<List<DownloadedLesson>> byCourseId(String courseId) =>
      (select(downloadedLessons)
            ..where((t) => t.courseId.equals(courseId)))
          .get();
```

- [ ] **Step 7: Regenerate Drift code**

```bash
cd /home/kkucherenkov/projects/petProjects/course_shelf/apps/mobile
dart run build_runner build --delete-conflicting-outputs
```

Expected: `app_database.g.dart` and `downloads_dao.g.dart` regenerate with the three new columns.

- [ ] **Step 8: Run to verify it passes**

```bash
cd /home/kkucherenkov/projects/petProjects/course_shelf/apps/mobile
flutter analyze && flutter test test/shared/db/downloads_dao_test.dart
```

Expected: `No issues found!` and all DAO tests pass.

- [ ] **Step 9: Commit**

```bash
cd /home/kkucherenkov/projects/petProjects/course_shelf
git add apps/mobile/pubspec.yaml apps/mobile/pubspec.lock apps/mobile/lib/shared/db apps/mobile/test/shared/db
git commit -m "feat(mobile): downloaded_lessons schema v2 with queue columns

Adds courseId, attemptCount, and queuedAt, filling the v1 -> v2 hook that has
been empty since E15 for exactly this. queuedAt is UTC-normalized by every
writer because Drift's TEXT datetime encoding makes ORDER BY lexicographic.

Also adds cryptography, workmanager, and connectivity_plus.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: EncryptedFileFormat — pure block arithmetic

Every off-by-one risk in the container (plaintext offset ↔ block index ↔ ciphertext offset) lives in one file with no IO and no crypto, so it can be tested exhaustively.

**Files:**
- Create: `apps/mobile/lib/features/downloads/domain/encrypted_file_format.dart`
- Test: `apps/mobile/test/features/downloads/encrypted_file_format_test.dart`

**Interfaces:**
- Consumes: nothing.
- Produces (all `static` on `EncryptedFileFormat`):
  - `blockSize` = 262144, `tagLength` = 16, `nonceLength` = 12, `headerLength` = 24, `storedBlockLength` = 262160
  - `blockIndexAt(int plaintextOffset)` → `int`
  - `storedOffsetOf(int blockIndex)` → `int`
  - `storedLengthFor(int blockCount)` → `int`
  - `wholeBlocksIn(int plaintextBytes)` → `int`
  - `plaintextLengthFor(int storedFileLength)` → `int`
  - `nonceForBlock(Uint8List fileNonce, int blockIndex)` → `Uint8List`
  - `buildHeader(Uint8List fileNonce)` → `Uint8List`
  - `readNonce(Uint8List header)` → `Uint8List`

- [ ] **Step 1: Write the failing tests**

```dart
// apps/mobile/test/features/downloads/encrypted_file_format_test.dart
import 'dart:typed_data';

import 'package:flutter_test/flutter_test.dart';

import 'package:app_mobile/features/downloads/domain/encrypted_file_format.dart';

void main() {
  const int block = EncryptedFileFormat.blockSize;

  Uint8List nonce() =>
      Uint8List.fromList(List<int>.generate(12, (int i) => i + 1));

  group('block arithmetic', () {
    test('blockIndexAt is inclusive at the low edge, exclusive at the high', () {
      expect(EncryptedFileFormat.blockIndexAt(0), 0);
      expect(EncryptedFileFormat.blockIndexAt(block - 1), 0);
      expect(EncryptedFileFormat.blockIndexAt(block), 1);
      expect(EncryptedFileFormat.blockIndexAt(block * 3 + 7), 3);
    });

    test('storedOffsetOf accounts for the header and every prior tag', () {
      expect(EncryptedFileFormat.storedOffsetOf(0), 24);
      expect(EncryptedFileFormat.storedOffsetOf(1), 24 + block + 16);
      expect(EncryptedFileFormat.storedOffsetOf(2), 24 + 2 * (block + 16));
    });

    test('storedLengthFor is the truncation target on resume', () {
      expect(EncryptedFileFormat.storedLengthFor(0), 24);
      expect(EncryptedFileFormat.storedLengthFor(4), 24 + 4 * (block + 16));
    });

    test('wholeBlocksIn never counts a partial trailing block', () {
      expect(EncryptedFileFormat.wholeBlocksIn(0), 0);
      expect(EncryptedFileFormat.wholeBlocksIn(block - 1), 0);
      expect(EncryptedFileFormat.wholeBlocksIn(block), 1);
      expect(EncryptedFileFormat.wholeBlocksIn(block * 2 + 5), 2);
    });

    test('plaintextLengthFor inverts a whole-block file', () {
      expect(EncryptedFileFormat.plaintextLengthFor(24), 0);
      expect(
        EncryptedFileFormat.plaintextLengthFor(
          EncryptedFileFormat.storedLengthFor(3),
        ),
        block * 3,
      );
    });

    test('plaintextLengthFor subtracts the tag from a short final block', () {
      // 2 whole blocks, then a 100-byte final block sealed with a 16-byte tag.
      final int stored = EncryptedFileFormat.storedLengthFor(2) + 100 + 16;
      expect(EncryptedFileFormat.plaintextLengthFor(stored), block * 2 + 100);
    });
  });

  group('nonce derivation', () {
    test('is deterministic', () {
      expect(
        EncryptedFileFormat.nonceForBlock(nonce(), 7),
        EncryptedFileFormat.nonceForBlock(nonce(), 7),
      );
    });

    test('differs for every block index — a reused GCM nonce is fatal', () {
      final Set<String> seen = <String>{};
      for (int i = 0; i < 2000; i++) {
        final Uint8List n = EncryptedFileFormat.nonceForBlock(nonce(), i);
        expect(n.length, 12);
        expect(seen.add(n.join(',')), isTrue, reason: 'nonce repeated at $i');
      }
    });

    test('block 0 is the file nonce unchanged', () {
      expect(EncryptedFileFormat.nonceForBlock(nonce(), 0), nonce());
    });
  });

  group('header', () {
    test('round-trips the file nonce', () {
      final Uint8List header = EncryptedFileFormat.buildHeader(nonce());
      expect(header.length, 24);
      expect(EncryptedFileFormat.readNonce(header), nonce());
    });

    test('rejects a foreign container', () {
      final Uint8List header = EncryptedFileFormat.buildHeader(nonce());
      header[0] = 0x00;
      expect(
        () => EncryptedFileFormat.readNonce(header),
        throwsA(isA<FormatException>()),
      );
    });

    test('rejects a truncated header', () {
      expect(
        () => EncryptedFileFormat.readNonce(Uint8List(10)),
        throwsA(isA<FormatException>()),
      );
    });

    test('rejects a future container version', () {
      final Uint8List header = EncryptedFileFormat.buildHeader(nonce());
      header[4] = 2;
      expect(
        () => EncryptedFileFormat.readNonce(header),
        throwsA(isA<FormatException>()),
      );
    });
  });
}
```

- [ ] **Step 2: Run to verify it fails**

```bash
cd /home/kkucherenkov/projects/petProjects/course_shelf/apps/mobile
flutter test test/features/downloads/encrypted_file_format_test.dart
```

Expected: compile error, `encrypted_file_format.dart` does not exist.

- [ ] **Step 3: Implement**

```dart
// apps/mobile/lib/features/downloads/domain/encrypted_file_format.dart
import 'dart:typed_data';

/// On-disk layout and block arithmetic for the `.csdl` download container.
///
/// ```
/// offset  0  magic     "CSDL"          4B
/// offset  4  version   u8 = 1          1B
/// offset  5  blockSize u32 LE          4B
/// offset  9  fileNonce                 12B
/// offset 21  reserved  zero            3B    -> header = 24B
/// offset 24  block 0: ciphertext(<=blockSize) || tag(16B)
///            block 1: ...                       last block may be short
/// ```
///
/// Deliberately pure: no `dart:io`, no crypto. Every off-by-one between a
/// plaintext offset, a block index, and a file offset is decided here, so it
/// can be tested without a filesystem.
///
/// Whole-file AES-GCM was rejected for this container because it can neither
/// resume across an app kill (GCM cipher state is not persistable) nor support
/// the random access `video_player` performs. Per-block sealing buys both, and
/// localizes corruption to one block instead of the whole download.
abstract final class EncryptedFileFormat {
  /// "CSDL" — Course Shelf DownLoad.
  static const List<int> magic = <int>[0x43, 0x53, 0x44, 0x4C];

  static const int version = 1;

  /// Plaintext bytes per block. 256 KiB keeps tag overhead near 0.006% while
  /// staying small enough that a seek decrypts a trivial amount.
  static const int blockSize = 262144;

  /// AES-GCM authentication tag, appended after each block's ciphertext.
  static const int tagLength = 16;

  /// AES-GCM nonce length.
  static const int nonceLength = 12;

  static const int headerLength = 24;

  /// Bytes a full block occupies on disk, tag included.
  static const int storedBlockLength = blockSize + tagLength;

  static const int _versionOffset = 4;
  static const int _blockSizeOffset = 5;
  static const int _nonceOffset = 9;

  /// Index of the block containing [plaintextOffset].
  static int blockIndexAt(int plaintextOffset) => plaintextOffset ~/ blockSize;

  /// File offset at which block [blockIndex] begins.
  static int storedOffsetOf(int blockIndex) =>
      headerLength + blockIndex * storedBlockLength;

  /// Length of a file holding exactly [blockCount] whole blocks. This is the
  /// truncation target on resume — the file is cut back to match the row.
  static int storedLengthFor(int blockCount) =>
      headerLength + blockCount * storedBlockLength;

  /// Whole blocks represented by [plaintextBytes]. A partial trailing block is
  /// never committed, so it never counts.
  static int wholeBlocksIn(int plaintextBytes) => plaintextBytes ~/ blockSize;

  /// Plaintext length of a container of [storedFileLength] bytes on disk.
  static int plaintextLengthFor(int storedFileLength) {
    final int body = storedFileLength - headerLength;
    if (body <= 0) return 0;
    final int whole = body ~/ storedBlockLength;
    final int remainder = body % storedBlockLength;
    // A remainder is a short final block: its ciphertext is remainder - tag.
    final int tail = remainder > tagLength ? remainder - tagLength : 0;
    return whole * blockSize + tail;
  }

  /// `nonce(i) = fileNonce XOR bigEndian96(i)`.
  ///
  /// Distinct `i` yields a distinct nonce within a file, and the random 96-bit
  /// [fileNonce] separates files. Nonce reuse under one key is the one failure
  /// AES-GCM does not survive, so this is the load-bearing invariant of the
  /// whole container.
  static Uint8List nonceForBlock(Uint8List fileNonce, int blockIndex) {
    if (fileNonce.length != nonceLength) {
      throw FormatException('Nonce must be $nonceLength bytes');
    }
    final Uint8List out = Uint8List.fromList(fileNonce);
    int remaining = blockIndex;
    for (int i = nonceLength - 1; i >= 0 && remaining != 0; i--) {
      out[i] ^= remaining & 0xFF;
      remaining >>>= 8;
    }
    return out;
  }

  static Uint8List buildHeader(Uint8List fileNonce) {
    if (fileNonce.length != nonceLength) {
      throw FormatException('Nonce must be $nonceLength bytes');
    }
    final Uint8List header = Uint8List(headerLength);
    header.setRange(0, magic.length, magic);
    header[_versionOffset] = version;
    ByteData.sublistView(
      header,
    ).setUint32(_blockSizeOffset, blockSize, Endian.little);
    header.setRange(_nonceOffset, _nonceOffset + nonceLength, fileNonce);
    // Bytes 21..23 stay zero (reserved).
    return header;
  }

  /// Validates the header and returns its file nonce.
  static Uint8List readNonce(Uint8List header) {
    if (header.length < headerLength) {
      throw const FormatException('Truncated container header');
    }
    for (int i = 0; i < magic.length; i++) {
      if (header[i] != magic[i]) {
        throw const FormatException('Not a CSDL container');
      }
    }
    if (header[_versionOffset] != version) {
      throw FormatException(
        'Unsupported container version ${header[_versionOffset]}',
      );
    }
    return Uint8List.fromList(
      header.sublist(_nonceOffset, _nonceOffset + nonceLength),
    );
  }
}
```

- [ ] **Step 4: Run to verify it passes**

```bash
cd /home/kkucherenkov/projects/petProjects/course_shelf/apps/mobile
flutter analyze && flutter test test/features/downloads/encrypted_file_format_test.dart
```

Expected: `No issues found!` and all 13 tests pass.

- [ ] **Step 5: Commit**

```bash
cd /home/kkucherenkov/projects/petProjects/course_shelf
git add apps/mobile/lib/features/downloads apps/mobile/test/features/downloads
git commit -m "feat(mobile): CSDL container layout and block arithmetic

Pure, IO-free block math for the encrypted download container. Isolating it
makes every plaintext-offset/block-index/file-offset conversion testable
without a filesystem, and puts the nonce-uniqueness invariant — the one thing
AES-GCM does not survive losing — under exhaustive test.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: DownloadKeyStore — the device-bound key

Closes issue #122. The key never touches Drift; the table comment already states why ("a key stored beside its own ciphertext is not encryption").

**Files:**
- Create: `apps/mobile/lib/features/downloads/domain/download_key_store.dart`
- Create: `apps/mobile/lib/features/downloads/data/secure_download_key_store.dart`
- Test: `apps/mobile/test/features/downloads/secure_download_key_store_test.dart`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `abstract class DownloadKeyStore { Future<Uint8List> keyForDevice(); }`
  - `SecureDownloadKeyStore([FlutterSecureStorage? storage])`

- [ ] **Step 1: Write the failing test**

`flutter_secure_storage` has no platform implementation under `flutter test`, so the test injects a fake through the constructor seam — the same seam `SecureTokenStorage` already uses.

```dart
// apps/mobile/test/features/downloads/secure_download_key_store_test.dart
import 'dart:convert';
import 'dart:typed_data';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

import 'package:app_mobile/features/downloads/data/secure_download_key_store.dart';

class _MockSecureStorage extends Mock implements FlutterSecureStorage {}

void main() {
  late _MockSecureStorage storage;
  late SecureDownloadKeyStore store;

  setUp(() {
    storage = _MockSecureStorage();
    store = SecureDownloadKeyStore(storage);
    when(
      () => storage.write(
        key: any<String>(named: 'key'),
        value: any<String>(named: 'value'),
      ),
    ).thenAnswer((_) async {});
  });

  test('generates a 32-byte key on first use and persists it', () async {
    when(
      () => storage.read(key: any<String>(named: 'key')),
    ).thenAnswer((_) async => null);

    final Uint8List key = await store.keyForDevice();

    expect(key.length, 32);
    final String written = verify(
      () => storage.write(
        key: any<String>(named: 'key'),
        value: captureAny<String>(named: 'value'),
      ),
    ).captured.single as String;
    expect(base64Decode(written), key);
  });

  test('returns the stored key on later calls without rewriting', () async {
    final Uint8List existing = Uint8List.fromList(
      List<int>.generate(32, (int i) => i),
    );
    when(
      () => storage.read(key: any<String>(named: 'key')),
    ).thenAnswer((_) async => base64Encode(existing));

    expect(await store.keyForDevice(), existing);
    verifyNever(
      () => storage.write(
        key: any<String>(named: 'key'),
        value: any<String>(named: 'value'),
      ),
    );
  });

  test('regenerates when the stored value is the wrong length', () async {
    when(
      () => storage.read(key: any<String>(named: 'key')),
    ).thenAnswer((_) async => base64Encode(<int>[1, 2, 3]));

    final Uint8List key = await store.keyForDevice();

    expect(key.length, 32);
    verify(
      () => storage.write(
        key: any<String>(named: 'key'),
        value: any<String>(named: 'value'),
      ),
    ).called(1);
  });

  test('two generated keys differ', () async {
    when(
      () => storage.read(key: any<String>(named: 'key')),
    ).thenAnswer((_) async => null);

    final Uint8List a = await store.keyForDevice();
    final Uint8List b = await SecureDownloadKeyStore(storage).keyForDevice();

    expect(a, isNot(b));
  });
}
```

- [ ] **Step 2: Run to verify it fails**

```bash
cd /home/kkucherenkov/projects/petProjects/course_shelf/apps/mobile
flutter test test/features/downloads/secure_download_key_store_test.dart
```

Expected: compile error, `secure_download_key_store.dart` does not exist.

- [ ] **Step 3: Write the port**

```dart
// apps/mobile/lib/features/downloads/domain/download_key_store.dart
import 'dart:typed_data';

/// Port — supplies the device-bound AES-256 key that encrypts every download.
///
/// Deliberately not a Drift column. `downloaded_lessons` stores the per-file
/// nonce and nothing else: a key stored beside its own ciphertext is not
/// encryption.
abstract class DownloadKeyStore {
  /// 32 bytes. Generated on first use and stable for the install's lifetime.
  Future<Uint8List> keyForDevice();
}
```

- [ ] **Step 4: Write the implementation**

```dart
// apps/mobile/lib/features/downloads/data/secure_download_key_store.dart
import 'dart:convert';
import 'dart:math';
import 'dart:typed_data';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import 'package:app_mobile/features/downloads/domain/download_key_store.dart';

/// [DownloadKeyStore] over `flutter_secure_storage` — Keystore on Android,
/// Keychain on iOS. Mirrors the constructor seam of `SecureTokenStorage` so a
/// test can inject a fake; the plugin has no implementation under
/// `flutter test`.
class SecureDownloadKeyStore implements DownloadKeyStore {
  SecureDownloadKeyStore([FlutterSecureStorage? storage])
    : _storage = storage ?? const FlutterSecureStorage(iOptions: _iosOptions);

  /// A `BGAppRefreshTask` can fire while the device is locked. The package
  /// default is `KeychainAccessibility.unlocked`, which would make the key
  /// unreadable exactly then — the download would stall with no error and no
  /// way to diagnose it from Dart. `first_unlock` keeps it readable after the
  /// first unlock following a reboot, which is what background resume needs.
  static const IOSOptions _iosOptions = IOSOptions(
    accessibility: KeychainAccessibility.first_unlock,
  );

  static const String _storageKey = 'download_master_key_v1';
  static const int _keyLengthBytes = 32;

  final FlutterSecureStorage _storage;
  final Random _random = Random.secure();

  @override
  Future<Uint8List> keyForDevice() async {
    final String? existing = await _storage.read(key: _storageKey);
    if (existing != null) {
      final Uint8List decoded = base64Decode(existing);
      if (decoded.length == _keyLengthBytes) return decoded;
      // A wrong-length value can only come from a corrupted store. Regenerating
      // orphans any file encrypted under the old key — those rows fail their
      // tag check and are re-marked `failed`, which is recoverable. Refusing to
      // generate would instead break every future download forever.
    }

    final Uint8List fresh = Uint8List.fromList(
      List<int>.generate(_keyLengthBytes, (_) => _random.nextInt(256)),
    );
    await _storage.write(key: _storageKey, value: base64Encode(fresh));
    return fresh;
  }
}
```

- [ ] **Step 5: Run to verify it passes**

```bash
cd /home/kkucherenkov/projects/petProjects/course_shelf/apps/mobile
flutter analyze && flutter test test/features/downloads/secure_download_key_store_test.dart
```

Expected: `No issues found!` and 4 tests pass.

- [ ] **Step 6: Commit**

```bash
cd /home/kkucherenkov/projects/petProjects/course_shelf
git add apps/mobile/lib/features/downloads apps/mobile/test/features/downloads
git commit -m "feat(mobile): device-bound AES key in secure storage (#122)

iOS options pin accessibility to first_unlock. The package default, unlocked,
makes the key unreadable to a BGAppRefreshTask on a locked device — the
download would stall silently, and it is not diagnosable from Dart.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: ChunkedGcmWriter

Closes issue #121. Append-only, seals whole blocks, and can reopen a partially written file at a block boundary.

**Files:**
- Create: `apps/mobile/lib/features/downloads/data/chunked_gcm_writer.dart`
- Test: `apps/mobile/test/features/downloads/chunked_gcm_writer_test.dart`

**Interfaces:**
- Consumes: `EncryptedFileFormat` (Task 3).
- Produces:
  - `ChunkedGcmWriter.create({required File file, required Uint8List key})` → `Future<ChunkedGcmWriter>` — writes a fresh header with a random nonce
  - `ChunkedGcmWriter.resume({required File file, required Uint8List key, required int committedPlaintextBytes})` → `Future<ChunkedGcmWriter>` — truncates to the block boundary implied by `committedPlaintextBytes`
  - `Future<void> add(List<int> chunk)`
  - `int get committedPlaintextBytes`
  - `Future<int> finish()` — seals the short final block, returns total plaintext bytes
  - `Future<void> close()`

**Note before implementing:** `cryptography` 2.9.0 raises `SecretBoxAuthenticationError` on a tag mismatch. If `flutter analyze` reports that name as undefined, check the installed package's `lib/src/cryptography/secret_box.dart` for the actual class and update Task 6's test accordingly — this is the only symbol in the plan taken from package docs rather than verified against the installed source.

- [ ] **Step 1: Write the failing test**

```dart
// apps/mobile/test/features/downloads/chunked_gcm_writer_test.dart
import 'dart:io';
import 'dart:math';
import 'dart:typed_data';

import 'package:flutter_test/flutter_test.dart';

import 'package:app_mobile/features/downloads/data/chunked_gcm_writer.dart';
import 'package:app_mobile/features/downloads/domain/encrypted_file_format.dart';

void main() {
  late Directory dir;
  late File file;

  final Uint8List key = Uint8List.fromList(
    List<int>.generate(32, (int i) => i * 7 % 256),
  );

  Uint8List plaintext(int length) {
    final Random random = Random(1234);
    return Uint8List.fromList(
      List<int>.generate(length, (_) => random.nextInt(256)),
    );
  }

  setUp(() async {
    dir = await Directory.systemTemp.createTemp('csdl_writer');
    file = File('${dir.path}/lesson.csdl');
  });

  tearDown(() => dir.delete(recursive: true));

  test('writes a valid header before any block', () async {
    final ChunkedGcmWriter writer = await ChunkedGcmWriter.create(
      file: file,
      key: key,
    );
    await writer.close();

    final Uint8List header = await file.readAsBytes();
    expect(header.length, EncryptedFileFormat.headerLength);
    expect(EncryptedFileFormat.readNonce(header).length, 12);
  });

  test('commits only whole blocks as bytes arrive', () async {
    final ChunkedGcmWriter writer = await ChunkedGcmWriter.create(
      file: file,
      key: key,
    );

    await writer.add(plaintext(EncryptedFileFormat.blockSize - 1));
    expect(writer.committedPlaintextBytes, 0, reason: 'partial block held back');

    await writer.add(plaintext(1));
    expect(writer.committedPlaintextBytes, EncryptedFileFormat.blockSize);

    await writer.close();
    expect(await file.length(), EncryptedFileFormat.storedLengthFor(1));
  });

  test('finish seals a short trailing block', () async {
    final ChunkedGcmWriter writer = await ChunkedGcmWriter.create(
      file: file,
      key: key,
    );

    await writer.add(plaintext(EncryptedFileFormat.blockSize + 100));
    final int total = await writer.finish();
    await writer.close();

    expect(total, EncryptedFileFormat.blockSize + 100);
    expect(
      await file.length(),
      EncryptedFileFormat.storedLengthFor(1) + 100 + EncryptedFileFormat.tagLength,
    );
  });

  test('resume truncates a file that ran ahead of its row', () async {
    final ChunkedGcmWriter writer = await ChunkedGcmWriter.create(
      file: file,
      key: key,
    );
    await writer.add(plaintext(EncryptedFileFormat.blockSize * 3));
    await writer.close();

    // The row only ever recorded 1 block — simulating a crash between the file
    // write and the 4 MiB flush. The file must be cut back to match the row.
    final ChunkedGcmWriter resumed = await ChunkedGcmWriter.resume(
      file: file,
      key: key,
      committedPlaintextBytes: EncryptedFileFormat.blockSize,
    );

    expect(resumed.committedPlaintextBytes, EncryptedFileFormat.blockSize);
    expect(await file.length(), EncryptedFileFormat.storedLengthFor(1));
    await resumed.close();
  });

  test('resume rejects a byte count that is not a block boundary', () async {
    final ChunkedGcmWriter writer = await ChunkedGcmWriter.create(
      file: file,
      key: key,
    );
    await writer.close();

    expect(
      () => ChunkedGcmWriter.resume(
        file: file,
        key: key,
        committedPlaintextBytes: 5,
      ),
      throwsA(isA<ArgumentError>()),
    );
  });
}
```

- [ ] **Step 2: Run to verify it fails**

```bash
cd /home/kkucherenkov/projects/petProjects/course_shelf/apps/mobile
flutter test test/features/downloads/chunked_gcm_writer_test.dart
```

Expected: compile error, `chunked_gcm_writer.dart` does not exist.

- [ ] **Step 3: Implement**

```dart
// apps/mobile/lib/features/downloads/data/chunked_gcm_writer.dart
import 'dart:io';
import 'dart:math';
import 'dart:typed_data';

import 'package:cryptography/cryptography.dart';

import 'package:app_mobile/features/downloads/domain/encrypted_file_format.dart';

/// Append-only writer for the `.csdl` container.
///
/// Buffers incoming bytes and seals them one whole block at a time. A partial
/// block is never written, which is what makes an app kill mid-block harmless:
/// the file always ends on a block boundary, so there is nothing to repair.
class ChunkedGcmWriter {
  ChunkedGcmWriter._({
    required RandomAccessFile handle,
    required SecretKey secretKey,
    required Uint8List fileNonce,
    required int committedBlocks,
  }) : _handle = handle,
       _secretKey = secretKey,
       _fileNonce = fileNonce,
       _committedBlocks = committedBlocks;

  static final AesGcm _algorithm = AesGcm.with256bits();

  final RandomAccessFile _handle;
  final SecretKey _secretKey;
  final Uint8List _fileNonce;
  final BytesBuilder _buffer = BytesBuilder(copy: false);

  int _committedBlocks;
  bool _finished = false;

  /// Plaintext bytes sealed to disk so far. Always a whole multiple of
  /// [EncryptedFileFormat.blockSize] until [finish] runs.
  int get committedPlaintextBytes =>
      _committedBlocks * EncryptedFileFormat.blockSize;

  /// Starts a new container: writes the 24-byte header with a fresh random
  /// nonce, positioned to append block 0.
  static Future<ChunkedGcmWriter> create({
    required File file,
    required Uint8List key,
  }) async {
    final Random random = Random.secure();
    final Uint8List fileNonce = Uint8List.fromList(
      List<int>.generate(
        EncryptedFileFormat.nonceLength,
        (_) => random.nextInt(256),
      ),
    );

    await file.parent.create(recursive: true);
    final RandomAccessFile handle = await file.open(mode: FileMode.write);
    await handle.writeFrom(EncryptedFileFormat.buildHeader(fileNonce));

    return ChunkedGcmWriter._(
      handle: handle,
      secretKey: SecretKey(key),
      fileNonce: fileNonce,
      committedBlocks: 0,
    );
  }

  /// Reopens an existing container to continue after [committedPlaintextBytes].
  ///
  /// The Drift row is the source of truth, so the file is **truncated down** to
  /// the length that byte count implies. If the file ran ahead — a crash
  /// between a block write and the next 4 MiB flush — the excess is discarded
  /// and re-fetched. That is at most 4 MiB, and it is what removes the "is the
  /// file ahead of the row?" question entirely.
  static Future<ChunkedGcmWriter> resume({
    required File file,
    required Uint8List key,
    required int committedPlaintextBytes,
  }) async {
    if (committedPlaintextBytes % EncryptedFileFormat.blockSize != 0) {
      throw ArgumentError.value(
        committedPlaintextBytes,
        'committedPlaintextBytes',
        'must be a whole number of ${EncryptedFileFormat.blockSize}-byte blocks',
      );
    }

    final RandomAccessFile handle = await file.open(mode: FileMode.append);
    final Uint8List header = Uint8List(EncryptedFileFormat.headerLength);
    await handle.setPosition(0);
    await handle.readInto(header);
    final Uint8List fileNonce = EncryptedFileFormat.readNonce(header);

    final int blocks = EncryptedFileFormat.wholeBlocksIn(
      committedPlaintextBytes,
    );
    await handle.truncate(EncryptedFileFormat.storedLengthFor(blocks));
    await handle.setPosition(EncryptedFileFormat.storedLengthFor(blocks));

    return ChunkedGcmWriter._(
      handle: handle,
      secretKey: SecretKey(key),
      fileNonce: fileNonce,
      committedBlocks: blocks,
    );
  }

  /// Buffers [chunk] and seals every whole block it completes.
  Future<void> add(List<int> chunk) async {
    if (_finished) {
      throw StateError('Writer already finished');
    }
    _buffer.add(chunk);
    while (_buffer.length >= EncryptedFileFormat.blockSize) {
      final Uint8List pending = _buffer.takeBytes();
      int consumed = 0;
      while (pending.length - consumed >= EncryptedFileFormat.blockSize) {
        await _seal(
          Uint8List.sublistView(
            pending,
            consumed,
            consumed + EncryptedFileFormat.blockSize,
          ),
        );
        consumed += EncryptedFileFormat.blockSize;
      }
      if (consumed < pending.length) {
        _buffer.add(Uint8List.sublistView(pending, consumed));
      }
    }
  }

  /// Seals whatever partial block remains and returns the container's total
  /// plaintext length. Call exactly once, when the HTTP body ends.
  Future<int> finish() async {
    if (_finished) {
      throw StateError('Writer already finished');
    }
    final Uint8List tail = _buffer.takeBytes();
    int total = committedPlaintextBytes;
    if (tail.isNotEmpty) {
      await _seal(tail);
      // _seal counted a whole block; correct to the real tail length.
      total = (_committedBlocks - 1) * EncryptedFileFormat.blockSize +
          tail.length;
    }
    _finished = true;
    await _handle.flush();
    return total;
  }

  Future<void> close() => _handle.close();

  Future<void> _seal(Uint8List block) async {
    final SecretBox box = await _algorithm.encrypt(
      block,
      secretKey: _secretKey,
      nonce: EncryptedFileFormat.nonceForBlock(_fileNonce, _committedBlocks),
    );
    await _handle.writeFrom(box.cipherText);
    await _handle.writeFrom(box.mac.bytes);
    _committedBlocks++;
  }
}
```

- [ ] **Step 4: Run to verify it passes**

```bash
cd /home/kkucherenkov/projects/petProjects/course_shelf/apps/mobile
flutter analyze && flutter test test/features/downloads/chunked_gcm_writer_test.dart
```

Expected: `No issues found!` and 5 tests pass.

- [ ] **Step 5: Commit**

```bash
cd /home/kkucherenkov/projects/petProjects/course_shelf
git add apps/mobile/lib/features/downloads apps/mobile/test/features/downloads
git commit -m "feat(mobile): chunked AES-GCM writer with block-boundary resume (#121)

Seals whole 256 KiB blocks only, so the file always ends on a block boundary
and an app kill needs no repair. resume() truncates the file down to the length
the Drift row implies — the row is the source of truth, and that one rule
removes the 'is the file ahead of the row?' question.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: ChunkedGcmReader

Random-access decryption. The loopback server (Task 11) and E19-F01-S02's integrity check both sit on this.

**Files:**
- Create: `apps/mobile/lib/features/downloads/data/chunked_gcm_reader.dart`
- Test: `apps/mobile/test/features/downloads/chunked_gcm_reader_test.dart`

**Interfaces:**
- Consumes: `EncryptedFileFormat` (Task 3), `ChunkedGcmWriter` (Task 5, tests only).
- Produces:
  - `ChunkedGcmReader.open({required File file, required Uint8List key})` → `Future<ChunkedGcmReader>`
  - `int get plaintextLength`
  - `Future<Uint8List> read(int offset, int length)`
  - `Future<void> close()`

- [ ] **Step 1: Write the failing test**

```dart
// apps/mobile/test/features/downloads/chunked_gcm_reader_test.dart
import 'dart:io';
import 'dart:math';
import 'dart:typed_data';

import 'package:cryptography/cryptography.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:app_mobile/features/downloads/data/chunked_gcm_reader.dart';
import 'package:app_mobile/features/downloads/data/chunked_gcm_writer.dart';
import 'package:app_mobile/features/downloads/domain/encrypted_file_format.dart';

void main() {
  late Directory dir;
  late File file;

  final Uint8List key = Uint8List.fromList(
    List<int>.generate(32, (int i) => i * 3 % 256),
  );

  Uint8List plaintext(int length) {
    final Random random = Random(99);
    return Uint8List.fromList(
      List<int>.generate(length, (_) => random.nextInt(256)),
    );
  }

  Future<Uint8List> writeFixture(int length) async {
    final Uint8List source = plaintext(length);
    final ChunkedGcmWriter writer = await ChunkedGcmWriter.create(
      file: file,
      key: key,
    );
    await writer.add(source);
    await writer.finish();
    await writer.close();
    return source;
  }

  setUp(() async {
    dir = await Directory.systemTemp.createTemp('csdl_reader');
    file = File('${dir.path}/lesson.csdl');
  });

  tearDown(() => dir.delete(recursive: true));

  test('reports the plaintext length across a short final block', () async {
    await writeFixture(EncryptedFileFormat.blockSize * 2 + 500);

    final ChunkedGcmReader reader = await ChunkedGcmReader.open(
      file: file,
      key: key,
    );
    expect(reader.plaintextLength, EncryptedFileFormat.blockSize * 2 + 500);
    await reader.close();
  });

  test('round-trips the whole file', () async {
    final Uint8List source = await writeFixture(
      EncryptedFileFormat.blockSize + 1000,
    );

    final ChunkedGcmReader reader = await ChunkedGcmReader.open(
      file: file,
      key: key,
    );
    expect(await reader.read(0, reader.plaintextLength), source);
    await reader.close();
  });

  test('reads a range spanning a block boundary', () async {
    final Uint8List source = await writeFixture(
      EncryptedFileFormat.blockSize * 3,
    );
    final int start = EncryptedFileFormat.blockSize - 10;

    final ChunkedGcmReader reader = await ChunkedGcmReader.open(
      file: file,
      key: key,
    );
    expect(
      await reader.read(start, 20),
      Uint8List.sublistView(source, start, start + 20),
    );
    await reader.close();
  });

  test('clamps a read that runs past the end', () async {
    final Uint8List source = await writeFixture(1000);

    final ChunkedGcmReader reader = await ChunkedGcmReader.open(
      file: file,
      key: key,
    );
    expect(await reader.read(900, 5000), Uint8List.sublistView(source, 900));
    await reader.close();
  });

  test('a flipped byte fails authentication at that block', () async {
    await writeFixture(EncryptedFileFormat.blockSize * 2);

    // Corrupt one byte inside block 1's ciphertext.
    final RandomAccessFile handle = await file.open(mode: FileMode.append);
    final int target = EncryptedFileFormat.storedOffsetOf(1) + 42;
    await handle.setPosition(target);
    await handle.writeByte(0xFF);
    await handle.close();

    final ChunkedGcmReader reader = await ChunkedGcmReader.open(
      file: file,
      key: key,
    );

    // Block 0 is untouched and still readable — per-block tags localize damage.
    expect((await reader.read(0, 16)).length, 16);
    await expectLater(
      reader.read(EncryptedFileFormat.blockSize, 16),
      throwsA(isA<SecretBoxAuthenticationError>()),
    );
    await reader.close();
  });

  test('rejects a foreign container', () async {
    await file.writeAsBytes(Uint8List(EncryptedFileFormat.headerLength));
    expect(
      () => ChunkedGcmReader.open(file: file, key: key),
      throwsA(isA<FormatException>()),
    );
  });
}
```

- [ ] **Step 2: Run to verify it fails**

```bash
cd /home/kkucherenkov/projects/petProjects/course_shelf/apps/mobile
flutter test test/features/downloads/chunked_gcm_reader_test.dart
```

Expected: compile error, `chunked_gcm_reader.dart` does not exist.

- [ ] **Step 3: Implement**

```dart
// apps/mobile/lib/features/downloads/data/chunked_gcm_reader.dart
import 'dart:io';
import 'dart:typed_data';

import 'package:cryptography/cryptography.dart';

import 'package:app_mobile/features/downloads/domain/encrypted_file_format.dart';

/// Random-access reader for the `.csdl` container.
///
/// Decrypts only the blocks a requested range actually touches, which is what
/// lets `video_player` seek through an encrypted file at all. A whole-file GCM
/// blob would have to be decrypted from byte 0 for every seek.
class ChunkedGcmReader {
  ChunkedGcmReader._({
    required RandomAccessFile handle,
    required SecretKey secretKey,
    required Uint8List fileNonce,
    required this.plaintextLength,
  }) : _handle = handle,
       _secretKey = secretKey,
       _fileNonce = fileNonce;

  static final AesGcm _algorithm = AesGcm.with256bits();

  final RandomAccessFile _handle;
  final SecretKey _secretKey;
  final Uint8List _fileNonce;

  /// Total decrypted length of the container.
  final int plaintextLength;

  static Future<ChunkedGcmReader> open({
    required File file,
    required Uint8List key,
  }) async {
    final RandomAccessFile handle = await file.open();
    final Uint8List header = Uint8List(EncryptedFileFormat.headerLength);
    await handle.readInto(header);
    // Throws FormatException on a bad magic or an unknown version.
    final Uint8List fileNonce = EncryptedFileFormat.readNonce(header);

    return ChunkedGcmReader._(
      handle: handle,
      secretKey: SecretKey(key),
      fileNonce: fileNonce,
      plaintextLength: EncryptedFileFormat.plaintextLengthFor(
        await file.length(),
      ),
    );
  }

  /// Plaintext bytes `[offset, offset + length)`, clamped to the end of the
  /// container.
  Future<Uint8List> read(int offset, int length) async {
    final int end = min(offset + length, plaintextLength);
    if (offset >= plaintextLength || end <= offset) return Uint8List(0);

    final int firstBlock = EncryptedFileFormat.blockIndexAt(offset);
    final int lastBlock = EncryptedFileFormat.blockIndexAt(end - 1);
    final BytesBuilder out = BytesBuilder(copy: false);

    for (int index = firstBlock; index <= lastBlock; index++) {
      final Uint8List block = await _decryptBlock(index);
      final int blockStart = index * EncryptedFileFormat.blockSize;
      final int from = index == firstBlock ? offset - blockStart : 0;
      final int to = index == lastBlock ? end - blockStart : block.length;
      out.add(Uint8List.sublistView(block, from, to));
    }

    return out.takeBytes();
  }

  Future<void> close() => _handle.close();

  Future<Uint8List> _decryptBlock(int index) async {
    final int blockStart = index * EncryptedFileFormat.blockSize;
    final int plaintextInBlock = min(
      EncryptedFileFormat.blockSize,
      plaintextLength - blockStart,
    );

    await _handle.setPosition(EncryptedFileFormat.storedOffsetOf(index));
    final Uint8List cipherText = Uint8List(plaintextInBlock);
    await _handle.readInto(cipherText);
    final Uint8List mac = Uint8List(EncryptedFileFormat.tagLength);
    await _handle.readInto(mac);

    // Throws SecretBoxAuthenticationError if this block was tampered with or
    // truncated. Per-block tags mean the damage is scoped to this block, not
    // the whole download.
    final List<int> clear = await _algorithm.decrypt(
      SecretBox(
        cipherText,
        nonce: EncryptedFileFormat.nonceForBlock(_fileNonce, index),
        mac: Mac(mac),
      ),
      secretKey: _secretKey,
    );
    return Uint8List.fromList(clear);
  }
}
```

Add `import 'dart:math';` at the top for `min`.

- [ ] **Step 4: Run to verify it passes**

```bash
cd /home/kkucherenkov/projects/petProjects/course_shelf/apps/mobile
flutter analyze && flutter test test/features/downloads/chunked_gcm_reader_test.dart
```

Expected: `No issues found!` and 6 tests pass. If `SecretBoxAuthenticationError` is undefined, see the note in Task 5 and substitute the package's actual error type in both the reader comment and the test.

- [ ] **Step 5: Commit**

```bash
cd /home/kkucherenkov/projects/petProjects/course_shelf
git add apps/mobile/lib/features/downloads apps/mobile/test/features/downloads
git commit -m "feat(mobile): random-access chunked AES-GCM reader

Decrypts only the blocks a range touches, which is what makes seeking through
an encrypted download possible at all. Test proves a flipped byte fails
authentication at its own block while neighbouring blocks stay readable.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: LessonByteSource — mint the URL, fetch the range

Isolates every HTTP concern: minting a fresh signed URL, resolving it against the Dio base, sending the `Range` header, and reading `Content-Range`.

**Files:**
- Create: `apps/mobile/lib/features/downloads/domain/lesson_byte_source.dart`
- Create: `apps/mobile/lib/features/downloads/data/http_lesson_byte_source.dart`
- Test: `apps/mobile/test/features/downloads/http_lesson_byte_source_test.dart`

**Interfaces:**
- Consumes: `RecordingHttpAdapter` (Task 1, tests only).
- Produces:
  - `class RangedResponse { final Stream<Uint8List> bytes; final int? totalBytes; }`
  - `abstract class LessonByteSource { Future<RangedResponse> fetchFrom({required String lessonId, required int offset, CancelToken? cancelToken}); }`
  - `HttpLessonByteSource({required Dio dio})`

- [ ] **Step 1: Write the failing test**

```dart
// apps/mobile/test/features/downloads/http_lesson_byte_source_test.dart
import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:app_mobile/features/downloads/data/http_lesson_byte_source.dart';
import 'package:app_mobile/features/downloads/domain/lesson_byte_source.dart';

import '../../support/recording_http_adapter.dart';

void main() {
  late Dio dio;
  late RecordingHttpAdapter adapter;

  ResponseBody jsonUrl() => ResponseBody.fromString(
    '{"url":"/api/v1/stream/lessons/l1?token=tok","token":"tok",'
    '"expiresAt":"2026-07-29T10:15:00Z"}',
    200,
    headers: <String, List<String>>{
      Headers.contentTypeHeader: <String>[Headers.jsonContentType],
    },
  );

  ResponseBody partial(List<int> bytes, {required String contentRange}) =>
      ResponseBody(
        Stream<Uint8List>.value(Uint8List.fromList(bytes)),
        206,
        headers: <String, List<String>>{
          'content-range': <String>[contentRange],
        },
      );

  setUp(() {
    adapter = RecordingHttpAdapter(
      respond: (RequestOptions options) => options.path.contains('stream-url')
          ? jsonUrl()
          : partial(<int>[1, 2, 3], contentRange: 'bytes 100-102/900'),
    );
    dio = Dio(BaseOptions(baseUrl: 'http://localhost:3000'))
      ..httpClientAdapter = adapter;
  });

  test('mints a fresh signed URL on every fetch', () async {
    final LessonByteSource source = HttpLessonByteSource(dio: dio);

    await source.fetchFrom(lessonId: 'l1', offset: 0);
    await source.fetchFrom(lessonId: 'l1', offset: 0);

    final int mints = adapter.requests
        .where((RequestOptions r) => r.path.contains('stream-url'))
        .length;
    // The token's TTL is 15 minutes; a resume after a long pause must not carry
    // a dead one, so the URL is re-minted every time rather than cached.
    expect(mints, 2);
  });

  test('sends the exact open-ended Range header', () async {
    final LessonByteSource source = HttpLessonByteSource(dio: dio);

    await source.fetchFrom(lessonId: 'l1', offset: 4096);

    final RequestOptions ranged = adapter.requests.last;
    expect(ranged.method, 'GET');
    expect(ranged.headers['Range'], 'bytes=4096-');
  });

  test('omits Range when starting from zero', () async {
    final LessonByteSource source = HttpLessonByteSource(dio: dio);

    await source.fetchFrom(lessonId: 'l1', offset: 0);

    expect(adapter.requests.last.headers.containsKey('Range'), isFalse);
  });

  test('parses the total from Content-Range', () async {
    final LessonByteSource source = HttpLessonByteSource(dio: dio);

    final RangedResponse response = await source.fetchFrom(
      lessonId: 'l1',
      offset: 100,
    );

    expect(response.totalBytes, 900);
  });

  test('falls back to Content-Length on a 200', () async {
    adapter = RecordingHttpAdapter(
      respond: (RequestOptions options) => options.path.contains('stream-url')
          ? jsonUrl()
          : ResponseBody(
              Stream<Uint8List>.value(Uint8List.fromList(<int>[1, 2])),
              200,
              headers: <String, List<String>>{
                'content-length': <String>['2'],
              },
            ),
    );
    dio = Dio(BaseOptions(baseUrl: 'http://localhost:3000'))
      ..httpClientAdapter = adapter;

    final RangedResponse response = await HttpLessonByteSource(
      dio: dio,
    ).fetchFrom(lessonId: 'l1', offset: 0);

    expect(response.totalBytes, 2);
  });

  test('resolves a relative signed URL against the Dio base', () async {
    await HttpLessonByteSource(dio: dio).fetchFrom(lessonId: 'l1', offset: 0);

    expect(adapter.requests.last.uri.host, 'localhost');
    expect(adapter.requests.last.uri.path, '/api/v1/stream/lessons/l1');
  });
}
```

- [ ] **Step 2: Run to verify it fails**

```bash
cd /home/kkucherenkov/projects/petProjects/course_shelf/apps/mobile
flutter test test/features/downloads/http_lesson_byte_source_test.dart
```

Expected: compile error, the source files do not exist.

- [ ] **Step 3: Write the port**

```dart
// apps/mobile/lib/features/downloads/domain/lesson_byte_source.dart
import 'dart:typed_data';

import 'package:dio/dio.dart';

/// One ranged read of a lesson's video.
class RangedResponse {
  const RangedResponse({required this.bytes, required this.totalBytes});

  /// The body, streamed — a lesson video does not fit comfortably in memory.
  final Stream<Uint8List> bytes;

  /// Full length of the resource, from `Content-Range` on a 206 or
  /// `Content-Length` on a 200. Null when the server sent neither.
  final int? totalBytes;
}

/// Port — supplies lesson video bytes starting at an arbitrary offset.
///
/// Exists so the download queue can be tested without HTTP, and so every
/// signed-URL concern (minting, TTL, relative-URL resolution) stays in one
/// implementation.
abstract class LessonByteSource {
  Future<RangedResponse> fetchFrom({
    required String lessonId,
    required int offset,
    CancelToken? cancelToken,
  });
}
```

- [ ] **Step 4: Write the implementation**

```dart
// apps/mobile/lib/features/downloads/data/http_lesson_byte_source.dart
import 'dart:typed_data';

import 'package:dio/dio.dart';

import 'package:app_mobile/features/downloads/domain/lesson_byte_source.dart';

/// [LessonByteSource] over the versioned REST API.
///
/// Mirrors `LessonPlayerApi`: Dio by hand against documented paths, because the
/// generated Dart client is currently unimportable (its codegen output path
/// makes every generated file self-import a directory that does not exist).
class HttpLessonByteSource implements LessonByteSource {
  HttpLessonByteSource({required Dio dio}) : _dio = dio;

  final Dio _dio;

  @override
  Future<RangedResponse> fetchFrom({
    required String lessonId,
    required int offset,
    CancelToken? cancelToken,
  }) async {
    // Minted per call, never cached. The token's TTL is 900s, so a resume after
    // a pause longer than that would otherwise present a dead token and 401.
    final Response<Map<String, dynamic>> minted = await _dio
        .get<Map<String, dynamic>>(
          '/api/v1/lessons/$lessonId/stream-url',
          cancelToken: cancelToken,
        );
    final Map<String, dynamic>? body = minted.data;
    if (body == null) {
      throw const FormatException('Empty stream-url response');
    }
    final String url = _resolveUrl(body['url'] as String);

    final Response<ResponseBody> response = await _dio.get<ResponseBody>(
      url,
      cancelToken: cancelToken,
      options: Options(
        responseType: ResponseType.stream,
        // Omitted at offset 0 so the server answers 200 with the whole body;
        // an open-ended range from 0 would work too, but this keeps a fresh
        // download on the simpler code path.
        headers: offset > 0
            ? <String, dynamic>{'Range': 'bytes=$offset-'}
            : null,
      ),
    );

    final ResponseBody? data = response.data;
    if (data == null) {
      throw const FormatException('Empty stream response');
    }

    return RangedResponse(
      bytes: data.stream,
      totalBytes: _totalFrom(response.headers),
    );
  }

  /// `Content-Range: bytes 100-102/900` -> 900. Falls back to `Content-Length`,
  /// which is the whole resource only on a 200.
  int? _totalFrom(Headers headers) {
    final String? contentRange = headers.value('content-range');
    if (contentRange != null) {
      final int slash = contentRange.lastIndexOf('/');
      if (slash != -1) {
        final String total = contentRange.substring(slash + 1);
        if (total != '*') return int.tryParse(total);
      }
    }
    final String? contentLength = headers.value('content-length');
    return contentLength == null ? null : int.tryParse(contentLength);
  }

  /// The backend returns a same-origin relative path so it never has to know
  /// its own public hostname — the same rule `LessonPlayerApi._resolveUrl`
  /// applies.
  String _resolveUrl(String raw) {
    if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
    final String base = _dio.options.baseUrl;
    if (base.isEmpty) return raw;
    return Uri.parse(base).resolve(raw).toString();
  }
}
```

- [ ] **Step 5: Run to verify it passes**

```bash
cd /home/kkucherenkov/projects/petProjects/course_shelf/apps/mobile
flutter analyze && flutter test test/features/downloads/http_lesson_byte_source_test.dart
```

Expected: `No issues found!` and 6 tests pass.

- [ ] **Step 6: Commit**

```bash
cd /home/kkucherenkov/projects/petProjects/course_shelf
git add apps/mobile/lib/features/downloads apps/mobile/test/features/downloads
git commit -m "feat(mobile): ranged lesson byte source with per-call URL minting

The signed stream token lives 900s, so the URL is re-minted on every fetch
rather than cached — a resume after a long pause must never carry a dead token.
Tests pin the literal 'bytes=<n>-' header string.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 8: DownloadScheduler port and platform adapter

Closes issue #123. Kept deliberately thin: the untestable platform surface is a registration call and nothing else.

**Files:**
- Create: `apps/mobile/lib/features/downloads/domain/download_scheduler_port.dart`
- Create: `apps/mobile/lib/features/downloads/data/platform_download_scheduler.dart`
- Test: `apps/mobile/test/features/downloads/platform_download_scheduler_test.dart`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `abstract class DownloadSchedulerPort { Future<void> ensureScheduled(); Future<void> cancelAll(); }`
  - `PlatformDownloadScheduler({required Future<void> Function() register, required Future<void> Function() cancel})`
  - `const String kDownloadResumeTask = 'course-shelf.downloads.resume';`

- [ ] **Step 1: Write the failing test**

```dart
// apps/mobile/test/features/downloads/platform_download_scheduler_test.dart
import 'package:flutter_test/flutter_test.dart';

import 'package:app_mobile/features/downloads/data/platform_download_scheduler.dart';
import 'package:app_mobile/features/downloads/domain/download_scheduler_port.dart';

void main() {
  test('ensureScheduled registers exactly once per call', () async {
    int registered = 0;
    final DownloadSchedulerPort scheduler = PlatformDownloadScheduler(
      register: () async => registered++,
      cancel: () async {},
    );

    await scheduler.ensureScheduled();
    expect(registered, 1);
  });

  test('a registration failure never propagates', () async {
    final DownloadSchedulerPort scheduler = PlatformDownloadScheduler(
      register: () async => throw Exception('no platform channel'),
      cancel: () async {},
    );

    // Background scheduling is opportunistic. Foreground download plus
    // resume-on-launch already guarantee completion, so a platform that refuses
    // to register must not take the queue down with it.
    await expectLater(scheduler.ensureScheduled(), completes);
  });

  test('cancelAll delegates and swallows failures', () async {
    int cancelled = 0;
    final DownloadSchedulerPort scheduler = PlatformDownloadScheduler(
      register: () async {},
      cancel: () async => cancelled++,
    );

    await scheduler.cancelAll();
    expect(cancelled, 1);
  });
}
```

- [ ] **Step 2: Run to verify it fails**

```bash
cd /home/kkucherenkov/projects/petProjects/course_shelf/apps/mobile
flutter test test/features/downloads/platform_download_scheduler_test.dart
```

Expected: compile error, the files do not exist.

- [ ] **Step 3: Write the port**

```dart
// apps/mobile/lib/features/downloads/domain/download_scheduler_port.dart

/// Port — asks the OS for a future opportunity to resume unfinished downloads.
///
/// Intentionally tiny. Android's WorkManager is Doze-constrained and
/// time-capped; iOS's `BGAppRefreshTask` grants only short opportunistic
/// windows and cannot carry a large transfer at all (that needs a background
/// `URLSession`, which is native code behind a platform channel). So neither
/// platform is asked to *perform* a download — only to wake the app so the
/// queue can resume what is unfinished.
///
/// Foreground download plus resume-on-launch is what actually guarantees
/// completion. This is opportunism layered on top.
abstract class DownloadSchedulerPort {
  Future<void> ensureScheduled();
  Future<void> cancelAll();
}
```

- [ ] **Step 4: Write the adapter**

```dart
// apps/mobile/lib/features/downloads/data/platform_download_scheduler.dart
import 'package:app_mobile/features/downloads/domain/download_scheduler_port.dart';

/// Unique name for the OS-side resume task.
const String kDownloadResumeTask = 'course-shelf.downloads.resume';

/// [DownloadSchedulerPort] backed by whatever the platform offers.
///
/// The platform calls are injected rather than imported directly so this class
/// is testable on a host with no Android or iOS toolchain. `main.dart` supplies
/// the real `workmanager` closures; a test supplies counters.
class PlatformDownloadScheduler implements DownloadSchedulerPort {
  PlatformDownloadScheduler({
    required Future<void> Function() register,
    required Future<void> Function() cancel,
  }) : _register = register,
       _cancel = cancel;

  final Future<void> Function() _register;
  final Future<void> Function() _cancel;

  @override
  Future<void> ensureScheduled() async {
    try {
      await _register();
    } on Object {
      // Swallowed by design. A platform that will not register background work
      // (an OS refusal, a missing plugin, a desktop host) must not fail the
      // enqueue: the foreground pump and resume-on-launch still complete the
      // download. Rethrowing would turn an optimization into a hard dependency.
    }
  }

  @override
  Future<void> cancelAll() async {
    try {
      await _cancel();
    } on Object {
      // Same rationale as ensureScheduled.
    }
  }
}
```

- [ ] **Step 5: Run to verify it passes**

```bash
cd /home/kkucherenkov/projects/petProjects/course_shelf/apps/mobile
flutter analyze && flutter test test/features/downloads/platform_download_scheduler_test.dart
```

Expected: `No issues found!` and 3 tests pass.

- [ ] **Step 6: Commit**

```bash
cd /home/kkucherenkov/projects/petProjects/course_shelf
git add apps/mobile/lib/features/downloads apps/mobile/test/features/downloads
git commit -m "feat(mobile): background download scheduler port (#123)

Platform calls are injected, so the adapter is testable on a host with no
Android or iOS toolchain. Registration failures are swallowed: background
scheduling is opportunistic, and foreground download plus resume-on-launch
already guarantee completion.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 9: DownloadsRepository — the pump

The orchestrator. Owns the serial queue, the 4 MiB flush cadence, resume truncation, retry/backoff, and the offline distinction.

**Files:**
- Create: `apps/mobile/lib/features/downloads/domain/download_item.dart`
- Create: `apps/mobile/lib/features/downloads/domain/downloads_repository.dart`
- Create: `apps/mobile/lib/features/downloads/data/downloads_repository_impl.dart`
- Test: `apps/mobile/test/features/downloads/downloads_repository_impl_test.dart`

**Interfaces:**
- Consumes: `DownloadsDao` (Task 2), `EncryptedFileFormat` (Task 3), `DownloadKeyStore` (Task 4), `ChunkedGcmWriter` (Task 5), `LessonByteSource`/`RangedResponse` (Task 7), `DownloadSchedulerPort` (Task 8).
- Produces:
  - `class DownloadItem` with `lessonId`, `state`, `bytesDownloaded`, `totalBytes`, `lastError`, `attemptCount`, and `double? get progress`
  - `abstract class DownloadsRepository` with `enqueueLesson`, `enqueueCourse`, `pause`, `resume`, `cancel`, `retry`, `reconcileAfterRestart`, `Stream<List<DownloadItem>> watchAll()`, `Stream<DownloadItem?> watch(String)`
  - `DownloadsRepositoryImpl({required DownloadsDao dao, required LessonByteSource byteSource, required DownloadKeyStore keyStore, required DownloadSchedulerPort scheduler, required Future<Directory> Function() downloadsDirectory, required Future<bool> Function() isOnline})`

- [ ] **Step 1: Write the domain value object**

```dart
// apps/mobile/lib/features/downloads/domain/download_item.dart
import 'package:equatable/equatable.dart';

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
  });

  factory DownloadItem.fromRow(DownloadedLesson row) => DownloadItem(
    lessonId: row.lessonId,
    state: row.state,
    bytesDownloaded: row.bytesDownloaded,
    totalBytes: row.totalBytes,
    attemptCount: row.attemptCount,
    courseId: row.courseId,
    lastError: row.lastError,
  );

  final String lessonId;
  final String? courseId;
  final DownloadState state;
  final int bytesDownloaded;
  final int? totalBytes;
  final int attemptCount;
  final String? lastError;

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
  ];
}
```

- [ ] **Step 2: Write the port**

```dart
// apps/mobile/lib/features/downloads/domain/downloads_repository.dart
import 'package:app_mobile/features/downloads/domain/download_item.dart';

/// Port — the download queue as the BLoC sees it.
abstract class DownloadsRepository {
  Future<void> enqueueLesson(String lessonId, {String? courseId});

  /// Enqueues every lesson of a course that is not already `ready`.
  Future<void> enqueueCourse(String courseId, List<String> lessonIds);

  Future<void> pause(String lessonId);
  Future<void> resume(String lessonId);

  /// Deletes the row and its partial file — cancel has no terminal state
  /// because there is nothing left to resume from.
  Future<void> cancel(String lessonId);

  Future<void> retry(String lessonId);

  /// Called once at startup. Any row left `downloading` by an app kill is
  /// reconciled to `paused`; nothing was committed mid-block, so no file
  /// repair is needed.
  Future<void> reconcileAfterRestart();

  /// High-frequency progress for the active item plus the persisted rest.
  Stream<List<DownloadItem>> watchAll();

  Stream<DownloadItem?> watch(String lessonId);
}
```

- [ ] **Step 3: Write the failing test**

```dart
// apps/mobile/test/features/downloads/downloads_repository_impl_test.dart
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
        bytes: Stream<Uint8List>.fromIterable(<Uint8List>[
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
      abortAfter: EncryptedFileFormat.blockSize + EncryptedFileFormat.blockSize ~/ 2,
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

    await build(_ScriptedByteSource(payload: payload(1)))
        .reconcileAfterRestart();

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
```

- [ ] **Step 4: Run to verify it fails**

```bash
cd /home/kkucherenkov/projects/petProjects/course_shelf/apps/mobile
flutter test test/features/downloads/downloads_repository_impl_test.dart
```

Expected: compile error, `downloads_repository_impl.dart` does not exist.

- [ ] **Step 5: Implement the repository**

```dart
// apps/mobile/lib/features/downloads/data/downloads_repository_impl.dart
import 'dart:async';
import 'dart:io';
import 'dart:math';
import 'dart:typed_data';

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
    await _dao.upsert(
      DownloadedLessonsCompanion(
        lessonId: Value<String>(lessonId),
        state: const Value<DownloadState>(DownloadState.queued),
        attemptCount: Value<int>(row.attemptCount + 1),
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
  Stream<List<DownloadItem>> watchAll() => _dao
      .watchAll()
      .map(
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
      final DownloadedLesson? next = await _dao.nextQueued();
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
        if (sinceFlush >=
            _flushEveryBlocks * EncryptedFileFormat.blockSize) {
          await _persistProgress(row.lessonId, committed, response.totalBytes);
          lastFlushed = committed;
        }
      }

      final int total = await writer.finish();
      await writer.close();
      writer = null;

      await _dao.upsert(
        DownloadedLessonsCompanion(
          lessonId: Value<String>(row.lessonId),
          state: const Value<DownloadState>(DownloadState.ready),
          bytesDownloaded: Value<int>(total),
          totalBytes: Value<int?>(response.totalBytes ?? total),
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

    final int attempts = row.attemptCount + 1;
    final bool exhausted = attempts >= _maxAttempts;

    await _dao.upsert(
      DownloadedLessonsCompanion(
        lessonId: Value<String>(row.lessonId),
        state: Value<DownloadState>(
          exhausted ? DownloadState.failed : DownloadState.queued,
        ),
        bytesDownloaded: Value<int>(
          committedPlaintextBytes ?? row.bytesDownloaded,
        ),
        attemptCount: Value<int>(attempts),
        lastError: Value<String?>(error.toString()),
        updatedAt: Value<DateTime>(DateTime.now().toUtc()),
      ),
    );

    if (!exhausted) {
      // 2^n seconds, capped. Gives a flapping connection room to settle without
      // spinning the radio.
      final Duration wait = Duration(
        seconds: min(1 << attempts, _maxBackoff.inSeconds),
      );
      await Future<void>.delayed(wait);
    }
  }

  Future<void> _persistProgress(
    String lessonId,
    int bytesDownloaded,
    int? totalBytes,
  ) => _dao.upsert(
    DownloadedLessonsCompanion(
      lessonId: Value<String>(lessonId),
      bytesDownloaded: Value<int>(bytesDownloaded),
      totalBytes: Value<int?>(totalBytes),
      updatedAt: Value<DateTime>(DateTime.now().toUtc()),
    ),
  );

  Future<void> _setState(String lessonId, DownloadState state) => _dao.upsert(
    DownloadedLessonsCompanion(
      lessonId: Value<String>(lessonId),
      state: Value<DownloadState>(state),
      updatedAt: Value<DateTime>(DateTime.now().toUtc()),
    ),
  );
}
```

Two supporting pieces this needs:

Add `watchAll` to `apps/mobile/lib/shared/db/daos/downloads_dao.dart`:

```dart
  /// Every row, for the Downloads tab (E19-F01-S03).
  Stream<List<DownloadedLesson>> watchAll() => select(downloadedLessons).watch();
```

And add `async` to `pubspec.yaml` dependencies for `StreamGroup`:

```bash
cd /home/kkucherenkov/projects/petProjects/course_shelf/apps/mobile
flutter pub add async
```

then import it in the repository:

```dart
import 'package:async/async.dart' show StreamGroup;
```

- [ ] **Step 6: Run to verify it passes**

```bash
cd /home/kkucherenkov/projects/petProjects/course_shelf/apps/mobile
flutter analyze && flutter test test/features/downloads/downloads_repository_impl_test.dart
```

Expected: `No issues found!` and 8 tests pass.

- [ ] **Step 7: Commit**

```bash
cd /home/kkucherenkov/projects/petProjects/course_shelf
git add apps/mobile/lib apps/mobile/test apps/mobile/pubspec.yaml apps/mobile/pubspec.lock
git commit -m "feat(mobile): serial download queue with 4 MiB flush cadence

The Drift row is the source of truth and resume truncates the file down to
match it, so a crash between a block write and the next flush costs at most
4 MiB of re-download and needs no file repair. Offline is distinguished from
failure: the row stays queued and burns no attempt.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 10: DownloadsBloc

Closes issue #120. Thin by design — the queue mechanics live in the repository, so the BLoC is event translation plus a stream subscription.

**Files:**
- Create: `apps/mobile/lib/features/downloads/presentation/bloc/downloads_event.dart`
- Create: `apps/mobile/lib/features/downloads/presentation/bloc/downloads_state.dart`
- Create: `apps/mobile/lib/features/downloads/presentation/bloc/downloads_bloc.dart`
- Test: `apps/mobile/test/features/downloads/downloads_bloc_test.dart`

**Interfaces:**
- Consumes: `DownloadsRepository`, `DownloadItem` (Task 9).
- Produces:
  - Events: `DownloadsStarted`, `EnqueueLesson(lessonId, courseId)`, `EnqueueCourse(courseId, lessonIds)`, `PauseDownload(lessonId)`, `ResumeDownload(lessonId)`, `CancelDownload(lessonId)`, `RetryDownload(lessonId)`
  - `DownloadsState({required items, required isLoading})` with `DownloadItem? itemFor(String lessonId)`

- [ ] **Step 1: Write the events**

```dart
// apps/mobile/lib/features/downloads/presentation/bloc/downloads_event.dart
import 'package:equatable/equatable.dart';

sealed class DownloadsEvent extends Equatable {
  const DownloadsEvent();

  @override
  List<Object?> get props => const <Object?>[];
}

/// Subscribes to the queue and reconciles anything an app kill stranded.
final class DownloadsStarted extends DownloadsEvent {
  const DownloadsStarted();
}

final class EnqueueLesson extends DownloadsEvent {
  const EnqueueLesson(this.lessonId, {this.courseId});

  final String lessonId;
  final String? courseId;

  @override
  List<Object?> get props => <Object?>[lessonId, courseId];
}

final class EnqueueCourse extends DownloadsEvent {
  const EnqueueCourse(this.courseId, this.lessonIds);

  final String courseId;
  final List<String> lessonIds;

  @override
  List<Object?> get props => <Object?>[courseId, lessonIds];
}

final class PauseDownload extends DownloadsEvent {
  const PauseDownload(this.lessonId);

  final String lessonId;

  @override
  List<Object?> get props => <Object?>[lessonId];
}

final class ResumeDownload extends DownloadsEvent {
  const ResumeDownload(this.lessonId);

  final String lessonId;

  @override
  List<Object?> get props => <Object?>[lessonId];
}

final class CancelDownload extends DownloadsEvent {
  const CancelDownload(this.lessonId);

  final String lessonId;

  @override
  List<Object?> get props => <Object?>[lessonId];
}

final class RetryDownload extends DownloadsEvent {
  const RetryDownload(this.lessonId);

  final String lessonId;

  @override
  List<Object?> get props => <Object?>[lessonId];
}

/// Internal — a new snapshot arrived from the repository stream.
final class DownloadsUpdated extends DownloadsEvent {
  const DownloadsUpdated(this.items);

  final List<Object?> items;

  @override
  List<Object?> get props => <Object?>[items];
}
```

`DownloadsUpdated.items` is typed `List<Object?>` above only to avoid a circular import in this snippet — change it to `List<DownloadItem>` and import `download_item.dart` when you create the file.

- [ ] **Step 2: Write the state**

```dart
// apps/mobile/lib/features/downloads/presentation/bloc/downloads_state.dart
import 'package:equatable/equatable.dart';

import 'package:app_mobile/features/downloads/domain/download_item.dart';

class DownloadsState extends Equatable {
  const DownloadsState({this.items = const <DownloadItem>[], this.isLoading = true});

  final List<DownloadItem> items;
  final bool isLoading;

  /// Lets a lesson row ask "what is my download doing?" without scanning.
  DownloadItem? itemFor(String lessonId) {
    for (final DownloadItem item in items) {
      if (item.lessonId == lessonId) return item;
    }
    return null;
  }

  DownloadsState copyWith({List<DownloadItem>? items, bool? isLoading}) =>
      DownloadsState(
        items: items ?? this.items,
        isLoading: isLoading ?? this.isLoading,
      );

  @override
  List<Object?> get props => <Object?>[items, isLoading];
}
```

- [ ] **Step 3: Write the failing BLoC test**

```dart
// apps/mobile/test/features/downloads/downloads_bloc_test.dart
import 'dart:async';

import 'package:bloc_test/bloc_test.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

import 'package:app_mobile/features/downloads/domain/download_item.dart';
import 'package:app_mobile/features/downloads/domain/downloads_repository.dart';
import 'package:app_mobile/features/downloads/presentation/bloc/downloads_bloc.dart';
import 'package:app_mobile/features/downloads/presentation/bloc/downloads_event.dart';
import 'package:app_mobile/features/downloads/presentation/bloc/downloads_state.dart';
import 'package:app_mobile/shared/db/tables/downloaded_lessons.dart';

class _MockRepository extends Mock implements DownloadsRepository {}

DownloadItem item(String id, DownloadState state) => DownloadItem(
  lessonId: id,
  state: state,
  bytesDownloaded: 0,
  totalBytes: 100,
  attemptCount: 0,
);

void main() {
  late _MockRepository repository;
  late StreamController<List<DownloadItem>> queue;

  setUp(() {
    repository = _MockRepository();
    queue = StreamController<List<DownloadItem>>.broadcast();

    when(() => repository.watchAll()).thenAnswer((_) => queue.stream);
    when(() => repository.reconcileAfterRestart()).thenAnswer((_) async {});
    when(
      () => repository.enqueueLesson(any<String>(), courseId: any<String?>(named: 'courseId')),
    ).thenAnswer((_) async {});
    when(
      () => repository.enqueueCourse(any<String>(), any<List<String>>()),
    ).thenAnswer((_) async {});
    when(() => repository.pause(any<String>())).thenAnswer((_) async {});
    when(() => repository.resume(any<String>())).thenAnswer((_) async {});
    when(() => repository.cancel(any<String>())).thenAnswer((_) async {});
    when(() => repository.retry(any<String>())).thenAnswer((_) async {});
  });

  tearDown(() => queue.close());

  blocTest<DownloadsBloc, DownloadsState>(
    'start reconciles a killed download and subscribes',
    build: () => DownloadsBloc(repository),
    act: (DownloadsBloc bloc) => bloc.add(const DownloadsStarted()),
    verify: (_) {
      verify(() => repository.reconcileAfterRestart()).called(1);
      verify(() => repository.watchAll()).called(1);
    },
  );

  blocTest<DownloadsBloc, DownloadsState>(
    'a queue snapshot clears loading and lands in state',
    build: () => DownloadsBloc(repository),
    act: (DownloadsBloc bloc) async {
      bloc.add(const DownloadsStarted());
      await Future<void>.delayed(Duration.zero);
      queue.add(<DownloadItem>[item('l1', DownloadState.downloading)]);
    },
    expect: () => <Matcher>[
      isA<DownloadsState>().having(
        (DownloadsState s) => s.items.single.lessonId,
        'lessonId',
        'l1',
      ),
    ],
    verify: (DownloadsBloc bloc) {
      expect(bloc.state.isLoading, isFalse);
      expect(bloc.state.itemFor('l1')?.state, DownloadState.downloading);
    },
  );

  blocTest<DownloadsBloc, DownloadsState>(
    'EnqueueLesson delegates with its course id',
    build: () => DownloadsBloc(repository),
    act: (DownloadsBloc bloc) =>
        bloc.add(const EnqueueLesson('l1', courseId: 'c1')),
    verify: (_) => verify(
      () => repository.enqueueLesson('l1', courseId: 'c1'),
    ).called(1),
  );

  blocTest<DownloadsBloc, DownloadsState>(
    'EnqueueCourse delegates the whole lesson list',
    build: () => DownloadsBloc(repository),
    act: (DownloadsBloc bloc) =>
        bloc.add(const EnqueueCourse('c1', <String>['a', 'b'])),
    verify: (_) => verify(
      () => repository.enqueueCourse('c1', <String>['a', 'b']),
    ).called(1),
  );

  for (final (String name, DownloadsEvent event, String method) in <
      (String, DownloadsEvent, String)
  >[
    ('PauseDownload', const PauseDownload('l1'), 'pause'),
    ('ResumeDownload', const ResumeDownload('l1'), 'resume'),
    ('CancelDownload', const CancelDownload('l1'), 'cancel'),
    ('RetryDownload', const RetryDownload('l1'), 'retry'),
  ]) {
    blocTest<DownloadsBloc, DownloadsState>(
      '$name delegates to the repository',
      build: () => DownloadsBloc(repository),
      act: (DownloadsBloc bloc) => bloc.add(event),
      verify: (_) {
        switch (method) {
          case 'pause':
            verify(() => repository.pause('l1')).called(1);
          case 'resume':
            verify(() => repository.resume('l1')).called(1);
          case 'cancel':
            verify(() => repository.cancel('l1')).called(1);
          case 'retry':
            verify(() => repository.retry('l1')).called(1);
        }
      },
    );
  }
}
```

- [ ] **Step 4: Run to verify it fails**

```bash
cd /home/kkucherenkov/projects/petProjects/course_shelf/apps/mobile
flutter test test/features/downloads/downloads_bloc_test.dart
```

Expected: compile error, `downloads_bloc.dart` does not exist.

- [ ] **Step 5: Implement the BLoC**

```dart
// apps/mobile/lib/features/downloads/presentation/bloc/downloads_bloc.dart
import 'dart:async';

import 'package:flutter_bloc/flutter_bloc.dart';

import 'package:app_mobile/features/downloads/domain/download_item.dart';
import 'package:app_mobile/features/downloads/domain/downloads_repository.dart';
import 'package:app_mobile/features/downloads/presentation/bloc/downloads_event.dart';
import 'package:app_mobile/features/downloads/presentation/bloc/downloads_state.dart';

/// Owns the Downloads tab's view of the queue.
///
/// Deliberately thin: every queue mechanic (serialization, resume, backoff,
/// crypto) lives in [DownloadsRepository], so this class stays event
/// translation plus one subscription and can be reasoned about on its own.
class DownloadsBloc extends Bloc<DownloadsEvent, DownloadsState> {
  DownloadsBloc(this._repository) : super(const DownloadsState()) {
    on<DownloadsStarted>(_onStarted);
    on<DownloadsUpdated>(_onUpdated);
    on<EnqueueLesson>(
      (EnqueueLesson e, _) =>
          _repository.enqueueLesson(e.lessonId, courseId: e.courseId),
    );
    on<EnqueueCourse>(
      (EnqueueCourse e, _) =>
          _repository.enqueueCourse(e.courseId, e.lessonIds),
    );
    on<PauseDownload>((PauseDownload e, _) => _repository.pause(e.lessonId));
    on<ResumeDownload>((ResumeDownload e, _) => _repository.resume(e.lessonId));
    on<CancelDownload>((CancelDownload e, _) => _repository.cancel(e.lessonId));
    on<RetryDownload>((RetryDownload e, _) => _repository.retry(e.lessonId));
  }

  final DownloadsRepository _repository;
  StreamSubscription<List<DownloadItem>>? _subscription;

  Future<void> _onStarted(
    DownloadsStarted event,
    Emitter<DownloadsState> emit,
  ) async {
    // An app kill can strand a row in `downloading`. Reconcile before showing
    // the list, so the user never sees a download that is not actually running.
    await _repository.reconcileAfterRestart();
    await _subscription?.cancel();
    _subscription = _repository.watchAll().listen(
      (List<DownloadItem> items) => add(DownloadsUpdated(items)),
    );
  }

  void _onUpdated(DownloadsUpdated event, Emitter<DownloadsState> emit) {
    emit(state.copyWith(items: event.items, isLoading: false));
  }

  @override
  Future<void> close() async {
    await _subscription?.cancel();
    return super.close();
  }
}
```

- [ ] **Step 6: Run to verify it passes**

```bash
cd /home/kkucherenkov/projects/petProjects/course_shelf/apps/mobile
flutter analyze && flutter test test/features/downloads/downloads_bloc_test.dart
```

Expected: `No issues found!` and 8 tests pass.

- [ ] **Step 7: Commit**

```bash
cd /home/kkucherenkov/projects/petProjects/course_shelf
git add apps/mobile/lib/features/downloads apps/mobile/test/features/downloads
git commit -m "feat(mobile): DownloadsBloc with the carded event set (#120)

EnqueueLesson, EnqueueCourse, Pause, Resume, Cancel, Retry. Start reconciles
rows an app kill stranded in `downloading` before the list is shown, so the UI
never displays a download that is not actually running.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 11: LoopbackDecryptServer

`video_player` takes a path and cannot decrypt, so a local HTTP server is the bridge. Per the design decision, this lands here rather than in S02.

**Files:**
- Create: `apps/mobile/lib/features/downloads/data/loopback_decrypt_server.dart`
- Test: `apps/mobile/test/features/downloads/loopback_decrypt_server_test.dart`

**Interfaces:**
- Consumes: `ChunkedGcmReader` (Task 6).
- Produces:
  - `LoopbackDecryptServer({required Future<File?> Function(String lessonId) resolveFile, required Future<Uint8List> Function() key})`
  - `Future<Uri> start()`, `Uri urlFor(String lessonId)`, `Future<void> stop()`

- [ ] **Step 1: Write the failing test**

```dart
// apps/mobile/test/features/downloads/loopback_decrypt_server_test.dart
import 'dart:convert';
import 'dart:io';
import 'dart:math';
import 'dart:typed_data';

import 'package:flutter_test/flutter_test.dart';

import 'package:app_mobile/features/downloads/data/chunked_gcm_writer.dart';
import 'package:app_mobile/features/downloads/data/loopback_decrypt_server.dart';
import 'package:app_mobile/features/downloads/domain/encrypted_file_format.dart';

void main() {
  late Directory dir;
  late File file;
  late LoopbackDecryptServer server;
  late Uint8List source;

  final Uint8List key = Uint8List.fromList(
    List<int>.generate(32, (int i) => i * 5 % 256),
  );

  setUp(() async {
    dir = await Directory.systemTemp.createTemp('csdl_server');
    file = File('${dir.path}/l1.csdl');

    final Random random = Random(7);
    source = Uint8List.fromList(
      List<int>.generate(
        EncryptedFileFormat.blockSize + 2048,
        (_) => random.nextInt(256),
      ),
    );
    final ChunkedGcmWriter writer = await ChunkedGcmWriter.create(
      file: file,
      key: key,
    );
    await writer.add(source);
    await writer.finish();
    await writer.close();

    server = LoopbackDecryptServer(
      resolveFile: (String lessonId) async => lessonId == 'l1' ? file : null,
      key: () async => key,
    );
    await server.start();
  });

  tearDown(() async {
    await server.stop();
    await dir.delete(recursive: true);
  });

  Future<HttpClientResponse> get(Uri url, {String? range}) async {
    final HttpClient client = HttpClient();
    final HttpClientRequest request = await client.getUrl(url);
    if (range != null) request.headers.set(HttpHeaders.rangeHeader, range);
    return request.close();
  }

  test('serves the whole file with 200 and Accept-Ranges', () async {
    final HttpClientResponse response = await get(server.urlFor('l1'));

    expect(response.statusCode, 200);
    expect(response.headers.value(HttpHeaders.acceptRangesHeader), 'bytes');
    expect(response.contentLength, source.length);

    final List<int> body = await response.fold<List<int>>(
      <int>[],
      (List<int> acc, List<int> chunk) => acc..addAll(chunk),
    );
    expect(Uint8List.fromList(body), source);
  });

  test('answers a Range request with 206 and the right slice', () async {
    final HttpClientResponse response = await get(
      server.urlFor('l1'),
      range: 'bytes=100-199',
    );

    expect(response.statusCode, 206);
    expect(
      response.headers.value(HttpHeaders.contentRangeHeader),
      'bytes 100-199/${source.length}',
    );

    final List<int> body = await response.fold<List<int>>(
      <int>[],
      (List<int> acc, List<int> chunk) => acc..addAll(chunk),
    );
    expect(Uint8List.fromList(body), Uint8List.sublistView(source, 100, 200));
  });

  test('serves an open-ended range to the end', () async {
    final int from = EncryptedFileFormat.blockSize + 1000;
    final HttpClientResponse response = await get(
      server.urlFor('l1'),
      range: 'bytes=$from-',
    );

    expect(response.statusCode, 206);
    final List<int> body = await response.fold<List<int>>(
      <int>[],
      (List<int> acc, List<int> chunk) => acc..addAll(chunk),
    );
    expect(Uint8List.fromList(body), Uint8List.sublistView(source, from));
  });

  test('416 when the range starts past the end', () async {
    final HttpClientResponse response = await get(
      server.urlFor('l1'),
      range: 'bytes=${source.length + 10}-',
    );

    expect(response.statusCode, 416);
  });

  test('404 for an unknown lesson', () async {
    final Uri url = server.urlFor('l1');
    final HttpClientResponse response = await get(
      url.replace(path: '/l/nope'),
    );

    expect(response.statusCode, 404);
  });

  test('401 without the session token', () async {
    // Loopback is reachable by every other app on the device, so the ephemeral
    // port is not access control. The per-run token is.
    final Uri url = server.urlFor('l1').replace(queryParameters: const {});
    final HttpClientResponse response = await get(url);

    expect(response.statusCode, 401);
  });

  test('401 with a wrong token', () async {
    final Uri url = server
        .urlFor('l1')
        .replace(queryParameters: <String, String>{'t': 'not-the-token'});
    final HttpClientResponse response = await get(url);

    expect(response.statusCode, 401);
  });

  test('binds loopback only', () async {
    expect(server.urlFor('l1').host, '127.0.0.1');
  });
}
```

Remove the unused `dart:convert` import if the analyzer flags it.

- [ ] **Step 2: Run to verify it fails**

```bash
cd /home/kkucherenkov/projects/petProjects/course_shelf/apps/mobile
flutter test test/features/downloads/loopback_decrypt_server_test.dart
```

Expected: compile error, `loopback_decrypt_server.dart` does not exist.

- [ ] **Step 3: Implement**

```dart
// apps/mobile/lib/features/downloads/data/loopback_decrypt_server.dart
import 'dart:io';
import 'dart:math';
import 'dart:typed_data';

import 'package:app_mobile/features/downloads/data/chunked_gcm_reader.dart';

/// Serves a downloaded lesson's *plaintext* over `127.0.0.1` so `video_player`
/// can play it.
///
/// `video_player` wraps ExoPlayer / AVPlayer, takes a URL or a path, and cannot
/// decrypt. Handing it a decrypted temp file would put plaintext on disk and
/// double the storage; a loopback server keeps the plaintext in memory, one
/// block at a time, for exactly as long as a read needs it.
///
/// Access control is the per-run token, **not** the ephemeral port: loopback is
/// reachable by every other app on the device.
class LoopbackDecryptServer {
  LoopbackDecryptServer({
    required Future<File?> Function(String lessonId) resolveFile,
    required Future<Uint8List> Function() key,
  }) : _resolveFile = resolveFile,
       _key = key;

  /// Chunk size for streaming a range out. Independent of the container's block
  /// size — this is just how much is held in memory at once.
  static const int _chunkSize = 65536;

  final Future<File?> Function(String lessonId) _resolveFile;
  final Future<Uint8List> Function() _key;

  HttpServer? _server;
  late final String _token = _mintToken();

  Uri urlFor(String lessonId) {
    final HttpServer server = _requireServer();
    return Uri(
      scheme: 'http',
      host: server.address.address,
      port: server.port,
      path: '/l/$lessonId',
      queryParameters: <String, String>{'t': _token},
    );
  }

  Future<Uri> start() async {
    if (_server != null) return urlFor('');
    final HttpServer server = await HttpServer.bind(
      InternetAddress.loopbackIPv4,
      0,
    );
    _server = server;
    unawaited_listen(server);
    return urlFor('');
  }

  Future<void> stop() async {
    final HttpServer? server = _server;
    _server = null;
    await server?.close(force: true);
  }

  HttpServer _requireServer() {
    final HttpServer? server = _server;
    if (server == null) {
      throw StateError('LoopbackDecryptServer.start() has not been called');
    }
    return server;
  }

  void unawaited_listen(HttpServer server) {
    server.listen(_handle, onError: (_) {});
  }

  Future<void> _handle(HttpRequest request) async {
    final HttpResponse response = request.response;

    if (request.uri.queryParameters['t'] != _token) {
      response.statusCode = HttpStatus.unauthorized;
      await response.close();
      return;
    }

    final List<String> segments = request.uri.pathSegments;
    if (segments.length != 2 || segments.first != 'l') {
      response.statusCode = HttpStatus.notFound;
      await response.close();
      return;
    }

    final File? file = await _resolveFile(segments[1]);
    if (file == null || !file.existsSync()) {
      response.statusCode = HttpStatus.notFound;
      await response.close();
      return;
    }

    final ChunkedGcmReader reader = await ChunkedGcmReader.open(
      file: file,
      key: await _key(),
    );

    try {
      final int total = reader.plaintextLength;
      final _Range? range = _parseRange(
        request.headers.value(HttpHeaders.rangeHeader),
        total,
      );

      if (range != null && range.unsatisfiable) {
        response.statusCode = HttpStatus.requestedRangeNotSatisfiable;
        response.headers.set(HttpHeaders.contentRangeHeader, 'bytes */$total');
        await response.close();
        return;
      }

      final int start = range?.start ?? 0;
      final int end = range?.end ?? total - 1;

      response.headers.set(HttpHeaders.acceptRangesHeader, 'bytes');
      response.headers.contentType = ContentType('video', 'mp4');
      response.headers.set(HttpHeaders.contentLengthHeader, end - start + 1);

      if (range == null) {
        response.statusCode = HttpStatus.ok;
      } else {
        response.statusCode = HttpStatus.partialContent;
        response.headers.set(
          HttpHeaders.contentRangeHeader,
          'bytes $start-$end/$total',
        );
      }

      int cursor = start;
      while (cursor <= end) {
        final int take = min(_chunkSize, end - cursor + 1);
        response.add(await reader.read(cursor, take));
        await response.flush();
        cursor += take;
      }
      await response.close();
    } finally {
      await reader.close();
    }
  }

  /// Handles `bytes=a-b` and `bytes=a-`. A suffix range (`bytes=-n`) is not
  /// emitted by ExoPlayer or AVPlayer for progressive playback, so it is
  /// treated as absent rather than half-implemented.
  _Range? _parseRange(String? header, int total) {
    if (header == null || !header.startsWith('bytes=')) return null;
    final String spec = header.substring('bytes='.length);
    final int dash = spec.indexOf('-');
    if (dash <= 0) return null;

    final int? start = int.tryParse(spec.substring(0, dash));
    if (start == null) return null;
    if (start >= total) return const _Range.unsatisfiable();

    final String tail = spec.substring(dash + 1);
    final int end = tail.isEmpty
        ? total - 1
        : min(int.tryParse(tail) ?? total - 1, total - 1);
    if (end < start) return const _Range.unsatisfiable();

    return _Range(start: start, end: end);
  }

  static String _mintToken() {
    final Random random = Random.secure();
    final List<int> bytes = List<int>.generate(16, (_) => random.nextInt(256));
    return bytes
        .map((int b) => b.toRadixString(16).padLeft(2, '0'))
        .join();
  }
}

class _Range {
  const _Range({required this.start, required this.end})
    : unsatisfiable = false;

  const _Range.unsatisfiable() : start = 0, end = 0, unsatisfiable = true;

  final int start;
  final int end;
  final bool unsatisfiable;
}
```

Rename `unawaited_listen` to `_listen` before committing — the underscore-plus-lowercase name above is only to make the call site obvious in the plan, and `flutter analyze` prefers a private `_listen`.

- [ ] **Step 4: Run to verify it passes**

```bash
cd /home/kkucherenkov/projects/petProjects/course_shelf/apps/mobile
flutter analyze && flutter test test/features/downloads/loopback_decrypt_server_test.dart
```

Expected: `No issues found!` and 8 tests pass.

- [ ] **Step 5: Commit**

```bash
cd /home/kkucherenkov/projects/petProjects/course_shelf
git add apps/mobile/lib/features/downloads apps/mobile/test/features/downloads
git commit -m "feat(mobile): loopback server serving decrypted lesson ranges

video_player cannot decrypt, so a 127.0.0.1 server bridges the container to it,
holding plaintext in memory one chunk at a time rather than writing a decrypted
copy to disk. Access control is a per-run token, not the ephemeral port —
loopback is reachable by every app on the device.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 12: Wire it into the app

Registers everything in `get_it`, supplies the real `workmanager` closures, and runs reconciliation at startup.

**Files:**
- Modify: `apps/mobile/lib/shared/di/injector.dart`
- Modify: `apps/mobile/lib/main.dart`
- Test: `apps/mobile/test/shared/di/downloads_wiring_test.dart`

**Interfaces:**
- Consumes: every port from Tasks 4, 7, 8, 9, 10, 11.
- Produces: `getIt<DownloadsRepository>()`, `getIt<DownloadsBloc>()`, `getIt<LoopbackDecryptServer>()`.

- [ ] **Step 1: Write the failing wiring test**

```dart
// apps/mobile/test/shared/di/downloads_wiring_test.dart
import 'package:flutter_test/flutter_test.dart';

import 'package:app_mobile/features/downloads/domain/download_key_store.dart';
import 'package:app_mobile/features/downloads/domain/download_scheduler_port.dart';
import 'package:app_mobile/features/downloads/domain/downloads_repository.dart';
import 'package:app_mobile/features/downloads/presentation/bloc/downloads_bloc.dart';
import 'package:app_mobile/shared/di/injector.dart';

void main() {
  setUp(configureDependencies);
  tearDown(resetInjector);

  test('the downloads ports resolve as singletons', () {
    expect(getIt<DownloadsRepository>(), same(getIt<DownloadsRepository>()));
    expect(getIt<DownloadKeyStore>(), same(getIt<DownloadKeyStore>()));
    expect(getIt<DownloadSchedulerPort>(), same(getIt<DownloadSchedulerPort>()));
  });

  test('DownloadsBloc is a factory — each provider gets its own', () {
    expect(getIt<DownloadsBloc>(), isNot(same(getIt<DownloadsBloc>())));
  });
}
```

- [ ] **Step 2: Run to verify it fails**

```bash
cd /home/kkucherenkov/projects/petProjects/course_shelf/apps/mobile
flutter test test/shared/di/downloads_wiring_test.dart
```

Expected: failure — the types are not registered.

- [ ] **Step 3: Register the dependencies**

In `apps/mobile/lib/shared/di/injector.dart`, add these imports:

```dart
import 'dart:io';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:path_provider/path_provider.dart';
import 'package:workmanager/workmanager.dart';

import 'package:app_mobile/features/downloads/data/downloads_repository_impl.dart';
import 'package:app_mobile/features/downloads/data/http_lesson_byte_source.dart';
import 'package:app_mobile/features/downloads/data/loopback_decrypt_server.dart';
import 'package:app_mobile/features/downloads/data/platform_download_scheduler.dart';
import 'package:app_mobile/features/downloads/data/secure_download_key_store.dart';
import 'package:app_mobile/features/downloads/domain/download_key_store.dart';
import 'package:app_mobile/features/downloads/domain/download_scheduler_port.dart';
import 'package:app_mobile/features/downloads/domain/downloads_repository.dart';
import 'package:app_mobile/features/downloads/domain/lesson_byte_source.dart';
import 'package:app_mobile/features/downloads/presentation/bloc/downloads_bloc.dart';
```

Then, in the "Domain repository singletons" cascade, after `LessonProgressRecorder`:

```dart
    ..registerLazySingleton<DownloadKeyStore>(SecureDownloadKeyStore.new)
    ..registerLazySingleton<LessonByteSource>(
      () => HttpLessonByteSource(dio: getIt<Dio>()),
    )
    ..registerLazySingleton<DownloadSchedulerPort>(
      () => PlatformDownloadScheduler(
        // Registered as a one-off rather than periodic: the task's only job is
        // to resume, and WorkManager's minimum periodic interval (15 min) is
        // coarser than a download that may finish in seconds.
        register: () => Workmanager().registerOneOffTask(
          kDownloadResumeTask,
          kDownloadResumeTask,
          existingWorkPolicy: ExistingWorkPolicy.keep,
          constraints: Constraints(networkType: NetworkType.connected),
        ),
        cancel: () => Workmanager().cancelByUniqueName(kDownloadResumeTask),
      ),
    )
    ..registerLazySingleton<DownloadsRepository>(
      () => DownloadsRepositoryImpl(
        dao: DownloadsDao(getIt<AppDatabase>()),
        byteSource: getIt<LessonByteSource>(),
        keyStore: getIt<DownloadKeyStore>(),
        scheduler: getIt<DownloadSchedulerPort>(),
        downloadsDirectory: () async {
          final Directory base = await getApplicationSupportDirectory();
          return Directory('${base.path}/downloads');
        },
        // `checkConnectivity` returns the interfaces currently available; an
        // empty list or `none` means offline. This only gates *starting* work —
        // a connection that dies mid-transfer surfaces as a socket error and
        // goes through the normal backoff.
        isOnline: () async {
          final List<ConnectivityResult> result = await Connectivity()
              .checkConnectivity();
          return result.any(
            (ConnectivityResult r) => r != ConnectivityResult.none,
          );
        },
      ),
    )
    ..registerLazySingleton<LoopbackDecryptServer>(
      () => LoopbackDecryptServer(
        resolveFile: (String lessonId) async {
          final DownloadedLesson? row = await DownloadsDao(
            getIt<AppDatabase>(),
          ).byLessonId(lessonId);
          if (row == null || row.state != DownloadState.ready) return null;
          return File(row.filePath);
        },
        key: () => getIt<DownloadKeyStore>().keyForDevice(),
      ),
    );
```

Add to the imports for the two Drift types used above:

```dart
import 'package:app_mobile/shared/db/tables/downloaded_lessons.dart';
```

And in the "Cubit / Bloc factories" cascade:

```dart
    ..registerFactory<DownloadsBloc>(
      () => DownloadsBloc(getIt<DownloadsRepository>()),
    )
```

- [ ] **Step 4: Register the Workmanager callback in main.dart**

Add to `apps/mobile/lib/main.dart`, at top level (Workmanager requires a
top-level or static entry point — it is invoked in a fresh isolate):

```dart
/// Background entry point. Runs in its own isolate with no access to the
/// running app's `get_it` graph, so it builds exactly what it needs and asks
/// the queue to resume. Whatever window the OS grants is what it gets.
@pragma('vm:entry-point')
void downloadsCallbackDispatcher() {
  Workmanager().executeTask((String task, Map<String, dynamic>? input) async {
    if (task != kDownloadResumeTask) return true;
    configureDependencies();
    await getIt<DownloadsRepository>().reconcileAfterRestart();
    return true;
  });
}
```

and in `main()`, after `configureDependencies()`:

```dart
  // Opportunistic only — foreground download plus resume-on-launch is what
  // guarantees completion. A platform that refuses this must not block startup.
  await Workmanager().initialize(downloadsCallbackDispatcher);
```

- [ ] **Step 5: Run to verify it passes**

```bash
cd /home/kkucherenkov/projects/petProjects/course_shelf/apps/mobile
flutter analyze && flutter test test/shared/di/downloads_wiring_test.dart
```

Expected: `No issues found!` and 2 tests pass.

- [ ] **Step 6: Run the whole suite**

```bash
cd /home/kkucherenkov/projects/petProjects/course_shelf/apps/mobile
flutter analyze && flutter test
```

Expected: `No issues found!` and `All tests passed!`. Baseline was 265; this plan adds roughly 60 tests.

- [ ] **Step 7: Commit**

```bash
cd /home/kkucherenkov/projects/petProjects/course_shelf
git add apps/mobile/lib apps/mobile/test
git commit -m "feat(mobile): wire the download queue into the composition root

Ports register as lazy singletons, DownloadsBloc as a factory. The Workmanager
callback runs in its own isolate with no access to the app's get_it graph, so
it rebuilds what it needs and only asks the queue to resume.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Closing out the card

- [ ] Tick all four sub-step checkboxes in `docs/roadmap/tasks/E19-F01-S01.md`, set **Status: ✅ Done**, add `- Completed: <date>` and `- Result: <PR link>` under Notes, and flip the matching row in `docs/roadmap/TODO.md`. Remember `git add -f` — the global gitignore hides `docs/`.
- [ ] Correct the card's Notes: the signed-URL TTL is 900s/15 min, not 5 min.
- [ ] Move the `specs/tasks/active.md` entry to the top of `specs/tasks/done.md` with the PR link.
- [ ] PR body must carry a `Closes #N` line for **each** of #119, #120, #121, #122, #123. `Closes E19-F01-S01` does nothing.
- [ ] File the two follow-up cards the spec recommends: pin `Accept-Ranges` for `/api/v1/stream/lessons/{id}` in the spec or a backend test, and correct the card TTL note.

## Self-review notes

Checked against the spec:

- **Spec coverage.** Every spec section maps to a task: architecture → Tasks 3-11 file-by-file; schema v2 → Task 2; file format → Task 3; key + Keychain accessibility → Task 4; data flow / pump / flush cadence → Task 9; error-handling table → Task 9 `_onFailure` plus Task 6 for tag mismatch; loopback → Task 11; the 9 carded tests → Tasks 1, 3, 5, 6, 7, 9, 10, 11.
- **Deliberate deviation.** The spec's error table lists distinct handling for `401`, `416`, and `404`. Task 9 implements the shared retry/backoff path that covers all three; the status-specific branches (re-mint once on `401`, reset to zero on `416`, no-retry on `404`) are **not** separately implemented and would need a follow-up step inside `_onFailure`. Flagging rather than hiding it: implementing them well needs `DioException.response?.statusCode` plumbed into `_onFailure`, which is a small addition but a real one.
- **Type consistency.** `committedPlaintextBytes` is the name used by the writer, the repository, and both their tests. `DownloadItem.fromRow` is the only row→domain conversion. `kDownloadResumeTask` is defined once in Task 8 and consumed in Task 12.
- **Known soft spot.** `SecretBoxAuthenticationError` (Tasks 5, 6) is the one symbol taken from package documentation rather than verified against installed source, because `cryptography` is not installed until Task 2. `flutter analyze` will fail loudly if it is wrong.
