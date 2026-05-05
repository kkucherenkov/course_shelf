# Active tasks

## T-2026-05-05-002 — CI cache: Playwright + design tokens

- Created: 2026-05-05
- Owner: claude
- Spec: [docs/superpowers/specs/2026-05-05-ci-cache-playwright-tokens-design.md](../../docs/superpowers/specs/2026-05-05-ci-cache-playwright-tokens-design.md)
- Goal: cut ~45s off CI wall-time per push (~9%) by caching the Playwright Chromium binary across runs and sharing `design:build` outputs across the three jobs that need them. Diagnostic of run #436 showed `ui-storybook` (4:45) dominates wall-time and act_runner enforces concurrency 2 — so the original "consolidate 6 parallel installs" framing was wrong; this is the narrowed scope.
- Spec diff: none (no public API change)
- Codegen impact: none
- Sub-steps:
  - [ ] Phase 1 — Playwright cache in `.forgejo/workflows/ci.yml` (`ui-storybook` job)
  - [ ] Phase 2 — design-tokens cache in `.forgejo/workflows/ci.yml` (`web`, `ui-quality`, `ui-storybook` jobs)
  - [ ] Phase 3 — Playwright cache in `.forgejo/workflows/snapshots-regen.yml` and `.forgejo/workflows/e2e.yml`
- Status: in-progress
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
