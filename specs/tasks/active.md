# Active tasks

## T-2026-09-15-full-scan-reorders — full scan reconciles an already-imported folder instead of skipping it

- Created: 2026-09-15
- Owner: claude
- Spec: none — internal scan logic only, no wire contract change
- Goal: Closes #544 — a library-wide scan skips a folder it already owns
  (`importedFolderNames.has(folderName)` → `continue` in
  `run-scan.handler.ts`), so it can never repair lesson order once the
  filename parser gains a rule an older import predates. Only the scoped
  `POST /courses/{id}/rescan` recomputes positions today.
- Measured (not deduced) against `ORDER-LESSONS.tsv`/`ORDER-AUDIT.txt`, the
  real prod dump run through the real `parseLessonFileName` +
  `assignLessonPositions`: 153 lessons across 6 courses sit at the wrong
  position; the parser is correct on today's filenames, the data predates it.
- Design: reconcile, not skip and not force-resync. Library-wide scan on an
  already-imported folder now recomputes lesson positions and reuses lesson
  ids (guarded by `lesson.courseId === course.id` — the library-wide
  `existingLessonByVideoPath` index spans every course, so this is what stops
  an id being adopted across a course boundary). Course-level metadata,
  sections, and vanished-lesson cleanup stay exactly as narrow as the old
  skip — those remain force-resync-only (`scopeCourse`), so this stays a
  position/id fix and not a second force-resync path.
