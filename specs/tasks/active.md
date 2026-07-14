# Active tasks

## T-2026-07-13-001 — fix nightly CI red: e2e port collisions + missing visual baselines

- Created: 2026-07-13
- Owner: claude
- Spec: log evidence from runs 750–753 (e2e task 2430, quality task 2429)
- Goal: nightly `e2e.yml` and `quality.yml` green again.
- Spec diff: none (no OpenAPI/AsyncAPI change)
- Codegen impact: no
- Sub-steps:
  - [x] root-cause e2e: `docker compose up` dies on `Bind for 0.0.0.0:3200 failed: port is already allocated` — `coriolis-companion-otel-lgtm-1` on the shared runner host already publishes :3200; red every night since ≥2026-05-05 (one green ever: manual run 564)
  - [x] root-cause quality: 6 stories have no committed baseline under `packages/ui/test/__snapshots__/` (`feedback-appbanner--with-actions`, `primitives-appbutton--as-link`, `domain-appplayerchrome--at-course-start`, `domain-coursecard-coursepostercard--no-instructor`, `domain-coursecard-coursepostercard--static-inside-link`, `domain-coursecard-coursewidecard--with-resume-label`) — jest-image-snapshot CI mode fails on missing baselines instead of writing them
  - [x] compose.ci.yml: `ports: !override []` for postgres / redis / otel-lgtm — e2e job only needs web (:3001), backend (:3000), centrifugo (:8000, SPA websocket URL) published on the host
  - [x] backfill the 6 missing Storybook baselines, captured inside `mcr.microsoft.com/playwright:v1.59.1-jammy` (exact CI image) so glyph metrics match the runner — verified green in dispatched `quality.yml` run 757
  - [x] fourth layer, uncovered once ports were fixed (run 755): backend crashloops at boot — `Nest can't resolve dependencies of the PrismaCourseRepository (PrismaService, ?)`: `CatalogRepositoriesModule` re-provides `COURSE_REPOSITORY → PrismaCourseRepository` but never provided `EXTERNAL_ID_REPOSITORY`, a constructor dep the adapter gained in the enrichment work (#208, `dcba3d5`). Only full-app bootstrap exercises this wiring, and the nightly that would have caught it was already red on the port collision. Fixed by providing (not exporting) the token in the module + DI smoke spec `catalog-repositories.module.spec.ts` (red → green, full backend suite 1540/1540)
  - [x] fifth layer (run 2441): with the stack finally healthy, the regen path dies with `Error: No tests found.` — `pnpm e2e -- --update-snapshots` forwards the literal `--`, which Playwright reads as "everything after this is a positional test-file regex". Fixed to `pnpm e2e --update-snapshots` (pnpm forwards flags without a separator). Nightly path (`pnpm e2e`, no args) was never affected
  - [x] sixth layer (run 761: 25/32 passed, 7 failed — all "page never mounts" cases share one cause): REAL app bug — nginx serves the generated site with directory 301s (`/sign-up` → `/sign-up/`), and `auth.global.ts` matched `PUBLIC_ROUTES` with exact strings, so every deep link to a public page (`/sign-up`, `/forgot`, `/dev/foundations`) bounced to `/sign-in` in any nginx-served deployment. Found via Playwright trace network log (`301 GET /sign-up`). Fixed by normalizing `to.path` before comparing. Local repro loop: burkmak containers stopped, CI-shaped stack up locally, tests run inside `mcr.microsoft.com/playwright:v1.59.1-jammy` with `--network=host` (host Playwright unusable — Manjaro unsupported + CDN stalls)
  - [x] spec rot fixed: auth tests 1+2 rewritten (client `promoteToAdmin` stub deleted in #226 — assert first-run vs standard wizard framing + library POST instead); course-detail `.course-actions__primary-link` → `.course-actions__primary`; foundations spec mocks `has-users` like every other spec
  - [x] `foundations.png` baseline captured in the jammy container and committed (same capture path as the #757-verified Storybook baselines); CI plain run will confirm
  - [x] local verification: full suite 32/32 green in the CI image against the CI-shaped stack
  - [x] verify: `e2e.yml` green on this branch in CI (dispatched run 765, 2026-07-14)
- Follow-up (not this branch): CLAUDE.md "common commands" documents the same broken pattern (`pnpm e2e -- --grep "smoke"`, `pnpm --filter <app> test -- <path>`) — the `--` variants silently run the full suite or find no tests
- Status: in-review — all sub-steps done, PR #233 awaiting merge
- Blockers: —
- Notes:
  - latent third failure: even with ports fixed, the e2e visual test had no committed `tests/e2e/*-snapshots/` baseline — the regen dispatch path (aa8b1fc) was never successfully run
  - this branch is stacked on the T-2026-07-12-001 archive commit (PR #232) — merging this PR supersedes #232
