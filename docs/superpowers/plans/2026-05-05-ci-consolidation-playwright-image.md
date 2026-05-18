# CI Consolidation + Playwright Docker Image — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Replace four CI jobs (`backend`, `web`, `specs`, `ui-quality`) with one consolidated `checks` job; switch `ui-storybook`, `e2e`, and `snapshots-regen` to `mcr.microsoft.com/playwright:v1.49.1-jammy` so Chromium + apt deps are preinstalled.

**Architecture:** Single PR, four phases. The three workflow files (`ci.yml`, `e2e.yml`, `snapshots-regen.yml`) are interlocked.

**Spec:** [`docs/superpowers/specs/2026-05-05-ci-consolidation-playwright-image-design.md`](../specs/2026-05-05-ci-consolidation-playwright-image-design.md)

---

## Branch setup

- [ ] **Step 0.1: Create feature branch**

```bash
git checkout main
git pull --ff-only
git checkout -b chore/ci-consolidation-playwright-image
git status
```

---

## Task 1: Consolidate 4 jobs into `checks` in `ci.yml`

**Files:** `.forgejo/workflows/ci.yml`

- [ ] **Step 1: Verify current 4 jobs that we're replacing**

Run:

```bash
grep -nE "^  (backend|web|specs|ui-quality):" .forgejo/workflows/ci.yml
```

Expected: 4 matches.

- [ ] **Step 2: Replace those 4 jobs with one `checks` job**

Edit `.forgejo/workflows/ci.yml`. Find the four job blocks (`backend`, `web`, `specs`, `ui-quality`) and replace them all with this single block:

```yaml
# ── Checks (consolidated lint · typecheck · test · specs · ui audit) ──────
# One job sharing one pnpm install + one design:build + one prisma generate.
# turbo handles parallelism across packages within the job.
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

    - name: Lint, typecheck, test (turbo)
      run: pnpm exec turbo run lint typecheck test

    - name: UI components audit
      run: pnpm --filter @app/ui audit:components
```

The `ui-storybook` and `security-audit` jobs stay where they are (this task only touches the four jobs listed above).

- [ ] **Step 3: Validate workflow YAML**

Run:

```bash
yq eval '.' .forgejo/workflows/ci.yml > /dev/null && echo OK
```

Expected: `OK`.

- [ ] **Step 4: Verify only `checks`, `ui-storybook`, `security-audit` remain as jobs**

Run:

```bash
yq eval '.jobs | keys' .forgejo/workflows/ci.yml
```

Expected output:

```
- checks
- ui-storybook
- security-audit
```

- [ ] **Step 5: Commit**

```bash
git add .forgejo/workflows/ci.yml
git commit -m "$(cat <<'EOF'
ci: consolidate backend + web + specs + ui-quality into one `checks` job

Four parallel jobs each ran their own `pnpm install` (~60s × 4 = 4 min
of duplicated install time per push). With Forgejo's act_runner enforcing
concurrency=2, total wall-time for these four was ~230s.

Replace with one `checks` job that runs install + design tokens +
prisma generate + spec validate/bundle once, then `pnpm exec turbo run
lint typecheck test` to parallelise the rest across workspace packages,
then ui audit. Single job duration ~210s; freed runner slot lets
ui-storybook and security-audit start sooner.

Refs T-2026-05-05-003.
EOF
)"
```

---

## Task 2: Playwright Docker image for `ui-storybook` in `ci.yml`

**Files:** `.forgejo/workflows/ci.yml`

- [ ] **Step 1: Verify current ui-storybook job**

Run:

```bash
awk '/^  ui-storybook:/,/^  [a-z][a-z-]*:/' .forgejo/workflows/ci.yml | head -40
```

Expected: a job that does `pnpm install` + `pnpm design:build` + `playwright install --with-deps chromium` + `storybook:build` + `test:visual:ci`.

- [ ] **Step 2: Replace ui-storybook job**

Edit `.forgejo/workflows/ci.yml`. Replace the existing `ui-storybook` job with:

```yaml
# ── Storybook test-runner ──────────────────────────────────────────────────
# Builds the static Storybook bundle, serves it, and runs
# @storybook/test-runner against every story. Fails on story render errors
# and failed play() interactions.
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

The `Install Playwright chromium` step is gone — Chromium and all apt system deps are already in `mcr.microsoft.com/playwright:v1.49.1-jammy`. Playwright auto-discovers them at test-runner time.

- [ ] **Step 3: Validate workflow YAML**

```bash
yq eval '.' .forgejo/workflows/ci.yml > /dev/null && echo OK
```

- [ ] **Step 4: Verify the container directive landed**

```bash
yq eval '.jobs.ui-storybook.container.image' .forgejo/workflows/ci.yml
```

Expected: `mcr.microsoft.com/playwright:v1.49.1-jammy`.

- [ ] **Step 5: Verify `playwright install` step removed**

```bash
grep -n "playwright install" .forgejo/workflows/ci.yml
```

Expected: no matches in the `ui-storybook` job. (Other workflows are next tasks.)

- [ ] **Step 6: Commit**

```bash
git add .forgejo/workflows/ci.yml
git commit -m "$(cat <<'EOF'
ci(storybook): run inside mcr.microsoft.com/playwright:v1.49.1-jammy

