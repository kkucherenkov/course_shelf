# CI Consolidation + Playwright Docker Image — Design

**Date:** 2026-05-05
**Status:** Approved (brainstorm via conversation)
**Owner:** claude
**Related task:** specs/tasks/active.md → T-2026-05-05-003
**Predecessor:** [T-2026-05-05-002 (cancelled)](../../specs/tasks/done.md) — caching approach was a net regression on this Forgejo runner. Pivot to a structurally different optimisation.

## Goal

Cut CI wall-time per push from ~8 min to ~5 min (-37%) by:

1. **Consolidating four parallel jobs (`backend`, `web`, `specs`, `ui-quality`) into one `checks` job** that runs `pnpm install` once and uses turbo to parallelise lint/typecheck/test across the workspace.
2. **Switching `ui-storybook` to `mcr.microsoft.com/playwright` Docker image** so Chromium binary + apt system deps are preinstalled — eliminates ~2-3 min of per-run setup overhead.

No caches, no per-step magic. Pure structural simplification.

## Diagnostic baseline (run 436, commit c7cbad9)

```
12:24:02 → 12:26:03  Backend         2:01      ─┐
12:24:02 → 12:26:36  Web             2:34       │  current 4 jobs to consolidate
12:26:04 → 12:27:20  Specs           1:16       │  (each runs its own pnpm install)
12:26:38 → 12:27:42  UI audit        1:04      ─┘
12:27:22 → 12:32:07  UI Storybook    4:45        │ 2-3 min of that = playwright install --with-deps
12:27:44 → 12:28:59  Security audit  1:15
```

`act_runner` enforces concurrency=2. Critical path:
- Batch 1: backend (121s) + web (154s), wall = 154s
- Batch 2: specs (76s) + ui-audit (64s), wall = 76s
- Batch 3: ui-storybook (285s) + security (75s), wall = 285s
- **Total wall ≈ 8:35.**

## Why this approach (vs. caching from T-2026-05-05-002)

The cancelled cache approach showed:
- Forgejo `act_runner` cache backend handles small caches (≤300 MB) but degrades pathologically on multi-GB tarballs (pnpm store restore took ~100s per job).
- Splitting `playwright install --with-deps` into `install` + `install-deps` serialised work that ran in parallel internally — net regression even on cache hits.
- Per-run variance on this self-hosted runner is too high (242-427s for nominally identical UI Storybook configs) to validate sub-minute optimisations empirically.

This spec instead targets **structural** wins:
- Job consolidation removes 3 redundant `pnpm install` runs per push (fixed-cost ~60s × 3 saved aggregate — independent of cache backend behaviour).
- Playwright Docker image removes the entire `playwright install --with-deps` step (~2 min saved on UI Storybook critical path) — independent of network speed, registry latency, or apt mirror state.

The wins are large enough that runner noise can't hide them.

## Expected impact

```
slot1: checks (~210s) ─→ security (75s)        (285s total)
slot2: ui-storybook (~120s)                     (120s total)
                                                 wall ≈ 285s = 4:45
```

Compared to baseline ~8:35: **-3:50 (-45%)**. Storybook becomes the bottleneck only because its image-pull on first run + Storybook test-runner duration are still meaningful — but it's already much shorter than today's 4:45.

After image-pull is warm on the runner host, ui-storybook should drop to ~90s on subsequent runs.

## Non-goals

- Runner concurrency tuning (still concurrency=2 in this spec).
- Cache mechanisms of any kind.
- Sharding ui-storybook test-runner across multiple jobs.
- Touching `release.yml`, `trivy.yml` (not in critical path).

## Architecture changes

### `.forgejo/workflows/ci.yml`

**Removed jobs:** `backend`, `web`, `specs`, `ui-quality` (4 → 1).

**New job: `checks`** — runs all four concerns in one container, sharing one install + one design-tokens build.

