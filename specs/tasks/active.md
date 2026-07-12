# Active tasks

## T-2026-07-12-001 — deploy via Dockge from local Forgejo registry

- Created: 2026-07-12
- Owner: claude
- Spec: [plan](~/.claude/plans/optimized-tickling-mccarthy.md)
- Goal: run CourseShelf in the homelab via Dockge, updating by release tag, with images staying on the LAN (no ghcr.io roundtrip).
- Spec diff: none (no OpenAPI/AsyncAPI change)
- Codegen impact: no
- Sub-steps:
  - [x] point `.forgejo/workflows/release.yml` at `code.homelab.local` instead of ghcr.io (env, login, push, render, comment)
  - [x] align `docker/compose.release.yml` default REGISTRY → code.homelab.local
  - [x] document Dockge deploy + host insecure-registry prereq (folded into `docs/deployment.md` + `docs/release.md`, not a new file — avoid dup)
  - [x] note insecure-registry host step in `.env.release.example`
  - [x] CI speedup: move Storybook visual-regression + license-check off per-PR into on-demand `.forgejo/workflows/quality.yml` (nightly + dispatch); keep cheap `pnpm audit` in `checks`
  - [x] remove trivy entirely (`.forgejo/workflows/trivy.yml` + `.trivyignore.yaml` deleted); inline "stays Trivy-green" code comments left as valid non-root rationale
  - [x] registry is plain HTTP — docs make host `insecure-registries` the required step, Caddy-TLS a future note
  - [x] new `pnpm audit` gate caught 3 pre-existing criticals → fixed at root: better-auth ^1.6.8→^1.6.23 (GHSA-pw9m-5jxm-xr6h), shell-quote override ≥1.8.4 (GHSA-w7jw-789q-3m8p, dev-only transitive). 0 criticals now.
  - [x] prettier gate: excluded `docs` + `.impeccable`, formatted `apps/web/app/stores/auth.ts`
- Status: in-progress (PR #231 open — http://code.homelab.local/kkucherenkov/course_shelf/pulls/231)
- Blockers: —
- Notes:
  - token: workflow uses `FORGEJO_PKG_TOKEN || GITEA_TOKEN` — no action unless the first release fails at `docker push` with a permission error, then add `FORGEJO_PKG_TOKEN` (PAT `write:package`)