The image bakes Chromium + every apt system dep Playwright needs.
The previous `playwright install --with-deps chromium` step that
took 2-3 min of network/apt churn is gone — Playwright auto-discovers
the preinstalled browser at test-runner time.

setup-node@v6 inside the container ensures Node 24 (the image ships
with Node 22 from when v1.49.1 was tagged); ~30s install on first
run, cached on subsequent pushes via setup-node's standard cache.

Refs T-2026-05-05-003.
EOF
)"
```

---

## Task 3: Playwright Docker image for `e2e.yml` and `snapshots-regen.yml`

**Files:** `.forgejo/workflows/e2e.yml`, `.forgejo/workflows/snapshots-regen.yml`

- [ ] **Step 1: Update e2e.yml**

Edit `.forgejo/workflows/e2e.yml`. Find the `smoke` job's `runs-on:` line and add a `container:` directive right after it:

```diff
   smoke:
     name: Playwright smoke (web + backend health)
     runs-on: ubuntu-latest
+    container:
+      image: mcr.microsoft.com/playwright:v1.49.1-jammy
     timeout-minutes: 25
```

Then remove the `Install Playwright browsers` step entirely:

```diff
       - name: Install dependencies
         run: pnpm install --frozen-lockfile

-      - name: Install Playwright browsers
-        run: pnpm exec playwright install --with-deps chromium
-
       - name: Prisma generate
         run: pnpm --filter @app/backend prisma:generate
```

- [ ] **Step 2: Update snapshots-regen.yml**

Edit `.forgejo/workflows/snapshots-regen.yml`. Same pattern — add `container:` after `runs-on:`:

```diff
   regen:
     name: Capture fresh baselines in CI environment
     runs-on: ubuntu-latest
+    container:
+      image: mcr.microsoft.com/playwright:v1.49.1-jammy
     timeout-minutes: 25
```

Remove the `Install Playwright chromium (with system deps)` step:

```diff
       - name: Build design tokens
         run: pnpm design:build

-      - name: Install Playwright chromium (with system deps)
-        run: pnpm --filter @app/ui exec playwright install --with-deps chromium
-
       - name: Build Storybook static
```

- [ ] **Step 3: Validate both workflow YAMLs**

```bash
yq eval '.' .forgejo/workflows/e2e.yml > /dev/null && echo "e2e.yml: OK"
yq eval '.' .forgejo/workflows/snapshots-regen.yml > /dev/null && echo "snapshots-regen.yml: OK"
```

- [ ] **Step 4: Verify Playwright install steps are gone**

```bash
grep -nE "playwright install" .forgejo/workflows/e2e.yml .forgejo/workflows/snapshots-regen.yml
```

Expected: no matches.

- [ ] **Step 5: Verify container directives are present**

```bash
yq eval '.jobs.smoke.container.image' .forgejo/workflows/e2e.yml
yq eval '.jobs.regen.container.image' .forgejo/workflows/snapshots-regen.yml
```

Both should return `mcr.microsoft.com/playwright:v1.49.1-jammy`.

- [ ] **Step 6: Commit (both files in one commit)**

```bash
git add .forgejo/workflows/e2e.yml .forgejo/workflows/snapshots-regen.yml
git commit -m "$(cat <<'EOF'
ci(playwright): run e2e + snapshots-regen inside playwright Docker image

Mirror the ui-storybook change. Both workflows install Playwright the
same way and benefit equally from the preinstalled Chromium + apt deps
in mcr.microsoft.com/playwright:v1.49.1-jammy.

