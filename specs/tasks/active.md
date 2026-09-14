# Active tasks

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
