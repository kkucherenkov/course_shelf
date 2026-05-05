# Active tasks

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
