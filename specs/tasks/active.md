# Active tasks

## T-2026-05-05-003 — CI consolidation + Playwright Docker image

- Created: 2026-05-05
- Owner: claude
- Spec: [docs/superpowers/specs/2026-05-05-ci-consolidation-playwright-image-design.md](../../docs/superpowers/specs/2026-05-05-ci-consolidation-playwright-image-design.md)
- Predecessor: T-2026-05-05-002 (cancelled — cache approach was a net regression on this Forgejo runner; pivot to structural simplification)
- Goal: cut CI wall-time from ~8:35 to ~5:00 (-40%) by (a) consolidating backend + web + specs + ui-quality into one `checks` job that does `pnpm install` + `turbo run lint typecheck test` once, and (b) switching ui-storybook (and e2e + snapshots-regen) to `mcr.microsoft.com/playwright:v1.49.1-jammy` Docker image so Chromium + apt deps are preinstalled.
- Spec diff: none (no public API change)
- Codegen impact: none
- Sub-steps:
  - [x] Phase 1 — replace `backend` + `web` + `specs` + `ui-quality` jobs in `.forgejo/workflows/ci.yml` with one `checks` job
  - [x] Phase 2 — `container: mcr.microsoft.com/playwright:v1.49.1-jammy` on `ui-storybook` + drop `playwright install --with-deps`
  - [x] Phase 3 — mirror Playwright container into `.forgejo/workflows/{e2e.yml, snapshots-regen.yml}`
  - [x] Phase 4 — open PR; verify wall-time on first run; flip sub-step boxes
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
