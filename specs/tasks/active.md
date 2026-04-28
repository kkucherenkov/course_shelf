# Active tasks

## T-2026-04-27-052 — Home page Stage A · spec + backend half (E14-F01-S01 part 1 of 2)

- Created: 2026-04-27
- Owner: claude
- Spec: `docs/roadmap/tasks/E14-F01-S01.md`
- Goal: ship the API and backend halves of the Home page card so the web half can land in a separate PR. `GET /home/continue-watching` already exists from prior work; this entry adds the three remaining endpoints feeding the Home page rows + right rail.
- Acceptance:
  - `GET /api/v1/home/recently-added` — courses added to the requester's libraries, ordered by `Course.createdAt DESC` and capped by `limit`. Empty array for empty libraries. Reads `Course` directly.
  - `GET /api/v1/home/recently-completed` — courses where the requester finished the last lesson, ordered by `lastSeenAt DESC` (which equals completion time when `lessonsCompleted == lessonsTotal`), capped by `limit`. Reads `CourseProgressReadModel`.
  - `GET /api/v1/home/your-week` — `{ minutesWatched, lessonsCompleted, range: { from, to } }` over the trailing 7 days for the requester. Reads `LessonProgress` (sum of completion-time minutes) + `CourseProgressReadModel`.
  - All three: `bearerAuth`, RFC 9457 problem responses on 401, optional `limit` query param (1..50, default 10) for the list endpoints.
  - Backend: queries + handlers wired into a `HomeModule` reading from existing repos via injected ports — no `PrismaService` import in application/domain.
  - Spec validates, regenerates clean, generated client + DTO surfaces include the new methods.
- Spec diff: yes — `GET /home/{recently-added,recently-completed,your-week}` + 3 new schemas (`RecentlyAddedDto`, `RecentlyCompletedDto`, `YourWeekDto`) and any item shapes.
- Codegen impact: yes — re-emit `@app/api-client-ts`, `@app/api-client-dart`, and the server DTO surface.
- Design impact: none.
- Tests: vitest unit specs for each handler (happy path + empty case), plus contract tests stubbed via `pnpm spec:contract-test`.
- Sub-steps:
  - [x] Push active.md entry
  - [x] Edit `packages/specs/openapi/openapi.yaml` — add 3 endpoints + schemas (done in prior spec commit)
  - [x] Run `pnpm spec:validate && pnpm spec:bundle && pnpm spec:codegen` (done; types available in @app/api-client-ts)
  - [x] Stage codegen diff as its own commit (done in prior commit)
  - [x] Implement backend queries + handlers + controller + ports/adapters in `apps/backend/src/modules/catalog`
  - [x] Backend unit + contract tests (unit: 696 passing)
  - [x] Lint + typecheck + tests (all clean)
  - [x] Commit + push + open PR — http://code.homelab.local/kkucherenkov/course_shelf/pulls/137 (Refs #59; the second PR will carry `Closes #59`)
- Status: paused — PR #137 open; web + Playwright half tracked separately under T-…-053 (queued for next session)
- Blockers: —
