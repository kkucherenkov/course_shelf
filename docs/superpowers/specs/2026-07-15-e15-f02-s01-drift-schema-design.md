# E15-F02-S01 — Drift schema + DAOs — design

**Date:** 2026-07-15
**Card:** [E15-F02-S01](../../roadmap/tasks/E15-F02-S01.md) — story #17, tasks #18 #19 #20
**Scope:** Local persistence for cache + outbox + downloads: 7 tables, a DAO per table, a migration helper.
**Not in scope:** the sync drain (E20), encryption and the download engine (E19), any UI.

## What this story is really deciding

The card describes seven tables and "DAOs per table", which reads as one uniform job. It is not. These tables exist solely to serve E19 (offline) and E20 (sync), and those consumers plus the wire contract dictate three genuinely different shapes. Getting the shapes wrong here is expensive later: E19/E20 build directly on them.

This story writes **no sync logic and no crypto**. It makes both possible.

## Ground truth (verified against the spec, 2026-07-15)

`packages/specs/openapi/openapi.yaml` — the source of truth for every wire contract:

| Endpoint | Semantics that constrain the schema |
| --- | --- |
| `POST /api/v1/progress/batch` | `items` **maxItems: 200** — "to keep request bodies under the 1 MiB JSON ceiling". Results are index-mapped: "Index N in the response maps 1:1 to index N in the request." |
| `RecordProgressRequest` | Carries `clientUpdatedAt`. Server compares it to its `lastSeenAt`. |
| `BatchProgressItemStale` | "The client's `clientUpdatedAt` was older than the server's `lastSeenAt` … the client should overwrite its local cache from `state`." |
| `POST /api/v1/lessons/{lessonId}/bookmarks` | `CreateBookmarkRequest` = `positionSeconds` + optional `label`. **No id, no `clientUpdatedAt`** — the server assigns the id. |
| `PATCH` / `DELETE /api/v1/bookmarks/{id}` | Require the **server-assigned** id. |
| `PUT /api/v1/notes` / `DELETE /api/v1/notes/{lessonId}` | Keyed by `lessonId`. No `clientUpdatedAt`. |
| `GET /api/v1/courses/{id}/outline` | `CourseOutlineDto` = `{course, sections, materials}`. `CourseDto` has 20+ fields incl. nested `sections`, `progress`, `instructors`, `studios`, `tags`. |

**Web is not a precedent here.** The standing rule is to mirror `apps/web` when a card is ambiguous, but web has no offline support at all: `PlayerBookmarksTab.vue` calls `createBookmark` directly, nothing uses `/progress/batch`, and `useProgressReporter` fires every 10 s and *swallows* network errors ("Best-effort"). Mobile is the first offline-capable client, so the wire contract governs instead.

## The three outboxes are not alike

| Table | Shape | Rationale |
| --- | --- | --- |
| `progress_outbox` | **unique(lessonId)**, upsert | Server is last-write-wins on `clientUpdatedAt`; only the newest write per lesson matters. Web reports every 10 s, so append-only would store 6 rows/min — one hour offline on a single lesson is 360 rows, 359 of them writes the server discards as stale, and it **breaches the 200-item batch cap after ~33 minutes**. Coalescing makes overflow structurally impossible rather than a drain-side concern. |
| `notes_outbox` | **unique(lessonId)**, upsert, `op ∈ {upsert, delete}` | `PUT /notes` and `DELETE /notes/{lessonId}` are both keyed by `lessonId` and idempotent. Same reasoning as progress. |
| `bookmarks_outbox` | **append-only** rows: `localId`, nullable `serverId`, `op ∈ {create, update, delete}` | Each create is a distinct entity, so it cannot coalesce by key. |

### The bookmark id problem

The server assigns `id` on create, but `PATCH`/`DELETE` need it. Create a bookmark offline and edit it, and the edit references an id that does not exist yet.

**Resolution: op collapsing on `localId`.** Ops queued against the same `localId` collapse before sync:

- `create` + `update` → a single `create` carrying the final values
- `create` + `delete` → both dropped, nothing sent
- `update` / `delete` on an already-synced bookmark → carries the real `serverId`, which it has

No id-mapping table, no rewrite step, no ordering hazard: an op that needs a `serverId` always has one, because anything without one collapses into its create. The rejected alternative — queue verbatim, map `localId → serverId` at drain, rewrite dependents — needs strict ordering and correct rewriting, and a failed create strands every dependent op.

**This story stores the columns that make collapsing possible. E20 performs the collapse.**

### Outbox columns

```
progress_outbox    (lessonId PK, positionSeconds, durationSeconds,
                    clientUpdatedAt, queuedAt)
notes_outbox       (lessonId PK, op, body NULLABLE, clientUpdatedAt, queuedAt)
bookmarks_outbox   (localId PK, serverId NULLABLE, lessonId, op,
                    positionSeconds NULLABLE, label NULLABLE,
                    clientUpdatedAt, queuedAt)
```

`progress_outbox`'s columns are exactly `RecordProgressRequest`'s required set (`lessonId`, `positionSeconds`, `durationSeconds`, `clientUpdatedAt`) — the drain maps a row to a request field-for-field with no transformation.

