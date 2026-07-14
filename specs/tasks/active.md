# Active tasks

## T-2026-07-14-003 — triage + fix first CodeQL findings (10 alerts)

- Created: 2026-07-14
- Owner: claude
- Spec: https://github.com/kkucherenkov/course_shelf/security/code-scanning (first CodeQL run after the mirror went live)
- Goal: every alert either fixed at the root or dismissed with a recorded justification.
- Spec diff: none (no OpenAPI/AsyncAPI change)
- Codegen impact: no
- Sub-steps:
  - [x] #3–#6 (high, `js/insecure-temporary-file`): streaming spec fixtures moved from pid-predictable names in shared `os.tmpdir()` into a `mkdtempSync` dir (mode 0700, unpredictable name); recursive cleanup also covers the `.cache.vtt` sibling — 21/21 green
  - [x] #2/#9 (medium, shell-injection family, `contract-test.ts`): `execSync(string)` → `spawnSync('docker', args)` — env-provided base URL is a single argv entry, never shell-parsed
  - [x] #10 (medium, `js/indirect-command-line-injection`, `diff.ts`): `execSync(\`git show ${base}:…\`)`→`spawnSync('git', ['show', …])`via a`gitShow`helper;`--base` CLI value never shell-parsed; verified (script runs, exits 2 on missing oasdiff as designed)
  - [x] #1 (high, `js/insecure-helmet-configuration`): dismissed — flagged branch is the dev-only helmet config; production branch three lines above ships the full CSP; CSP stays off in dev for Vite HMR/Storybook (documented in main.ts)
  - [x] #7/#8 (medium, `js/file-access-to-http`): dismissed — uploading local roadmap-card content to the Forgejo issue API is the seed script's purpose
- Status: in-review
- Blockers: —
- Notes:
  - process pivot: GitHub (github.com/kkucherenkov/course_shelf) is now the MAIN repository — this PR is the first to land via GitHub. Follow-ups: reverse the sync direction (GitHub → Forgejo) so the homelab release lane keeps triggering, update CLAUDE.md/docs references to the primary remote

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
  - [ ] create the GitHub repo + configure the Forgejo push mirror (PAT with contents:write)
  - [ ] verify: mirror sync arrives, GitHub CI green on mirrored `main`
  - [ ] verify release path: cut a `v*.*.*-release` tag → both lanes publish (folds in the pending homelab-registry smoke test)
- Status: in-progress
- Blockers: —
- Notes:
  - Forgejo executes only `.forgejo/workflows/` (first-match directory) — verified empirically: the dormant `.github/` set produced zero Forgejo runs despite `on: push` triggers. The two estates never cross-trigger.
  - mirror-sync pushes are PAT-authenticated, so they DO trigger GitHub workflows (GITHUB_TOKEN-authored pushes wouldn't)