```yaml
checks:
  name: Checks (lint · typecheck · test · specs · ui audit)
  runs-on: ubuntu-latest
  timeout-minutes: 15
  steps:
    - uses: actions/checkout@v6
    - uses: pnpm/action-setup@v6
    - uses: actions/setup-node@v6
      with:
        node-version: ${{ env.NODE_VERSION }}
        cache: pnpm

    - name: Install dependencies
      run: pnpm install --frozen-lockfile

    - name: Prisma generate
      run: pnpm --filter @app/backend prisma:generate

    - name: Build design tokens
      run: pnpm design:build

    - name: Validate + bundle specs
      run: pnpm spec:validate && pnpm spec:bundle

    - name: Lint, typecheck, test (turbo run)
      run: turbo run lint typecheck test

    - name: UI components audit
      run: pnpm --filter @app/ui audit:components
```

**`turbo run lint typecheck test`** invokes those tasks across every workspace package (backend, web, packages/*) honoring dependency graph from `turbo.json`. Turbo parallelises naturally — backend's vitest runs alongside web's vitest, etc.

**Modified job: `ui-storybook`** — switches to Playwright Docker image. The image bakes Chromium + all apt system deps for the Playwright version it ships with.

```yaml
ui-storybook:
  name: UI Storybook test-runner
  runs-on: ubuntu-latest
  container:
    image: mcr.microsoft.com/playwright:v1.49.1-jammy
  timeout-minutes: 15
  steps:
    - uses: actions/checkout@v6
    - uses: pnpm/action-setup@v6
    - uses: actions/setup-node@v6
      with:
        node-version: ${{ env.NODE_VERSION }}
        cache: pnpm

    - name: Install dependencies
      run: pnpm install --frozen-lockfile

    - name: Build design tokens
      run: pnpm design:build

    - name: Build Storybook static
      env:
        STORYBOOK_A11Y_LEVEL: todo
      run: pnpm --filter @app/ui storybook:build

    - name: Run Storybook test-runner
      run: pnpm --filter @app/ui test:visual:ci
```

The `playwright install --with-deps chromium` step is **gone entirely** — Chromium and apt deps are baked into `mcr.microsoft.com/playwright:v1.49.1-jammy`. Inside the container, Playwright auto-discovers the preinstalled Chromium.

`actions/setup-node@v6` runs inside the container to ensure Node 24 (the image bundles whatever Node was current when `:v1.49.1-jammy` was tagged — likely 22; we explicitly install our pinned version).

**Unchanged jobs:** `security-audit` (small, independent — keeps its own job).

### `.forgejo/workflows/e2e.yml`

Apply the same Playwright Docker image trick. `e2e.yml` runs Playwright smoke tests against the full docker stack — needs Chromium too. The `--with-deps` install step (~2 min) becomes a no-op pull-once container.

### `.forgejo/workflows/snapshots-regen.yml`

Same Playwright image swap. This is a manual workflow that regenerates Storybook visual baselines — same Chromium + apt deps requirement.

## Files modified

| File | Change |
|---|---|
| `.forgejo/workflows/ci.yml` | Drop `backend`, `web`, `specs`, `ui-quality` jobs. Add `checks` job. Modify `ui-storybook` to use `container:` directive. `security-audit` unchanged. |
| `.forgejo/workflows/e2e.yml` | Add `container:` directive; drop `playwright install --with-deps` step. |
| `.forgejo/workflows/snapshots-regen.yml` | Same as e2e. |
| `specs/tasks/active.md` | Add T-2026-05-05-003 entry. |

`docker compose`, application code, design tokens — untouched.

## Playwright image version pinning

`packages/ui/package.json` pins `playwright: ^1.49.0` (current resolved: `1.49.1`).
We pin the Docker image to the exact same version: `mcr.microsoft.com/playwright:v1.49.1-jammy`.

If the npm Playwright version is bumped later, the image tag must be bumped in lock-step (same PR). A small CI lint is a possible follow-up; for now, document it.

`-jammy` (Ubuntu 22.04) chosen over `-noble` (24.04) because v1.49 series ships against jammy. Switching to noble is a future tag bump.

## Turbo behaviour assumptions

`turbo.json` already declares:
- `lint` → depends on `@app/specs#codegen` + `@app/design-tokens#build`
- `test` → depends on `^build` + the same
- `typecheck` → same

When `checks` job runs `turbo run lint typecheck test` AFTER explicit `design:build` + `spec:validate`/`bundle` steps, turbo:
1. Sees codegen + design-tokens already up-to-date (their outputs exist on disk).
2. Skips re-running their `^build` deps for those tasks.
3. Parallelises lint/typecheck/test across packages within concurrency limits of the runner host (typically 2-4 workers).

If turbo decides to rebuild design-tokens or specs (because of stale `node_modules/.turbo` cache state in fresh containers), the impact is small (~10s) — turbo's local cache is gitignored and ephemeral on each runner job, so the only real save is from explicit pre-steps.

## Verification plan

Numbers to capture from the first PR run + a follow-up commit:

| Metric | Baseline | Target |
|---|---|---|
| Total wall-time per push | 8:35 | 5:00-5:30 (-40%) |
| `checks` job duration | n/a | 3:00-3:30 |
| `ui-storybook` duration | 4:45 | 1:30-2:30 |
| `security-audit` duration | 1:15 | unchanged |

Verification on first run = "still green and at least the wall-time was cut to under 6 min". Variance is high; we're targeting wins much larger than the variance.

## Risks and mitigations

- **R1: `container:` directive support on act_runner.** Forgejo's act_runner supports it (it's a documented Forgejo Actions feature, mirroring GitHub Actions behaviour). If somehow it doesn't work on this homelab runner, the symptom is a clear job failure — fail fast, not silent regression.
- **R2: Node version mismatch.** Microsoft Playwright image `v1.49.1-jammy` ships with Node 22; we use Node 24. Mitigation: `actions/setup-node@v6` inside the container installs Node 24 alongside the image's Node — adds ~30s but keeps environment consistent with non-Playwright jobs.
- **R3: First-run image pull.** `mcr.microsoft.com/playwright:v1.49.1-jammy` is ~1.5 GB. First pull from runner takes ~30-60s; subsequent jobs hit local image cache. Net: small one-time cost, then free.
- **R4: turbo parallelism slower than separate jobs.** Multiple jobs in concurrency=2 give 2× parallelism across the slots. One job with turbo gives parallelism only within turbo's worker pool (2-4 cores on the host). For lint/typecheck (10-30s each), the difference is negligible. For backend test:coverage (~60-90s), it dominates the consolidated job's wall-time — exactly the same as baseline backend job. Consolidation doesn't slow it down.
- **R5: Storybook test-runner inside container behaves differently.** The image is the same Linux base used today (jammy/22.04); Chromium glyph rendering should match existing baselines. If it doesn't, the visual-regression test-runner will fail loudly on the first PR run — verifiable, not silent. `snapshots-regen.yml` regenerates baselines from the same container, so any diff converges.
- **R6: Failure granularity.** When `checks` job fails, the operator can't see at a glance whether it was lint, typecheck, or test that broke. Mitigation: turbo's per-task output lines are clear in the log; the failing task is named. Acceptable trade-off.

## Implementation phases

1. **Phase 1 — `checks` job in ci.yml.** Replace 4 jobs with the new consolidated job. Verify: a push runs the new `checks` job; backend tests and lints all execute and pass.
2. **Phase 2 — Playwright container in ci.yml `ui-storybook`.** Add `container:` directive; drop `playwright install --with-deps`. Verify: storybook test-runner runs against the preinstalled Chromium and passes.
3. **Phase 3 — Playwright container in `e2e.yml` and `snapshots-regen.yml`.** Mirror the same swap. Verify: nightly e2e and manual snapshot regen still work.
4. **Phase 4 — `active.md` tick + PR open.**

Single PR. The three workflow changes are interlocked (all of them must pass for the PR to be green) and small enough to land together.
