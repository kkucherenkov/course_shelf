# Active tasks

## T-2026-05-11-001 — README screenshots for Stage A web (4 captures)

- Created: 2026-05-11
- Owner: claude
- Spec: README §Screenshots + `docs/screenshots/README.md` capture plan
- Goal: produce four reproducible PNG captures (home, course-detail, lesson-player, admin-dashboard) at 1440×900 light theme, drop them into `docs/screenshots/`, and embed them inline in README.md, README.ru.md and the docs/screenshots/README.md index. Mobile capture skipped per user request.
- Spec diff: none (no API change)
- Codegen impact: none
- Sub-steps:
  - [x] Add `scripts/screenshots.ts` — standalone Playwright headless script reusing `tests/e2e/*` mock patterns; baseURL from `WEB_URL` env (default `http://localhost:3001`). Patches `HTMLMediaElement.addEventListener('error', …)` to keep the lesson player out of its error overlay when the stub MP4 fails to decode.
  - [x] Wire `pnpm screenshots` root script.
  - [x] Run `pnpm --filter @app/web dev` (mocks make the backend optional) and verify all four captures land in `docs/screenshots/` under 600 KB.
  - [x] Embed `![…](docs/screenshots/<file>.png)` in README.md and README.ru.md.
  - [x] Refresh the file table in `docs/screenshots/README.md`: drop the mobile-home row, swap the slug URLs for the `[id]` route, flip the theme convention to "dark by default" to match `nuxt.config.ts`.
  - [x] `pnpm exec prettier --write` over the touched files.
- Status: ready-to-ship (awaiting PR)
- Blockers: —

## T-2026-05-04-002 — Release pipeline + image-pulling compose (E22-F01-S06, #109)

- Created: 2026-05-04
- Owner: claude
- Spec: `docs/roadmap/tasks/E22-F01-S06.md` (Forgejo #109)
- Goal: pushing `git tag vMAJOR.MINOR.PATCH-release` produces versioned Docker images on the Forgejo registry, an image-pulling `compose.release.yml` artefact, and a Forgejo Release with a Conventional-Commits-derived changelog.
- Spec diff: none (no public API change)
- Codegen impact: none
- Sub-steps:
  - [ ] Templated Centrifugo config (envsubst at boot) so prod secrets aren't hardcoded.
  - [ ] `APP_VERSION` build arg wired into backend + web Dockerfiles.
  - [ ] `docker/compose.release.yml` — image-pulling variant alongside the existing build-locally `compose.prod.yml`.
  - [ ] `cliff.toml` + `pnpm release:notes` for Conventional-Commits changelog.
  - [ ] `.env.release.example` — full env contract.
  - [ ] `.forgejo/workflows/release.yml` — tag-triggered workflow (build + push + create release with assets).
  - [ ] `docs/release.md` runbook + restructured `docs/deployment.md`.
  - [ ] Roadmap card flipped to in-progress / done.
- Status: in-progress
- Blockers: —
