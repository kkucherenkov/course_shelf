# CI Cache: Playwright + Design Tokens — Design

**Date:** 2026-05-05
**Status:** Approved (brainstorm)
**Owner:** claude
**Related task:** specs/tasks/active.md → T-2026-05-05-002
**Decomposition context:** Refined `#1` from the earlier roadmap (`#2 → #1 → #3`). The original framing was "consolidate 6 parallel pnpm installs"; diagnostic data (run #436, full success on commit `c7cbad9`) showed the actual bottleneck is the `ui-storybook` job, and the act_runner enforces concurrency 2 — so the install-consolidation premise was wrong. This spec is the narrowed `#1'`: cache the two artefacts that genuinely dominate cost in the storybook job.

## Diagnostic baseline (run 436)

Wall-clock breakdown of one full CI run on commit `c7cbad9`:

```
12:24:02 → 12:26:03  Backend         2:01
12:24:02 → 12:26:36  Web             2:34
12:26:04 → 12:27:20  Specs           1:16   (started after Backend)
12:26:38 → 12:27:42  UI audit        1:04   (started after Web)
12:27:22 → 12:32:07  UI Storybook    4:45   (started after Specs)
12:27:44 → 12:28:59  Security audit  1:15
```

Wall-time end-to-end: **~8 minutes**. The act_runner runs at most 2 concurrent jobs, so jobs queue in three batches. The third batch (`UI Storybook` + `Security audit`) is dominated by `UI Storybook` at 4:45 — and that 4:45 includes ~30-45s downloading the Chromium browser binary plus ~10s rebuilding design tokens that two earlier jobs already produced.

## Goal

Reduce CI wall-time on every push by caching:

1. **Playwright Chromium browser binary** in `~/.cache/ms-playwright/` (used by `ui-storybook`, `e2e`, `snapshots-regen`).
2. **Design-token generated outputs** (the five files produced by `pnpm design:build`) shared across `web`, `ui-quality`, and `ui-storybook` jobs.

No prepare-job, no artifact upload/download, no architectural workflow changes. Targeted `actions/cache@v4` steps only.

## Why this scope, not the original consolidation

- **Wall-time math:** With concurrency=2, even fully eliminating `pnpm install` from 5 of 6 jobs only saves ~30-40s wall-time. The expensive parts are downstream of install, not install itself.
- **Real bottleneck is `ui-storybook`** (4:45 vs all others ≤2:34). Every minute trimmed there shows up directly in CI feedback latency.
- **Risk gradient:** caching is additive; if a key never matches, behaviour reverts to today's. A `prepare`-job artefact pattern would touch every job structurally.

## Non-goals

- Changing the number or boundaries of CI jobs.
- Introducing a `prepare` job or shared `node_modules` artifact (rejected as `#1''`).
- Storybook test sharding or runner-concurrency changes (rejected as `#1'''` — out of scope).
- Touching `Trivy` or `release.yml` workflows (different cost profile).
- Configuring a turborepo remote cache server.

## Architecture changes

| Surface | Before | After |
|---|---|---|
| `~/.cache/ms-playwright/` | (re)downloaded on every Playwright-using job | `actions/cache@v4` keyed on `pnpm-lock.yaml` hash |
| Chromium browser install step | `playwright install --with-deps chromium` (download + apt) | conditional `playwright install chromium` (binary only, on cache miss) + always `playwright install-deps chromium` (apt only) |
| `pnpm design:build` step in `web`, `ui-quality`, `ui-storybook` jobs | Always runs | `actions/cache@v4` keyed on hash of `packages/design-tokens/src/**` + `packages/design-tokens/scripts/**` + `specs/design/tokens/**`; build skipped on cache hit |

## Playwright cache — applied pattern

The same three steps replace each existing `playwright install --with-deps chromium` call.

```yaml
- name: Cache Playwright browsers
  id: pw-cache
  uses: actions/cache@v4
  with:
    path: ~/.cache/ms-playwright
    key: playwright-${{ runner.os }}-${{ hashFiles('pnpm-lock.yaml') }}
    restore-keys: |
      playwright-${{ runner.os }}-

- name: Install Playwright Chromium (binary only)
  if: steps.pw-cache.outputs.cache-hit != 'true'
  run: pnpm --filter @app/ui exec playwright install chromium

- name: Install Playwright OS deps
  run: pnpm --filter @app/ui exec playwright install-deps chromium
```

**Why this exact split:**

- `playwright install chromium` (no `--with-deps`) downloads only the Chromium binary into `~/.cache/ms-playwright/`. That cache directory is what we persist.
- `playwright install-deps chromium` runs `apt-get install` for system libs (libnss3, libatk1.0-0, etc.). We always run it because the runner's container is ephemeral — apt state does not persist between jobs. On a warm apt index this takes ~5-10s; we cannot meaningfully cache it (caching `/var/lib/dpkg/` is fragile).
- `restore-keys` provides a fallback to any older Playwright cache for the same OS — gives a partial warm-up before lockfile-pinned version mismatch makes the binary unusable. Worst case: stale binary present, `playwright install chromium` re-downloads — net behaviour identical to today.

The two non-`ci.yml` workflows (`e2e.yml`, `snapshots-regen.yml`) use `pnpm exec playwright` (without `--filter @app/ui`) — the cache pattern stays identical except for the install command.

## Design-token cache — applied pattern

```yaml
- name: Cache design tokens
  id: tokens-cache
  uses: actions/cache@v4
  with:
    path: |
      apps/web/app/assets/css/tokens.generated.css
      apps/web/app/design-tokens.generated.ts
      packages/ui/src/tokens.generated.css
      packages/ui/src/design-tokens.generated.ts
      packages/ui_flutter/lib/src/theme/tokens.g.dart
    key: design-tokens-${{ runner.os }}-${{ hashFiles('packages/design-tokens/src/**', 'packages/design-tokens/scripts/**', 'specs/design/tokens/**') }}

- name: Build design tokens
  if: steps.tokens-cache.outputs.cache-hit != 'true'
  run: pnpm design:build
  working-directory: .
```

The five output paths are taken from `turbo.json`'s declared outputs for `@app/design-tokens#build`. Hash key includes both `src/` and `scripts/` (the build script itself can change semantics) and the upstream design-token JSON in `specs/design/tokens/**`.

**Cache lifecycle within a single CI run:** with concurrency=2, the first job that runs design-tokens (typically `web` in batch 1) populates the cache mid-run. The next jobs (`ui-quality` in batch 2, `ui-storybook` in batch 3) hit the cache. `actions/cache` writes happen at job end on cache miss; subsequent same-key reads in the same run pick up the saved entry.

## Touched workflows

| File | Job(s) modified | What's added |
|---|---|---|
| `.forgejo/workflows/ci.yml` | `web`, `ui-quality`, `ui-storybook` | Design tokens cache (3 jobs); Playwright cache (1 job — `ui-storybook`) |
| `.forgejo/workflows/snapshots-regen.yml` | (single job) | Playwright cache |
| `.forgejo/workflows/e2e.yml` | (single job) | Playwright cache |

`Trivy`, `release.yml`, `Backend`, `Specs`, `Security audit` — untouched. They neither install Playwright nor run `design:build`.

## Expected impact

| Metric | Today | After |
|---|---|---|
| Wall-time per CI run | ~8:00 | ~7:15 (-45s, ~9%) |
| `ui-storybook` job duration | 4:45 | ~4:00 (-45s) |
| Aggregate runner CPU per run | ~14 min | ~13:15 (-45s) |
| Cache miss behaviour | n/a | Identical to today |
| Workflow YAML diff | — | +5 step blocks across 3 files |

The win is modest by design — this is a low-risk targeted optimisation, not a CI rearchitecture.

## Risks and mitigations

- **R1: Forgejo cache backend size limits.** Default `actions/cache` storage is bounded (typically 5 GB per repository). One Playwright Chromium cache is ~150 MB; one design-tokens cache is ~tens of KB. With ~10 active branches, total ≈ 1.5 GB. Well under any limit. → Mitigation: none required.

- **R2: `playwright install-deps` requires `sudo`.** The current workflow already runs this command successfully on the act_runner, so the runner image has working `apt-get` and either runs as root or has passwordless sudo. We don't change this behaviour. → Mitigation: none required.

- **R3: design-tokens cache invalidation gap.** If someone changes the `@app/design-tokens` *build* script in a way that produces different output for the same `src/` inputs, the cache won't invalidate. → Mitigation: include `packages/design-tokens/scripts/**` in the hash key (already in the spec above).

- **R4: `actions/cache` cross-branch reuse.** On a `pull_request` event, the cache normally falls back to the base branch's cache when the PR branch has no own. This is what we want — it maximises hit rate without manual intervention.

- **R5: Cache poisoning by a malicious commit.** A bad commit could cache a corrupted Chromium binary or wrong design-tokens output, then base-branch consumers pick it up. → Mitigation: cache key is hash-based, so a corruption-altering commit would produce a different key. The standard `actions/cache` semantics are sufficient; no extra signing.

## Implementation phases

1. **Phase 1 — Playwright cache in `ci.yml` (`ui-storybook` job).** Highest-impact single change; gets a measurable timing improvement on the next push.
2. **Phase 2 — Design tokens cache in `ci.yml` (`web`, `ui-quality`, `ui-storybook`).** Three near-identical step blocks.
3. **Phase 3 — Playwright cache in `snapshots-regen.yml` and `e2e.yml`.** Pattern-match the cached install across the two remaining workflows.

All three phases are independent and atomic. Single PR.

**Verification:** push the PR; observe in the Forgejo Actions UI that:
- The first run lists "Cache miss" for both keys (expected; first time).
- Subsequent runs (rebases / new commits without dep or token changes) show "Cache hit" and skip the conditional install/build steps.
- `ui-storybook` job timing drops by ≥30s in the cache-hit case.
