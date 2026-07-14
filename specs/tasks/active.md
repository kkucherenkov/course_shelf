# Active tasks

## T-2026-07-14-002 — public GitHub mirror + ghcr release lane

- Created: 2026-07-14
- Owner: claude
- Spec: user decision — public mirror at github.com/kkucherenkov/course_shelf, ghcr release lane now, keep CodeQL + trufflehog on the GitHub side
- Goal: Forgejo stays the source of truth; GitHub is a read-only push mirror with its own green CI and a public release lane (ghcr.io images + GitHub Releases).
- Spec diff: none (no OpenAPI/AsyncAPI change)
- Codegen impact: no
- Sub-steps:
  - [x] pre-flight: full-history trufflehog scan (`--only-verified`) — 0 verified, 0 unverified across 12916 chunks
  - [x] `.github/workflows/ci.yml`: replace the stale pre-migration 6-job layout (it was missing `design:build` — tokens are gitignored, web typecheck/test would fail) with the consolidated `checks` job kept in lockstep with `.forgejo/workflows/ci.yml`, plus GitHub-only jobs: codegen-drift (full Flutter toolchain) and security (trufflehog pinned to v3.95.9 instead of @main, license-checker)
  - [x] `.github/workflows/e2e.yml`: rewrite to the proven Forgejo shape — compose.ci.yml production-shaped stack, Playwright executed inside `mcr.microsoft.com/playwright:v1.59.1-jammy` via `docker run --network=host` (committed baselines are jammy-captured; host-run Chromium on ubuntu-latest would drift glyph metrics). No regen path — baselines only regenerate on Forgejo
  - [x] `.github/workflows/quality.yml`: port the Storybook visual-regression nightly (same jammy container); license check stays in ci.yml's security job on the GitHub side
  - [x] `.github/workflows/release.yml`: new ghcr lane — same `v*.*.*-release` tag pattern, images to `ghcr.io/kkucherenkov/courseshelf-{backend,web}` (4 tags each), same git-cliff notes + bundle, GitHub Release via `gh release create`; GITHUB_TOKEN only, no new secrets
  - [x] `.github/workflows/codeql.yml`: kept as-is
  - [x] delete `.github/dependabot.yml` — dependabot PRs merged on a force-synced mirror get clobbered; dep updates belong on Forgejo
  - [x] README.md + README.ru.md: badges `example/course-shelf` → `kkucherenkov/course_shelf`, mirror notice added
  - [x] `.forgejo/workflows/release.yml`: stale "IMAGES live on GHCR" comment fixed (leftover from before #231)
  - [x] create the GitHub repo — public, issues/wiki/projects disabled, initial push of `main` + the inert `v0.1.0-release` tag (its tree predates the ghcr workflow)
  - [x] verify: GitHub CI green — all four workflows passed their FIRST runs (CI, CodeQL, Quality, E2E; the jammy-container recipe held on ubuntu-latest)
  - [x] ~~configure the Forgejo push mirror~~ OBSOLETE — direction flipped (see notes): GitHub is now the main repo, Forgejo is downstream
  - [ ] reverse sync GitHub → Forgejo (workflow pushing `main` + tags with a `FORGEJO_TOKEN` secret) so homelab nightlies + the LAN release lane keep triggering; until then main is dual-pushed manually
  - [ ] verify release path: cut a `v*.*.*-release` tag → both lanes publish (ghcr via GitHub, LAN registry via Forgejo — folds in the pending homelab-registry smoke test)
- Status: in-progress
- Blockers: —
- Notes:
  - PIVOT (2026-07-14, user decision): GitHub (github.com/kkucherenkov/course_shelf) is the MAIN repository; development PRs land there (first: github#1, CodeQL fixes). Forgejo remains for homelab deploy (LAN registry, Dockge) + the issues mirror. Follow-up: update CLAUDE.md/docs remote references.
  - Forgejo executes only `.forgejo/workflows/` (first-match directory) — verified empirically: the dormant `.github/` set produced zero Forgejo runs despite `on: push` triggers. The two estates never cross-trigger.
  - mirror-sync pushes are PAT-authenticated, so they DO trigger GitHub workflows (GITHUB_TOKEN-authored pushes wouldn't)
