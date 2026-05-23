# Active tasks

## T-2026-05-23-002 — Stage 2 scraper port (Tasks 1–8)

- Created: 2026-05-23
- Owner: claude
- Plan: `docs/superpowers/plans/2026-05-23-stage2-scraper-port.md`
- Goal: Scraper subsystem — domain types/port/errors, ScrapersConfig, HttpFetcher, HtmlMetadataExtractor, JsonLdScraper, YouTubeScraper, UdemyScraper, ScraperRegistry + mock scrapers.
- Sub-steps:
  - [x] **Task 1** — Domain types (`scraper.types.ts`), port (`scraper.port.ts`), errors (`scraper.errors.ts`) + spec
  - [x] **Task 2** — `ScrapersConfig` interface + `scrapers` getter in `AppConfig` + spec
  - [x] **Task 3** — `HttpFetcher` + `isBlockedHostname` SSRF guard (`http-fetcher.ts`) + spec
  - [x] **Task 4** — `HtmlMetadataExtractor` (JSON-LD + OpenGraph, cheerio@^1.0.0) + spec
  - [x] **Task 5** — `JsonLdScraper` generic fallback + spec
  - [x] **Task 6** — `YouTubeScraper` (Data API v3, playlist/video/search) + spec
  - [x] **Task 7** — `UdemyScraper` (defensive landing-page) + spec
  - [x] **Task 8** — `DefaultScraperRegistry` + `createMockScrapers` + spec; typecheck/lint sweep fixing `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes` across all scraper specs
  - [x] **Task 8b** — Code-quality fixes: exact host match in `UdemyScraper.canHandle` (Fix 1), non-2xx guards in `JsonLdScraper` + `UdemyScraper` (Fix 2), YouTube API key redaction + 4xx/5xx throw in `getJson` (Fix 3), real hostname logic in `createMockScrapers` (Fix 4); 4 regression tests added
  - [x] **Task 9** — `ScrapeCourseCommand` + handler
  - [x] **Task 10** — OpenAPI spec + client regen
  - [x] **Task 11** — Controller + module wiring
  - [x] **Task 12** — e2e (mock mode)
- Status: done (Tasks 1–12 complete; PR pending)
- Blockers: —

## T-2026-05-23-001 — Stage 1 of Stash-style metadata enrichment (data model foundation)

- Created: 2026-05-23
- Owner: claude
- Spec: [/Users/kkucherenkov/.claude/plans/memoized-chasing-nest.md](../../.claude/plans/memoized-chasing-nest.md) (approved plan)
- Goal: ввести Instructor / Studio / Tag как lightweight aggregates + новые поля курса (poster, level, language, releaseDate, rating, externalIds) и зафиксить live-баг — instructor из `course.json` теперь сохраняется в БД. Это фундамент для Stage 2+ (scrapers / identify task / review queue).
- Acceptance:
  - Scan по фикстурной библиотеке с `course.json` v2 создаёт строки в `instructor`/`studio`/`tag` + соответствующие join-строки + `external_id` строки.
  - Re-scan той же библиотеки идемпотентен (один и тот же state DB).
  - Live-баг закрыт: `course.json` v1 с `instructor: "X"` после скана даёт `Instructor` строку и `course_instructor` связь.
  - Admin может прочитать `/catalog/instructors`, `/catalog/studios`, `/catalog/tags` (и detail by slug); запустить backfill по существующей библиотеке через CLI или admin endpoint.
- Spec diff: `packages/specs/openapi/openapi.yaml` (6 read endpoints + 3 admin POST + 1 maintenance POST + расширение `CourseDto`/`UpdateCourseRequest`); `packages/specs/asyncapi/centrifugo.yaml` (новый канал `maintenance:backfill:{jobId}`).
- Codegen impact: yes — regenerate `packages/api-client-ts` + `packages/api-client-dart` в отдельном коммите.
- Design impact: none (UI поверх — Stage 5).
- Tests: unit (новые VO + aggregates), integration (новые Prisma adapters + расширение `prisma-course.repository.spec`), handler specs (новые команды/запросы + расширение `update-course-metadata`/`run-scan`), e2e (`scan-metadata.e2e.spec.ts` с фикстурой `course.json` v2).
- Sub-steps:
  - [x] **Slice 1** — Prisma schema + migration + `course.json` v2 schema + shared VO (`entity-slug`, `display-name`, `language-tag`, `external-id-ref`, `refs`).
  - [x] **Slice 2** — Domain aggregates (Instructor, Studio, Tag) + ports + extend `Course` aggregate.
  - [x] **Slice 3** — Prisma adapters (instructor / studio / tag / external-id) + extend `prisma-course.repository.ts`.
  - [x] **Slice 4** — OpenAPI spec changes + regen clients (separate commit). _(swapped with old Slice 5: spec-first.)_
  - [x] **Slice 5** — CQRS commands/queries (upsert × 3, set-course-\* × 3, list/get × 3, extend update-course-metadata). _Backfill command deferred to Slice 8._
  - [x] **Slice 6** — Controllers (`catalog-entities.controller.ts`, `catalog-entities-admin.controller.ts`) + PATCH /courses/{id} extension.
  - [x] **Slice 7** — `run-scan.handler.ts` integration + `MetadataLinker` + AsyncAPI channel for backfill progress.
  - [x] **Slice 8** — Backfill CLI script + admin maintenance endpoint.
  - [x] **Slice 9** — Regression sweep + format pass. (On-disk fixture e2e dropped — Slice 7 already covers v2 flow via FakeFsAdapter and the backend has no on-disk fixture infra to reuse.)
- Status: in-progress
- Blockers: —
