# Active tasks

## T-2026-08-29-008 — E20-F01-S01 · SyncBloc, and the producers that make it mean something

- Created: 2026-08-29
- Owner: claude
- Branch: `feat/sync-bloc`
- Cards: [E20-F01-S01](../../docs/roadmap/tasks/E20-F01-S01.md) — the last
  unstarted card on the v1 roadmap (#132, sub-steps #133/#134/#135)
- Goal: offline writes actually reach the server. Three outbox tables fill and
  nothing drains them; `POST /api/v1/progress/batch` has a complete backend
  implementation and no caller on either platform.
- Spec diff: none — every endpoint the drain needs already exists
- Codegen impact: no
- Design impact: no

### Two things found while reading, both agreed with the maintainer

**1. The `/api/v1` doubling bug is still live in two files.** Issue #172 fixed
`auth_api.dart` in July but not the class of bug. `lesson_player_api.dart` (10
call sites) and `http_lesson_byte_source.dart` (1) still pass `/api/v1/…` to a
Dio whose `baseUrl` already ends in `/api/v1`; Dio string-concatenates, so
every one resolves to `/api/v1/api/v1/…` and 404s. The player's notes,
bookmarks, outline, stream-url and material downloads are all non-functional
against a real backend, as is the downloads byte source shipped in #198.

The tests do not catch it because they build `Dio(BaseOptions(baseUrl:
'http://localhost:3000'))` — without the `/api/v1` the real app has — and then
assert `adapter.lastRequest.path`, the argument, rather than the resolved
`RequestOptions.uri`. Fixed here as its own commit, with a test that closes the
whole class rather than one file.

**2. Two of the three outboxes have no producer.** `notes_outbox` and
`bookmarks_outbox` are written by nothing: the player calls
`saveNote` / `createBookmark` / `deleteBookmark` straight through Dio and
swallows the error when offline. Draining tables that never fill would ship
two thirds of this card as test-only code — the exact pattern the audit just
flagged for `CachedCatalogDao` and `AppSsoBlock`. So the player's writes move
onto the outbox as well.

### Deviation from the card, recorded

Acceptance says _"Conflict (server `updatedAt` > client) results in client
overwrite from server"_. There is no local progress cache to overwrite — no
Drift table stores progress, only the outbox. `accepted`, `stale` and
`forbidden` are therefore all terminal for the queued row; what distinguishes
`stale` is that it carries the server's `LessonProgressDto`, which the drain
surfaces on the outcome so a listening player can correct itself. Recorded
rather than silently reinterpreted.

- Sub-steps:
  - [ ] strip the `/api/v1` prefix from 11 call sites; add a URI-resolution
        test that builds Dio with the real base
  - [ ] `SyncState` (idle · syncing · failed) + `SyncRepository` port
  - [ ] `SyncApi` — batch progress, notes upsert/delete, bookmark
        create/update/delete
  - [ ] `SyncRepositoryImpl` — the three outboxes drained oldest-first by
        `queuedAt`, per the drain rules already written on the DAOs
  - [ ] `SyncBloc` — ConnectivityChanged · AppResumed · Tick · ManualSync
  - [ ] player writes go to the outbox instead of straight to the wire
  - [ ] DI + provide above the MaterialApp, `Stream<SyncState>` exposed
  - [ ] bloc_test + unit tests for every drain rule
- Status: in-progress

**Known constraint, inherited.** No emulator on this host and none in CI, so
the `integration_test` the card asks for cannot be written or run here — the
same limit E19-F01-S01 and E19-F01-S03 recorded.