- Sub-steps:
  - [x] issue #544
  - [x] `run-scan.handler.ts`: reconcile path for an already-imported folder
        on a library-wide scan
  - [x] unit tests: id-reuse-within-course guard fails without the check
        (verified by temporarily reverting it locally — failed as expected,
        restored); real 18-lesson course from `ORDER-LESSONS.tsv` (measured
        against ALL 6 flagged courses too — reproduced 153/6/62 exactly via a
        throwaway script over the real parser, not copied from the issue)
  - [x] rewrote the one test that encoded the old skip behaviour
        (`E32-F01-S03`'s "a library-wide scan still skips a course it already
        imported") and two others whose fixtures had no `Section` row (a
        shape the reconcile path now legitimately needs — production always
        has one, `COURSE_WITH_SECTIONS_SELECT`)
  - [x] doc comments in `run-scan.handler.ts` (module header + persist block)
  - [x] `docs/user-guide.md`: 3 stale claims fixed ("library scan cannot
        repair a course", "renumbering only happens on a course rescan")
  - [x] lint/format/typecheck/test gates (2110 backend tests green)
  - [ ] open PR with `Closes #544`
- Status: in-progress
- Blockers: —

## T-2026-09-14-contract-gate-determinism — `negative_data_rejection` coin flip on numeric query params

- Created: 2026-09-14
- Owner: claude
- Spec: none — `packages/specs/schemathesis.toml` only. Closes #528.
- Goal: stop the contract gate failing on a coin flip for any of the eleven
  operations that declare `offset`/`limit` as `type: integer` in query.
- Measured, not deduced (live stack, `csh-laneh` compose project, ports
  13000/13801/15432/13200/14317/14318, seeded + ADMIN bearer minted the same
  way `e2e.yml` does):
  - Reproduced the exact mechanism with a hand-built request: `offset=1`
    (digit string) round-trips byte-identical through the query string and
    `express-openapi-validator` correctly coerces + accepts it — 200, not a
    bug in the API.
  - `yq` over `openapi.yaml`: exactly 11 operationIds declare `offset` and/or
    `limit` as inline `type: integer` in query (matches the issue's "roughly
    eleven" claim exactly): `getContinueWatching`, `getRecentlyAdded`,
    `getRecentlyCompleted`, `listAdminScans`, `listAdminTranscriptions`,
    `listAdminUsers`, `listInstructors`, `listLibraryTranscriptions`,
    `listStudios`, `listTags`, `searchCatalogue`.
  - 6 full-spec contract-test runs (fresh random seed each, ~6300-6700 cases,
    25 examples/op) all passed — consistent with "coin flip": the false
    positive is real (proven above) but not dense enough to hit on every run,
    matching one hit in many CI runs on `main`.
  - Option 2 (string+pattern on the wire) rejected on measured blast radius:
    the schema.json for schemathesis' own config confirms per-operation is
    the only granularity available (no per-parameter check toggle), so this
    isn't about schemathesis config shape — the actual finding is that
    `offset`/`limit` are duplicated inline 14 times across those 11
    operations (no shared `$ref`), and retyping them changes what every
    generated client emits (`number` → `string`) and what
    `express-openapi-validator` hands the handler, which reads it as a
    `number` today (repository `skip`/`take`). That is a wire-breaking
    change per this repo's own versioning rule (new `/api/v2` prefix + ADR)
    for a gate-determinism fix — disproportionate, and out of this lane's
    `packages/specs`-only boundary regardless.
  - Confirmed schemathesis' config accepts `include-operation-id` as an
    array, so the fix is one block, not eleven.
- Sub-steps:
  - [x] measure against a live stack (see above)
  - [x] add one `[[operations]]` block to `schemathesis.toml`,
        `include-operation-id` = the 11 operationIds,
        `checks.negative_data_rejection.enabled = false`, documented rationale
  - [x] `pnpm spec:validate`, `pnpm --filter @app/specs lint`, `typecheck`
  - [x] re-ran the real `pnpm spec:contract-test` against the live stack with
        the fix applied — green, same shape as every other CI pass
  - [x] PR with `Closes #528` —
        [#543](https://github.com/kkucherenkov/course_shelf/pull/543)
- Status: in-progress
- Blockers: — (CI green except `Storybook visual regression`, which is
  already failing on `main` HEAD `72183adc`/#533 — unrelated to this change,
  not in this lane's `packages/specs` remit)

## T-2026-09-14-admin-course-access — an admin fixing a bad import cannot reach a single course from admin

- Created: 2026-09-14
- Owner: claude
- Spec: none — `#510`; no HTTP contract change, `listCourses` already accepts
  `libraryId` and "admins see all"
- Goal: from `admin/libraries/:id`, an admin can reach any course in that
  library in one click, landing on the existing `courses/:id` page that
  already carries Rescan/Resync/Transcribe.
- Decision (the fork the issue names): library detail page links straight
  into the existing course pages (option 2, issue's own "far cheaper and
  probably enough"), not a new admin course list surface. Reuses
  `useCoursesList({ libraryId })` (already supports the filter, already used
  by Browse) — no new composable, no new endpoint.
- Acceptance:
  - `admin/libraries/:id` shows every course in the library, each linking to
    `/courses/:id`.
  - Loading skeleton while fetching; empty state when the library has zero
    courses.
  - `ru` locale renders.
- Spec diff: none
- Codegen impact: no
- Design impact: none — new component lives in `apps/web/app/components/admin/`
  (page-specific, like `AdminScansTable`), not `@app/ui`.
- Tests: unit spec for the new `AdminCourseList.vue` (colocated, mirrors
  `AdminScansTable.spec.ts`).
- Sub-steps:
  - [x] plan
  - [x] `AdminCourseList.vue` + colocated spec
  - [x] wire into `admin/libraries/[id].vue` via `useCoursesList({ libraryId })`
  - [x] i18n keys (en + ru)
  - [x] lint/format/typecheck/test gates
  - [x] open PR with `Closes #510` — [#540](https://github.com/kkucherenkov/course_shelf/pull/540)

## T-2026-09-14-error-filter-code — HttpExceptionFilter drops code/detail on object-bodied HttpException

- Created: 2026-09-14
- Owner: claude
- Spec: none — `packages/specs/openapi/openapi.yaml`'s `Problem` schema
  already has `code`/`detail` as optional properties; no spec change needed
- Goal: closes #479 — `PATCH /api/v1/courses/{id}` (and every other
  controller-level `throw new BadRequestException({ code, detail })`, the
  shape used consistently across this codebase) answered a bare
  `about:blank` 400 with neither field, while a `DomainError` 400 always
  carries both.
- Root cause (measured — reproduced through the real filter + a real Nest
  app rather than deduced from the source): Nest's `HttpException.createBody`
  passes a caller-supplied object straight through `getResponse()` with no
  added `message`/`error`/`statusCode` keys. `HttpExceptionFilter.toProblem`'s
  `HttpException` branch only ever read `obj.message` / `obj.error` — Nest's
  own conventional keys — never `obj.code` / `obj.detail`, the keys every
  controller in this codebase actually uses (mirrors `DomainError`'s shape).
  Confirmed by a failing test against `courses.controller.ts`'s exact
  `rating-fields-must-be-paired` throw before touching the filter.
- Fix: read `obj.code` / `obj.detail` first, falling back to Nest's
  `error`/`message` for framework-built exceptions (e.g. `ValidationPipe`)
  that were never touched by this bug.
- Sub-steps:
  - [x] failing unit test reproducing the drop against the real filter
  - [x] fix `HttpExceptionFilter.toProblem`
  - [x] lint/format/typecheck/test gates green (2101 backend tests passed)
  - [x] open PR with `Closes #479`

## T-2026-09-14-show-version — the running version is nowhere in the UI

- Created: 2026-09-14
- Owner: claude
- Spec: `InstanceConfigDto.version` — `#537`
- Goal: the settings page names the version this instance is running, so a bug
  report can quote it and a stale cached SPA is distinguishable from a stale
  server.
- Sub-steps:
  - [x] spec + codegen
  - [x] `AdminPublicController` returns `AppConfig.runtime.version`
  - [x] About section on the settings page, en/ru copy
  - [x] tests: backend controller, web rows (version and the unreachable case)
- Status: in-progress
- Blockers: —

## T-2026-09-14-transcription-recovery — stale `running` recovery + real detected language

- Created: 2026-09-14
- Owner: claude
- Spec diff: `packages/specs/openapi/openapi.yaml` — `TranscriptionStatus` gains
  `interrupted`. Nothing else in the contract changes.
- Codegen impact: yes (enum member only)
- Goal: Closes #525 (a killed transcription run stays `running` forever and
  blocks every future run) and #501 (every generated transcript is filed as
  `und` instead of the language whisper actually detected).
- Design:
  - #525: `AppConfig.bootId` — a random id generated once per process start
    (not env-derived, so it lives on `AppConfig` as a computed field rather
    than a new provider). Stamped on `Transcription.start()`. At boot,
    `TranscriptionRecoveryService` (`OnApplicationBootstrap`) finds every
    `status: running` row whose `bootId` differs from the current process's
    — which is every row from before this boot, by construction — and
    transitions each to a new terminal status `interrupted` via
    `Transcription.interrupt()`. Chose boot id over a heartbeat: no staleness
    window to guess: it is a single equality check, decidable rather than
    guessed. Per-lesson `Transcript` rows are untouched; the skip rule makes
    a plain re-run cheap, so no separate "resume" endpoint.
  - #501: `LocalWhisperAdapter` parses whisper's
    `auto-detected language: <tag>` line from stdout+stderr when invoked with
    `-l auto`; a new pure fn `resolveDetectedLanguage` constrains the result
    to `en`/`ru`, else falls back to the deployment's configured language.
    The walk determines each lesson's final language AFTER whisper returns
    (detection happens inside whisper.cpp, per file) — the working `.srt` is
    written to a placeholder bucket first, then renamed to match the final
    language, because `LessonFileLocator.locateGeneratedSubtitle` recomputes
    the file path from the DB's `language` column and trusts no stored path.
    The pre-run "does a current transcript already exist" lookup gains an
    any-language variant (`findAnyGeneratedForLessons`) for auto-mode runs,
    since the run no longer knows the language up front — needed so a
    resumed auto run still skips what it already transcribed.
    `GetLessonHandler`'s generated-track union switches from guessing the
    language off `AppConfig` to reading the real persisted value.
- Sub-steps:
  - [x] plan
  - [x] prisma schema: `TranscriptionStatus.interrupted`, `Transcription.bootId`
  - [x] domain: `Transcription.interrupt()`, `resolveDetectedLanguage`
  - [x] ports: `TranscriptionRepository.findStaleRunning`,
        `TranscriptRepository.findAnyGeneratedForLessons`
  - [x] infra: Prisma adapters, `LocalWhisperAdapter` stdout parsing
  - [x] application: `TranscriptionRecoveryService`, walk changes,
        `GetLessonHandler` read-path
  - [x] `AppConfig.bootId`
  - [x] openapi + codegen
  - [x] unit tests (all touched handlers/adapters/domain fns)
  - [x] integration test proving `findStaleRunning` selects a row a previous
        boot left behind, against a real Postgres, self-skipping if none is
        reachable (mirrors `local-ffmpeg.adapter.integration.spec.ts`)
  - [x] docs/architecture.md §8 data model paragraph
  - [x] lint/format/typecheck/test gates
  - [x] fix `apps/web` fallout: `AdminTranscriptionCard.vue`'s
        `Record<TranscriptionStatus, string>` needed the new member — CI's
        `nuxt typecheck` caught it, not `AdminLibraryRow.vue` (that one's
        status prop is `AdminLibraryListItem`'s Scan status, a different type
        that never touches `interrupted` — an earlier note here named the
        wrong file)
  - [x] PR
- Status: in-progress
- Blockers: —
- Known follow-ups (not in this PR): `Scan` has the identical stale-`running`
  shape; fixing it is out of scope per the lane brief unless it falls out of
  this mechanism for free, which it does not (separate table, separate
  repository) — open a follow-up task instead of widening this PR.

## T-2026-09-14-poster-download — a scraped course poster can never be displayed

- Created: 2026-09-14
- Owner: claude
- Spec: [packages/specs/openapi/openapi.yaml](../../packages/specs/openapi/openapi.yaml) —
  `GET /api/v1/courses/{id}/poster` (5th #278 binary exception)
- Goal: `Course.posterUrl` (scraped, third-party CDN) gets downloaded into
  `DERIVED_PATH` and served from our own origin, so the SPA's
  `img-src 'self'` CSP can actually display it — closes #496.
- Spec diff: openapi.yaml — new `GET /courses/{id}/poster` path only;
  `CourseDto.posterUrl`'s schema is unchanged, its runtime meaning changes
  (signed own-origin URL instead of the raw external one).
- Codegen impact: yes (spec:codegen run, artefacts included)
- Sub-steps:
  - [x] `PosterDownloader` port + `HttpPosterDownloader` adapter (reuses
        `HttpFetcher`'s SSRF guard via new `fetchBinary`)
  - [x] `derivedCoursePosterPath` in `derived-path.ts`
  - [x] `PosterSyncService` — single call site for the 3 handlers that set
        `Course.posterUrl` (scan, admin PATCH, backfill)
  - [x] `CoursePosterTokenSigner` + `CoursePosterLocator` + `GET :id/poster`
        route on `CoursesController`
  - [x] `toCourseDto` embeds the signed URL (no separate issue-token
        round-trip — threaded through all 6 call sites incl.
        instructor/studio/tag detail pages)
  - [x] web: `browse.vue` wires `posterUrl` into `CoursePosterCard`'s `cover`
  - [x] unit tests for every new domain/application/infra piece + a
        controller-level poster-route spec; backend+web suites green
  - [ ] open PR, confirm CI green
- Status: in-progress
- Blockers: —

## T-2026-09-14-document-union-merge — the working agreement names only half the union-merged files

- Created: 2026-09-14
- Owner: claude
- Spec: none — `#522`, found by hitting the same conflict three times in one
  wave of parallel lanes
- Goal: `.claude/CLAUDE.md` says `done.md` is union-merged like `active.md`,
  states the resolution, and says which neighbouring file is NOT in that
  category.
- Sub-steps:
  - [x] name both files, state the resolution (keep both sides, newest first)
  - [x] warn that every conflict region must be resolved, not only the first
  - [x] rule `docs/roadmap/TODO.md` out, with the reason
- Status: in-progress
- Blockers: —

## T-2026-09-14-stepik-scraper — a Stepik course fills itself from the open catalog API

- Created: 2026-09-14
- Owner: claude
- Spec: none — measured live against `stepik.org/api/courses/181875`; nothing
  about the wire contract changes
- Goal: a `stepik.org/course/{id}` URL fills the metadata editor from Stepik's
  own keyless API instead of recovering one field through the json-ld
  fallback.
- Sub-steps:
  - [x] `StepikScraper` + recorded fixtures
  - [x] registry wiring (unconditional — no key, like Coursera)
  - [x] tests
  - [x] card `E30-F02-S02`, `TODO.md` row, `docs/user-guide.md`

## T-2026-09-14-search-substring — a lesson found by a word from the middle of its name

- Created: 2026-09-14
- Owner: claude
- Spec: none — `packages/specs/openapi/openapi.yaml` already documents
  substring + tiered ranking correctly; no spec change needed (confirmed with
  the maintainer's brief before starting)
- Goal: `GET /api/v1/search` finds a lesson by a word from the middle of its
  title, not just a prefix. Closes #524.
- Root cause (measured against a real Postgres seeded with the exact fixture
  from the issue — 25 lessons `Биология поведения человека Лекция #N. <topic>`):
  `PrismaSearchAdapter`'s `WHERE title ILIKE %q%` is already correct substring
  matching (confirmed: raw SQL and the adapter in isolation both return the
  same 7/25 rows). The actual bug is in the DB-level `take: limit*2, orderBy:
title asc` — it truncates the candidate pool **alphabetically across the
  whole table before tiering happens**, so on a real (bigger) library, tier-0/
  tier-1 hits for one course can be crowded out of the window by unrelated
  tier-2 substring noise sorting earlier alphabetically. Fix: split each of
  `findCourseHits` / `findLessonHits` / `findTranscriptHits` into three
  mutually-exclusive, independently-capped queries (exact-prefix, word-prefix,
  remainder), concatenated in priority order, so the JS ranking in the handler
  can no longer lose a high-tier hit to alphabetical bad luck.
- Punctuation decision: leaving the raw-title substring match as-is (no
  normalisation) for this fix — normalising would mean either a generated
  normalised column + its own trigram index, or per-query `regexp_replace`
  that defeats the trigram index, and that's a separate design decision, not
  a silent add-on to a ranking bugfix. Opening a follow-up.
- Sub-steps:
  - [x] reproduce against a real Postgres with the issue's exact fixture
  - [x] add pg_trgm GIN indexes on `Course.title`, `Section.title`,
        `Lesson.title` (mirrors the existing `TranscriptCue.text` index)
  - [x] rewrite `PrismaSearchAdapter`'s three `findXHits` methods as
        tier-scoped queries
  - [x] update unit tests for the new query shape
  - [x] lint/format/typecheck/test gates green
  - [x] open PR with `Closes #524` — [#534](https://github.com/kkucherenkov/course_shelf/pull/534)
- Status: in-progress
- Blockers: —

## T-2026-09-14-fix-centrifugo-namespaces — declare the namespaces the contract uses

- Created: 2026-09-14
- Owner: claude
- Spec: none — the AsyncAPI contract was already correct; found while
  debugging a live NAS deployment whose scan progress never moved
- Goal: every Centrifugo namespace used by a channel in
  `packages/specs/asyncapi/centrifugo.yaml` must be declared in every
  Centrifugo configuration, and stay that way.
- Sub-steps:
  - [x] add `scans` and `maintenance` to dev, prod and release configs
  - [x] `scripts/check-realtime-namespaces.ts` deriving the required set from
        the contract
  - [x] wire it as `pnpm check:realtime` and a CI step
- Status: in-progress
- Blockers: —
