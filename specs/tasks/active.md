# Active tasks

## T-2026-05-05-001 — Remove thin docker wrappers (proxy + centrifugo)

- Created: 2026-05-05
- Owner: claude
- Spec: [docs/superpowers/specs/2026-05-05-thin-docker-wrappers-removal-design.md](../../docs/superpowers/specs/2026-05-05-thin-docker-wrappers-removal-design.md)
- Goal: drop `courseshelf-proxy` and `courseshelf-centrifugo` from the release pipeline; run upstream `nginxinc/nginx-unprivileged:1.27-alpine` and `centrifugo/centrifugo:v6` directly via bind-mount (proxy) and env-driven config (centrifugo). Release wall-time falls ~5 min; surface area shrinks by 4 files.
- Spec diff: none (no public API change)
- Codegen impact: none
- Sub-steps:
  - [ ] Phase 1 — centrifugo wrapper removal (compose.prod.yml + compose.release.yml: image + full `CENTRIFUGO_*` env set; smoke-test locally)
  - [ ] Phase 2 — proxy wrapper removal (compose.{prod,release}.yml: image + `nginx-prod.conf` bind-mount; smoke-test locally)
  - [ ] Phase 3 — release.yml cleanup (drop two `publish` calls; merge render+bundle steps; cp `nginx-prod.conf` into STAGE; validate from STAGE)
  - [ ] Phase 3 — delete `docker/centrifugo/{Dockerfile, entrypoint.sh, config.template.json}` and `docker/nginx/Dockerfile`
  - [ ] Phase 4 — update `docs/release.md` + `docs/deployment.md`; add UPGRADE NOTE
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