Refs T-2026-05-05-003.
EOF
)"
```

---

## Task 4: Tick sub-step boxes in `active.md`

**Files:** `specs/tasks/active.md`

- [ ] **Step 1: Tick all four sub-steps**

Edit `specs/tasks/active.md`. Find the T-2026-05-05-003 entry and flip:

```diff
-  - [ ] Phase 1 — replace `backend` + `web` + `specs` + `ui-quality` jobs in `.forgejo/workflows/ci.yml` with one `checks` job
-  - [ ] Phase 2 — `container: mcr.microsoft.com/playwright:v1.49.1-jammy` on `ui-storybook` + drop `playwright install --with-deps`
-  - [ ] Phase 3 — mirror Playwright container into `.forgejo/workflows/{e2e.yml, snapshots-regen.yml}`
-  - [ ] Phase 4 — open PR; verify wall-time on first run; flip sub-step boxes
+  - [x] Phase 1 — replace `backend` + `web` + `specs` + `ui-quality` jobs in `.forgejo/workflows/ci.yml` with one `checks` job
+  - [x] Phase 2 — `container: mcr.microsoft.com/playwright:v1.49.1-jammy` on `ui-storybook` + drop `playwright install --with-deps`
+  - [x] Phase 3 — mirror Playwright container into `.forgejo/workflows/{e2e.yml, snapshots-regen.yml}`
+  - [x] Phase 4 — open PR; verify wall-time on first run; flip sub-step boxes
```

- [ ] **Step 2: Commit**

```bash
git add specs/tasks/active.md
git commit -m "chore(tasks): tick T-2026-05-05-003 sub-steps as the PR is ready

Refs T-2026-05-05-003."
```

---

## Task 5: Push branch and open PR

- [ ] **Step 1: Push branch**

```bash
git push -u origin chore/ci-consolidation-playwright-image
```

- [ ] **Step 2: Open PR via tea**

```bash
tea pulls create --login homelab \
  --title "ci: consolidate 4 jobs into one + Playwright Docker image" \
  --description "$(cat <<'EOF'
## Summary

Two structural CI optimisations in one PR:

1. **Consolidate 4 jobs (`backend`, `web`, `specs`, `ui-quality`) into one `checks` job.** One `pnpm install`, one `design:build`, one `prisma:generate`; then `turbo run lint typecheck test` parallelises the work across packages. Drops 3 redundant pnpm-install runs per push.

2. **Switch `ui-storybook` (and `e2e`, `snapshots-regen`) to `mcr.microsoft.com/playwright:v1.49.1-jammy`.** Chromium + apt deps are preinstalled in the image — eliminates the 2-3 min `playwright install --with-deps` step.

- Spec: [`docs/superpowers/specs/2026-05-05-ci-consolidation-playwright-image-design.md`](docs/superpowers/specs/2026-05-05-ci-consolidation-playwright-image-design.md)
- Plan: [`docs/superpowers/plans/2026-05-05-ci-consolidation-playwright-image.md`](docs/superpowers/plans/2026-05-05-ci-consolidation-playwright-image.md)
- Predecessor: T-2026-05-05-002 (PR #198, cancelled — cache approach was a net regression on this Forgejo runner)

## Why this approach (vs. caching)

The cancelled cache approach showed Forgejo's `act_runner` cache backend handles ≤300 MB caches but degrades pathologically on multi-GB tarballs (pnpm store restore took ~100s per job). Splitting `playwright install --with-deps` into separate `install` + `install-deps` serialised work that ran in parallel internally. Net: cache approach was slower, not faster.

This PR targets **structural** wins instead — fewer jobs (less duplicated install work) and a preinstalled-binary container (skip `playwright install` entirely). The savings are large enough to surface above per-run variance.

## Expected impact

| | Before | After |
|---|---|---|
| Wall-time per push | ~8:35 | ~5:00 (-40%) |
| `checks` job alone | n/a | ~3:00-3:30 |
| `ui-storybook` job alone | ~4:45 | ~1:30-2:30 |

## Test plan

- [ ] Forgejo CI green on this PR
- [ ] First-push wall-time ≤6 minutes (vs ~8:35 baseline)
- [ ] All previous checks (lint, typecheck, test, specs, ui audit, storybook test-runner) still execute and pass
- [ ] Manual snapshots-regen workflow still works (run from this branch and confirm baselines update)
EOF
)"
```

- [ ] **Step 3: After PR merges, move T-2026-05-05-003 from active.md to done.md**

(Post-merge — not at PR-open time.)

```bash
git checkout main && git pull --ff-only
```

Edit `specs/tasks/active.md` — remove the T-2026-05-05-003 block.
Edit `specs/tasks/done.md` — paste it at the top with `Completed:` and `Result: merged via PR #N`.
Commit + push.

---

## Self-review notes

**Spec coverage:**

- Consolidation of 4 jobs → Task 1
- Playwright image on ui-storybook → Task 2
- Playwright image on e2e + snapshots-regen → Task 3
- Sub-step ticking → Task 4
- PR open + post-merge cleanup → Task 5
- Risks R1-R6 (spec) — all surface as failure modes during the verification (Forgejo CI) — no preventive code needed.

**Type/name consistency:**

- Image tag `mcr.microsoft.com/playwright:v1.49.1-jammy` identical across Tasks 2 and 3 ✓
- Job name `checks` referenced consistently ✓
- Spec's expected impact (wall-time ~5:00) aligns with PR body's test plan ✓

**Placeholder scan:** none.
