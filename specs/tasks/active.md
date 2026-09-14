# Active tasks

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
  - [ ] open PR with `Closes #524`
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
