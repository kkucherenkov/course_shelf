# E19-F01-S01 — DownloadsBloc with resumable encrypted downloads — design

**Date:** 2026-07-28
**Status:** Approved (brainstorm)
**Card:** [E19-F01-S01](../../roadmap/tasks/E19-F01-S01.md)
**Issues:** #119 card, #120 events, #121 file writer, #122 key store, #123 background scheduling
(epic umbrella is #118)
**Scope:** `apps/mobile` only, plus a two-line verb fix in the existing player API.
No spec change, no codegen, no backend, no design-token change.

## Context

E19 is the offline epic. This card is its Stage A entry point: nothing else in
E19 or E20 can proceed without a download queue, and E18-F01-S03 (#101,
"tap-to-download wires to DownloadsBloc") is explicitly blocked on it.

The Drift layer was pre-staged for this work in E15-F02-S01. `downloaded_lessons`
already carries `bytesDownloaded` ("drives byte-range continuation on resume"),
`totalBytes`, and a `nonce` blob, and `AppDatabase.onUpgrade` carries an empty
v1→v2 hook whose comment reads "so E19 can add one without restructuring."
`DownloadsDao` already exposes `upsert`, `byLessonId`, `byState`, `watch`, and
`remove`.

### Findings that changed the card

Four things were established by reading the code, and they supersede parts of
the card's own Notes section.

**1. Range is supported.** The card flagged this as its main open risk ("the
spec does NOT contract `Range`/`Accept-Ranges` — confirm the stream server
honours Range before committing to resumable"). It does:
`apps/backend/src/modules/streaming/streaming.controller.ts:212-266` implements
`200` full, `206` single, `multipart/byteranges`, `416` unsatisfiable, `400`
malformed, and sets `Accept-Ranges: bytes`.

Caveat worth recording: that route is exempt from OpenAPI validation (binary
body, listed in the validator's `ignorePaths`), so Range is an *implementation*
contract only. Nothing in CI would catch its removal.

**2. The card's TTL figure is wrong.** It says signed URLs default to 5 minutes.
The real default is **900 seconds / 15 minutes** — `STREAM_TOKEN_TTL_SECONDS` in
`apps/backend/src/common/config/app-config.ts:197`, matching the OpenAPI
description. Refresh-on-resume is still required, just on a 15-minute clock.

**3. Materials are not resumable.** `getMaterialStream` sends the whole file with
no Range support, by design. Lesson video and lesson materials therefore need
different download paths. This card covers **video only**.

**4. Mobile calls both URL-minting routes with the wrong HTTP verb.**

| caller | verb |
| --- | --- |
| `packages/specs/openapi/openapi.yaml:3319` | `get:` |
| `apps/backend/.../streaming.controller.ts:137` | `@Get` |
| generated TS client `sdk.gen.ts:696` | `.get(...)` |
| `apps/web/app/composables/useStreamUrl.ts:50` | via generated client → GET |
| `apps/mobile/.../lesson_player_api.dart:63` | **`.post(...)`** |

The same mismatch exists for materials — mobile `.post(…/download-url)` at
`lesson_player_api.dart:136` against `@Get` at `streaming.controller.ts:149`.
NestJS returns 404 for an unmatched method+path, so both calls fail against a
real backend. No test caught it: `grep` for those paths across `test/` and
`integration_test/` returns nothing, because `LessonPlayerApi` is faked at the
repository level in the player tests.

Mobile is the sole outlier against spec, backend, generated client, and web, so
this card corrects the verb and adds a regression test rather than carding it
separately.

### Environment constraints

`flutter devices` reports **Linux desktop only**; `flutter emulators` reports
**none**. iOS cannot be built on this host at all. Consequences:

- The carded `integration_test simulating a flaky network` cannot execute here.
  Every test in this design runs under plain `flutter test`.
- The `workmanager` / `BGTaskScheduler` registrations ship reviewed but
  unexecuted. They are kept behind a port so the untestable surface is a thin
  adapter rather than the queue logic.

## Decisions

Three questions were settled during the brainstorm.

### D1 — Chunked AES-GCM, not whole-file

AES-GCM as normally specified is a single-shot AEAD: one nonce, one tag over the
entire plaintext. That is incompatible with both of this card's other
requirements — you cannot persist GCM cipher state across an app kill to append
later, and you cannot seek into a whole-file GCM blob without decrypting from
byte 0, which `video_player` needs to do constantly.

**Chosen:** fixed 256 KiB blocks, each independently sealed with its own nonce
and tag. Resume happens at block boundaries; playback decrypts only the blocks a
seek actually touches. Per-block tags also localize corruption — with one tag
over an 800 MB file, a single flipped bit invalidates the whole download.

Rejected: AES-CTR + HMAC (seekable and simpler to resume, but deviates from the
carded GCM and gives no per-read authentication); whole-file GCM with
decrypt-to-temp on play (simplest crypto, but doubles disk use, writes a
plaintext copy to disk during playback, and stalls before large videos).

### D2 — The loopback decrypt server lands in this card

`video_player` takes a path and cannot decrypt, so a local HTTP server on
`127.0.0.1` is the standard bridge. It could have been deferred to E19-F01-S02,
whose issues cover playback resolution (#125) and the pre-play integrity check
(#126).

**Chosen:** ship it here, so a finished download is playable end-to-end within
this card. Accepted cost: the server has no production consumer until S02 wires
`PlayerBloc`, so it lands exercised only by its own tests.

### D3 — Background scheduling is a port with opportunistic resume

Android's `workmanager` is Doze-constrained and time-capped; sustained large
transfers really want a foreground service. iOS's `BGTaskScheduler` grants short
opportunistic windows and cannot carry a multi-hundred-MB transfer at all — the
real iOS mechanism is `URLSession` with a background configuration, which is
native code behind a platform channel and unreachable from `dio`.

**Chosen:** foreground download is the primary path. `DownloadSchedulerPort`
abstracts the platform; Android registers a `workmanager` worker and iOS a
`BGAppRefreshTask`, each doing "resume whatever is unfinished" in whatever window
the OS grants. Resume-on-launch guarantees eventual completion regardless. This
honours the card's own hedge, "subject to platform background limits."

Rejected: full native background transfer (correct, but none of it can be
compiled or verified on this host, and the iOS half cannot even be type-checked);
deferring background entirely (leaves #123 open and the acceptance line only
partly met).

### D4 — Flaky-network tests use a mocked Dio adapter

For the **download** path, chosen over an in-process `HttpServer` for determinism
and speed. Recorded trade-off: a mock asserts against its own idea of HTTP, so it
is blind to real Range parsing and socket aborts, and would not have caught the
verb defect above.

This does not conflict with test 7, which does use a real `HttpServer`. There the
server under test *is* ours — the loopback decrypt server — so a real socket is
the subject of the test rather than a stand-in for a remote one.

**Compensation:** the mock asserts the *literal* `Range: bytes=<n>-` header string
it receives, so the wire format stays pinned by the test, and test 9 pins the
HTTP verbs directly.

## Architecture

Feature-first, matching the existing `features/player/` domain/data/presentation
split. Ports live in `domain/`, platform and IO in `data/`.

```
features/downloads/
├── domain/
│   ├── download_item.dart              value object (lessonId, state, bytes, total, error)
│   ├── downloads_repository.dart       PORT  enqueue/pause/resume/cancel/retry/watch
│   ├── download_scheduler_port.dart    PORT  ensureScheduled/cancelAll
│   ├── download_key_store.dart         PORT  keyForDevice()
│   └── encrypted_file_format.dart      pure block math + header layout, zero IO
├── data/
│   ├── downloads_repository_impl.dart  orchestrator: DAO + writer + byte source
│   ├── lesson_byte_source.dart         mints the stream URL, issues ranged GETs
│   ├── chunked_gcm_writer.dart         append-only encrypting writer
│   ├── chunked_gcm_reader.dart         random-access decrypting reader
│   ├── secure_download_key_store.dart  flutter_secure_storage impl
│   ├── platform_download_scheduler.dart workmanager / BGAppRefreshTask
│   └── loopback_decrypt_server.dart    127.0.0.1 HttpServer, plaintext ranges
└── presentation/bloc/{downloads_bloc,downloads_event,downloads_state}.dart
```

`encrypted_file_format.dart` is deliberately pure. All the off-by-one risk —
plaintext offset ↔ block index ↔ ciphertext offset — becomes testable without a
filesystem or a socket.

**New dependencies:** `cryptography` (AES-GCM), `workmanager`,
`connectivity_plus`. None are in `pubspec.yaml` today.

**Concurrency:** one active download at a time, FIFO by `queuedAt`. Parallel
downloads thrash mobile bandwidth and multiply partial-file states for no
user-visible gain.

### Schema v2

The current columns cannot express a queue. The v1→v2 step fills the existing
empty `onUpgrade` hook.

| column | why |
| --- | --- |
| `courseId` nullable | `EnqueueCourse` must group and cancel a whole course |
| `attemptCount` default 0 | retry backoff needs a count to back off on |
| `queuedAt` UTC | FIFO ordering |
| `nextAttemptAt` UTC nullable | when a backed-off row becomes eligible again |

`queuedAt` and `nextAttemptAt` must both be written UTC-normalized.
`downloads_dao.dart:12-14` already warns that Drift's TEXT datetime encoding
makes `ORDER BY` lexicographic, so a column holding mixed offsets sorts wrong —
and the same encoding governs the `nextAttemptAt <= now` comparison.

**Backoff is persisted, not slept.** `nextQueued` filters out rows whose window
has not elapsed and the pump moves on to the next item. An `await` inside the
pump would mean one unreachable lesson freezes every healthy download behind it:
on a 40-lesson course enqueue, lessons 4-40 would wait through lesson 3's five
attempts. Serializing downloads is intended; serializing *failures* is not.

## File format

```
offset  0  magic     "CSDL"          4B
offset  4  version   u8 = 1          1B
offset  5  blockSize u32 LE = 262144 4B
offset  9  fileNonce random          12B
offset 21  reserved  zero            3B     → header = 24B
offset 24  block 0: ciphertext(≤blockSize) ‖ tag(16B)
           block 1: …                        last block may be short
```

- **Key** — 256-bit, generated once per install, held in `flutter_secure_storage`
  under a fixed key. Never in Drift; the `downloaded_lessons` table comment
  already states the rule ("a key stored beside its own ciphertext is not
  encryption").
- **Keychain accessibility** — the iOS store must be opened with
  `KeychainAccessibility.first_unlock`. The default,
  `kSecAttrAccessibleWhenUnlocked`, makes the key unreadable to a
  `BGAppRefreshTask` that fires while the device is locked, and the download
  would stall silently.
- **Nonce** — `nonce(i) = fileNonce XOR bigEndian96(i)`. Distinct `i` yields a
  distinct nonce within a file; the random 96-bit `fileNonce` separates files.
  Mirrored into the existing `nonce` blob column so the row is self-describing.
- **`bytesDownloaded` counts plaintext bytes, whole blocks only.** Partial
  trailing blocks are never committed.

## Data flow

**Enqueue.** `EnqueueLesson` upserts `state=queued, queuedAt=nowUtc,
filePath=<appSupport>/downloads/<lessonId>.csdl`. `EnqueueCourse` reuses the
existing `fetchCourseOutline` to expand into per-lesson enqueues, skipping
anything already `ready`. Both then kick the pump.

**Pump** — serial, oldest `queuedAt` first:

1. `state → downloading`
2. `GET /api/v1/lessons/{id}/stream-url` — minted fresh on every pump entry, so a
   resume after a long pause never carries a dead token
3. resolve relative → absolute against Dio's `baseUrl`, the same rule
   `LessonPlayerApi._resolveUrl` already applies
4. ranged `GET url` with `Range: bytes=<bytesDownloaded>-`, response as a byte
   stream
5. `totalBytes` from the `Content-Range` total, or `Content-Length` on a `200`
6. chunks feed `ChunkedGcmWriter`; each full block is sealed and appended
7. stream end → flush the short final block → `state → ready`

**Persistence cadence.** `bytesDownloaded` is flushed to Drift every 16 blocks
(4 MiB), plus on pause, cancel, and completion — not per block. Per-block would
be roughly 3 200 SQLite transactions for an 800 MB video, to save at most 256 KiB
of re-download.

This makes the DB lag the file on disk, which is safe because of one rule: **the
DB row is the source of truth, and resume truncates the file down to match it**,
to `24 + completedBlocks × (blockSize + 16)`. Worst case a resume re-fetches
under 4 MiB. The same rule is what makes an app kill mid-block harmless — there
is never a "is the file ahead of the row?" question to answer.

**Progress to the UI** comes from an in-memory stream for the active item, not
from `DownloadsDao.watch`. The DAO stream only fires on the 4 MiB flushes and
would make a progress bar jump.

**Lifecycle:**

- `Pause` — cancel via `CancelToken`, seal whole blocks, persist, `→ paused`
- `Cancel` — cancel, delete the file, `DownloadsDao.remove`. Cancel has no
  terminal state by design; there is nothing left to resume from.
- `Retry` — `attemptCount++`, `→ queued`
- **App kill** — on init, any row still `downloading` reconciles to `paused`.
  Nothing was committed mid-block, so no file repair is needed.
- **Offline** (`connectivity_plus`) — stop pumping, stay `queued`, do not burn an
  attempt

**Loopback server.** Binds `127.0.0.1:0` lazily on first resolve of a `ready`
download. URL is `http://127.0.0.1:<port>/l/<lessonId>?t=<token>`, where the token
is 128 random bits minted per app run — loopback is reachable by every other app
on the device, so the ephemeral port is not access control. It translates an
incoming `Range` into a block range, decrypts only those blocks, and answers
`200` / `206` / `416`.

## Error handling

| condition | behaviour |
| --- | --- |
| socket drop / timeout | `→ queued`, `attemptCount++`, `nextAttemptAt = now + 2^n` seconds — the whole ladder is 2s, 4s, 8s, 16s, because the 5th attempt fails the row instead of backing off. There is no minutes-scale cap; one would be unreachable. |
| `401` mid-transfer | re-mint the stream URL once and continue from `bytesDownloaded`; a second `401` → `failed` |
| `416` | source changed server-side → discard, reset to 0, restart once |
| `404` | lesson or file gone → `failed`, no retry |
| disk full | `failed` with `lastError`, no retry — retrying cannot create space |
| offline | not an error; stays `queued`, no attempt counted |
| GCM tag mismatch on read | `failed` + `lastError`; the block index localizes the damage |
| local file deleted | reader throws → row re-marked `failed`, matching the carded acceptance |

## Testing

All under `flutter test`; no device required.

1. `encrypted_file_format` — pure round-trip: plaintext offset ↔ block index ↔
   ciphertext offset, short final block, zero-length file
2. writer/reader round-trip — random bytes in, random ranges out, byte-equal;
   flip one byte and assert the tag failure is raised at that block
3. resumption — mocked Dio adapter asserting the literal `Range: bytes=<n>-`
   string; `206` partial then abort; the second request resumes at the right
   offset
4. token refresh — a `401` mid-transfer asserts a second `stream-url` call
   occurred
5. `DownloadsBloc` — `bloc_test` per event (`EnqueueLesson`, `EnqueueCourse`,
   `Pause`, `Resume`, `Cancel`, `Retry`) against `FakeDownloadScheduler` and a
   fake repository
6. app-kill recovery — seed a `downloading` row, init, assert reconciliation to
   `paused`
7. loopback server — real HTTP `Range` requests against a real fixture on
   `127.0.0.1`. This is a server we own, so there is no flakiness to simulate.
8. Drift v1→v2 migration test
9. verb regression — pins `GET` for `stream-url` and `download-url`, closing the
   hole that let the `.post(...)` defect ship

## Out of scope

- Materials download (no Range support server-side; separate path)
- `PlayerBloc` wiring and the pre-play integrity check — E19-F01-S02, #125/#126
- The Downloads tab UI — E19-F01-S03, #127-130, which is design-gated on a
  `cs-mobile-downloads` mockup
- Full native background transfer (Android foreground service, iOS background
  `URLSession`) — revisit when a device is available
- Contracting `Accept-Ranges` in `openapi.yaml` so CI protects it — worth its own
  card, noted under Findings

## Follow-ups to file

- Card: contract Range support for `/api/v1/stream/lessons/{id}` in the spec, or
  add a backend test that pins `Accept-Ranges`, so the resumable contract this
  card depends on cannot silently regress.
- Card: correct the E19-F01-S01 Notes section — the 5-minute TTL figure is wrong.