`clientUpdatedAt` is the *user action* instant, not the enqueue instant, since the server compares it against its `lastSeenAt`. `queuedAt` is separate and exists for chronological drain ordering (E20-F01-S01: "SyncRepository orchestrates each outbox in chronological order", issue #134). They differ: a coalescing upsert refreshes both, but only `clientUpdatedAt` carries wire meaning.

Nullable columns follow the op: `notes_outbox.body` is null for `delete`; `bookmarks_outbox.positionSeconds`/`label` are null for `delete`, and `serverId` is null until the create syncs. Nullability *is* the collapse contract — a non-nullable `serverId` would make offline creates unrepresentable.

## Cache tables: JSON payload + promoted columns

```
cached_courses   (id PK, libraryId, slug, title, updatedAt, cachedAt, payload)
cached_sections  (id PK, courseId, position, cachedAt, payload)
cached_lessons   (id PK, sectionId, courseId, position, cachedAt, payload)
```

`payload` holds the generated DTO serialized to JSON. Promoted columns are exactly what Home/Browse/Course-detail filter and sort on.

The reason is drift, not convenience. `CourseDto` is generated into `packages/api-client-dart` from `openapi.yaml`; re-modelling its 20+ fields as Drift columns would duplicate a schema that codegen already owns. Every spec change would then need a matching migration, and the first time someone forgets, the cache rots silently against the wire contract — the exact failure pattern this repo has hit repeatedly (a Forgejo sync script pointed at a dead host, a DESIGN_BRIEF naming token paths that moved, commitlint and lint-staged configured but never wired). Storing the DTO whole means the spec cannot drift from the cache: codegen changes the payload's shape, and Drift never needs to know.

Trade-off, accepted: you cannot query inside `payload`. Anything a screen filters on must be promoted to a column. `cachedAt` exists so E18/E19 can implement staleness policy — this story defines no TTL.

## downloaded_lessons

Keyed by `lessonId`, because E19-F01-S02's acceptance is literally `downloaded_lessons[lessonId].state == READY`.

```
lessonId PK, state, filePath, bytesDownloaded, totalBytes, nonce, updatedAt, lastError
```

- `state ∈ {queued, downloading, paused, ready, failed}` — covers E19-F01-S01's `EnqueueLesson`, `EnqueueCourse`, `Pause`, `Resume`, `Cancel`, `Retry`. Cancel deletes the row rather than adding a terminal state; there is nothing to resume from.
- `bytesDownloaded` drives byte-range continuation.
- `totalBytes` is the size-match integrity check before play (E19-F01-S02, task #126).
- `lastError` supports "deleted local file falls back gracefully and re-marks the download as failed".
- `nonce` is the per-file AES-GCM IV. Nonces must be **unique, not secret**, so the database is the right home.

**The encryption key is deliberately absent.** E19-F01-S01 specifies a "device-bound key in secure storage", and `flutter_secure_storage` is already wired for the bearer token (`shared/auth/token_storage.dart`). A key stored beside its own ciphertext is not encryption. This table holds the nonce only.

## Structure

```
apps/mobile/lib/shared/db/
  app_database.dart          AppDatabase + MigrationStrategy + schemaVersion
  tables/
    cached_courses.dart      cached_sections.dart      cached_lessons.dart
    progress_outbox.dart     bookmarks_outbox.dart     notes_outbox.dart
    downloaded_lessons.dart
  daos/
    cached_catalog_dao.dart  courses + sections + lessons (one aggregate; they are
                             always read together via CourseOutlineDto)
    progress_outbox_dao.dart bookmarks_outbox_dao.dart notes_outbox_dao.dart
    downloads_dao.dart
```

Five DAOs, not seven. The three cache tables are one read aggregate — the outline endpoint returns them together and no screen reads a section without its course — so splitting them would produce three DAOs that are always called in concert. The four independent concerns (progress, bookmarks, notes, downloads) each get their own.

`drift` + `drift_dev` are added; `build_runner` is already a dev dependency. `AppDatabase` registers in `shared/di/injector.dart` as a lazy singleton alongside `AppConfig` / `TokenStorage` / `Dio`. Card acceptance says **"no widget code touches Drift"** — consumers are BLoCs only, enforced at review.

Generated `*.g.dart` output is **committed**, matching how freezed's output is handled in this package (`auth_user.freezed.dart`, `auth_user.g.dart` are tracked). Slang's `strings.g.dart` is the exception, gitignored and regenerated in CI; do not follow it.

## Testing

Every guard must be mutation-proven — this session produced four separate tests that asserted against values the test itself supplied and passed while broken. A test that cannot fail is worse than no test.

| Test | Mutation that must break it |
| --- | --- |
| DAO round-trip per table on `NativeDatabase.memory()` | — |
| `progress_outbox` coalesces: two writes for one lesson → **1 row**, newest values win | drop the unique index → 2 rows |
| `notes_outbox` coalesces per `lessonId` | drop the unique index |
| `bookmarks_outbox` appends: two creates → **2 rows** | add a unique key on `localId` |
| `bookmarks_outbox` stores a create with `serverId == null` | make the column non-nullable |
| Schema: `schemaVersion == 1`, `onCreate` builds all 7 tables from cold | — |
| `downloaded_lessons` has no key column | add one (guards the crypto boundary) |

No v1 → v2 migration test: there is no v2. The helper exists so E19 can add one without restructuring.

## Follow-ups (not this story)

1. Drift's `*.g.dart` is committed while slang's is not — two generators, two policies. Worth unifying deliberately.
2. `cachedAt` has no TTL policy; E18/E19 decide staleness.
3. `pnpm issues:sync` still targets the dead Forgejo host.
