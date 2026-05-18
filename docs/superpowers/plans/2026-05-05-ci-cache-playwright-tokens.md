# CI Cache (Playwright + Design Tokens) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `actions/cache@v4` around the Playwright Chromium binary and the `pnpm design:build` outputs in three Forgejo workflows. Cut ~45s off CI wall-time per push by skipping ~30-45s of Chromium download in the `ui-storybook` job and ~10s of redundant token rebuild in three jobs.

**Architecture:** Targeted cache steps only — no prepare-job, no shared `node_modules` artifact, no architectural workflow changes. Cache keys are content-hash based: Playwright key = hash of `pnpm-lock.yaml`; design-tokens key = hash of `packages/design-tokens/{src,scripts}/**` + `specs/design/tokens/**`. Cache miss falls back to today's behaviour exactly.

**Tech Stack:** Forgejo Actions, `actions/cache@v4`, Playwright `^1.49.0`, pnpm 10, turborepo (already configures `@app/design-tokens#build` outputs).

**Spec:** [`docs/superpowers/specs/2026-05-05-ci-cache-playwright-tokens-design.md`](../specs/2026-05-05-ci-cache-playwright-tokens-design.md)

---

## File Structure

### Modified

| Path                                     | Responsibility                                              | Change                                                                                                                                                                                  |
| ---------------------------------------- | ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.forgejo/workflows/ci.yml`              | Per-PR / per-push CI (6 jobs)                               | Add design-tokens cache to `web`, `ui-quality`, `ui-storybook`. Replace single Playwright install step in `ui-storybook` with cache + conditional download + always-run `install-deps`. |
| `.forgejo/workflows/snapshots-regen.yml` | Manual workflow that regenerates Storybook visual baselines | Same Playwright cache pattern as `ui-storybook`                                                                                                                                         |
| `.forgejo/workflows/e2e.yml`             | Nightly + manual Playwright smoke                           | Same Playwright cache pattern (uses `pnpm exec playwright`, no `--filter @app/ui`)                                                                                                      |
| `specs/tasks/active.md`                  | Project task stack                                          | Tick T-2026-05-05-002 sub-step boxes as work lands                                                                                                                                      |

### Untouched

| Path                                                                  | Why                                                                                                                                                        |
| --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.forgejo/workflows/release.yml`                                      | Doesn't run Playwright; doesn't need design-tokens (release only builds backend + web Dockerfiles, which build their own tokens during the docker context) |
| `.forgejo/workflows/trivy.yml`                                        | Static security scan — no Playwright, no tokens                                                                                                            |
| `.forgejo/workflows/ci.yml` jobs `backend`, `specs`, `security-audit` | Don't run Playwright, don't run `design:build`                                                                                                             |

---

## Branch setup (do this once before Task 1)

- [ ] **Step 0.1: Create feature branch**

Run:

```bash
git checkout main
git pull --ff-only
git checkout -b chore/ci-cache-playwright-tokens
git status
```

Expected: clean tree on the new branch.

---

## Task 1: Playwright cache in `ci.yml` (`ui-storybook` job)

**Files:**

- Modify: `.forgejo/workflows/ci.yml` (lines around the existing "Install Playwright chromium" step in `ui-storybook` job)

- [ ] **Step 1: Verify current state**

Run:

```bash
grep -n "Install Playwright chromium" .forgejo/workflows/ci.yml
```

Expected: one match, around line 164:

```
164:      - name: Install Playwright chromium
165:        run: pnpm --filter @app/ui exec playwright install --with-deps chromium
```

Also confirm the `ui-storybook` job structure with:

```bash
awk '/^  ui-storybook:/,/^  [a-z]/' .forgejo/workflows/ci.yml | head -40
```

- [ ] **Step 2: Replace the single install step with cache + conditional install + install-deps**

Edit `.forgejo/workflows/ci.yml`. Locate this block in the `ui-storybook` job:

```yaml
- name: Install Playwright chromium
  run: pnpm --filter @app/ui exec playwright install --with-deps chromium
```

Replace with:

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

Indentation: the leading 6 spaces must match the surrounding `- name:` blocks in this job.

- [ ] **Step 3: Validate workflow YAML**

Run:

```bash
python3 -c "import yaml; yaml.safe_load(open('.forgejo/workflows/ci.yml')); print('OK')"
```

Expected: `OK`. Any YAML error fails this step.

- [ ] **Step 4: Verify the new step structure**

Run:

```bash
awk '/^  ui-storybook:/,/^  [a-z][a-z-]*:/' .forgejo/workflows/ci.yml | grep -E "name:|if:|playwright" | head -20
```

Expected output contains, in order:

```
- name: Cache Playwright browsers
- name: Install Playwright Chromium (binary only)
        if: steps.pw-cache.outputs.cache-hit != 'true'
        run: pnpm --filter @app/ui exec playwright install chromium
- name: Install Playwright OS deps
        run: pnpm --filter @app/ui exec playwright install-deps chromium
```

The single `Install Playwright chromium` step must NOT appear anymore.

- [ ] **Step 5: Commit**

```bash
git add .forgejo/workflows/ci.yml
git commit -m "$(cat <<'EOF'
ci(storybook): cache Playwright Chromium binary

Persist ~/.cache/ms-playwright across runs keyed on pnpm-lock.yaml
hash. Split the previous "playwright install --with-deps chromium"
into a conditional binary download (skipped on cache hit) + an
always-run install-deps for apt packages (cheap on a warm runner;
not cacheable since the runner container is ephemeral).

Saves ~30-45s on the ui-storybook job per cache hit. Cache miss
behaviour matches today's (full --with-deps install).

Refs T-2026-05-05-002.
EOF
)"
```

---

## Task 2: Design-tokens cache in `ci.yml` (`web`, `ui-quality`, `ui-storybook` jobs)

**Files:**

- Modify: `.forgejo/workflows/ci.yml` (three jobs, identical 11-line block inserted before each `pnpm design:build` step)

The block to insert is the same in all three jobs. The `pnpm design:build` step itself becomes conditional.

- [ ] **Step 1: Verify the three current `Build design tokens` step locations**

Run:

```bash
grep -n "Build design tokens" .forgejo/workflows/ci.yml
```

Expected: three matches — one per job (`web`, `ui-quality`, `ui-storybook`).

- [ ] **Step 2: Replace the `web` job's `Build design tokens` block**

In the `web` job, locate:

```yaml
# design-tokens.generated.{ts,css} are gitignored — generated by
# `pnpm design:build`. Without them, lint/typecheck see the
# designTokens import as `error type` and fail with no-unsafe-*.
- name: Build design tokens
  run: pnpm design:build
  working-directory: .
```

Replace with:

```yaml
# design-tokens.generated.{ts,css} are gitignored — generated by
# `pnpm design:build`. Without them, lint/typecheck see the
# designTokens import as `error type` and fail with no-unsafe-*.
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

- [ ] **Step 3: Replace the `ui-quality` job's `Build design tokens` block**

In the `ui-quality` job, locate:

```yaml
# @app/ui imports tokens.generated.css from packages/ui/src — gitignored
# output of `pnpm design:build`. Build it before any lint/typecheck/audit.
- name: Build design tokens
  run: pnpm design:build
```

Replace with:

```yaml
# @app/ui imports tokens.generated.css from packages/ui/src — gitignored
# output of `pnpm design:build`. Build it before any lint/typecheck/audit.
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
```

(Note: this job has no `working-directory: .` on the build step — preserve that.)

- [ ] **Step 4: Replace the `ui-storybook` job's `Build design tokens` block**

In the `ui-storybook` job, locate:

```yaml
- name: Build design tokens
  run: pnpm design:build
```

Replace with:

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
```

- [ ] **Step 5: Validate workflow YAML**

Run:

```bash
python3 -c "import yaml; yaml.safe_load(open('.forgejo/workflows/ci.yml')); print('OK')"
```

Expected: `OK`.

- [ ] **Step 6: Verify all three caches landed and reference identical paths**

Run:

```bash
grep -c "design-tokens-\${{ runner.os }}" .forgejo/workflows/ci.yml
```

Expected: `3` (three identical cache keys).

Run:

```bash
grep -c "tokens-cache" .forgejo/workflows/ci.yml
```

Expected: `6` (each occurrence shows up twice — `id: tokens-cache` and `if: steps.tokens-cache.outputs.cache-hit`, in three jobs).

- [ ] **Step 7: Commit**

```bash
git add .forgejo/workflows/ci.yml
git commit -m "$(cat <<'EOF'
ci(tokens): cache design-tokens generated outputs across jobs

The five files emitted by `pnpm design:build` (tokens.generated.css
and design-tokens.generated.ts in apps/web and packages/ui, plus
tokens.g.dart in packages/ui_flutter) are now actions/cache@v4 keyed
on the hash of packages/design-tokens/{src,scripts}/** and the
upstream specs/design/tokens/**. Three jobs (web, ui-quality,
ui-storybook) consume the cache; the first to run on a key populates
it, the others skip the rebuild step.

Saves ~10s × 3 = 30s aggregate runner CPU per run; minor wall-time
impact since design:build doesn't dominate any job.

Refs T-2026-05-05-002.
EOF
)"
```

---

## Task 3: Playwright cache in `snapshots-regen.yml`

**Files:**

- Modify: `.forgejo/workflows/snapshots-regen.yml` (around line 57-58)

- [ ] **Step 1: Verify current state**

Run:

```bash
grep -n "Install Playwright chromium" .forgejo/workflows/snapshots-regen.yml
```

Expected: one match around line 57.

- [ ] **Step 2: Replace single install step with cache pattern**

Edit `.forgejo/workflows/snapshots-regen.yml`. Locate:

```yaml
- name: Install Playwright chromium (with system deps)
  run: pnpm --filter @app/ui exec playwright install --with-deps chromium
```

Replace with:

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

- [ ] **Step 3: Validate workflow YAML**

Run:

```bash
python3 -c "import yaml; yaml.safe_load(open('.forgejo/workflows/snapshots-regen.yml')); print('OK')"
```

Expected: `OK`.

- [ ] **Step 4: Confirm no leftover combined install step**

Run:

```bash
grep -n "playwright install --with-deps" .forgejo/workflows/snapshots-regen.yml
```

Expected: no matches.

---

## Task 4: Playwright cache in `e2e.yml`

**Files:**

- Modify: `.forgejo/workflows/e2e.yml` (around line 35-36)

This workflow uses `pnpm exec playwright` (without the `--filter @app/ui` qualifier) — pattern is otherwise identical.

- [ ] **Step 1: Verify current state**

Run:

```bash
grep -n "Install Playwright" .forgejo/workflows/e2e.yml
```

Expected: one match around line 35:

```
35:      - name: Install Playwright browsers
36:        run: pnpm exec playwright install --with-deps chromium
```

- [ ] **Step 2: Replace single install step with cache pattern**

Edit `.forgejo/workflows/e2e.yml`. Locate:

```yaml
- name: Install Playwright browsers
  run: pnpm exec playwright install --with-deps chromium
```

Replace with:

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
  run: pnpm exec playwright install chromium

- name: Install Playwright OS deps
  run: pnpm exec playwright install-deps chromium
```

(No `--filter @app/ui` here — `e2e.yml` runs Playwright against the whole repo.)

- [ ] **Step 3: Validate workflow YAML**

Run:

```bash
python3 -c "import yaml; yaml.safe_load(open('.forgejo/workflows/e2e.yml')); print('OK')"
```

Expected: `OK`.

- [ ] **Step 4: Confirm no leftover combined install step**

Run:

```bash
grep -n "playwright install --with-deps" .forgejo/workflows/e2e.yml
```

Expected: no matches.

- [ ] **Step 5: Commit (Tasks 3 + 4 land in one commit)**

```bash
git add .forgejo/workflows/snapshots-regen.yml .forgejo/workflows/e2e.yml
git commit -m "$(cat <<'EOF'
ci(playwright): mirror Chromium cache into snapshots-regen + e2e workflows

Both workflows install Playwright the same way ui-storybook does;
mirror the cache + conditional binary download + always-run
install-deps split. Same key (pnpm-lock.yaml hash) — all three
workflows share one cache entry per Playwright version.

Refs T-2026-05-05-002.
EOF
)"
```

---

## Task 5: Tick sub-step boxes in `active.md`

**Files:**

- Modify: `specs/tasks/active.md`

- [ ] **Step 1: Tick all three sub-steps**

Edit `specs/tasks/active.md`. Find the T-2026-05-05-002 entry and flip:

```diff
- - [ ] Phase 1 — Playwright cache in `.forgejo/workflows/ci.yml` (`ui-storybook` job)
- - [ ] Phase 2 — design-tokens cache in `.forgejo/workflows/ci.yml` (`web`, `ui-quality`, `ui-storybook` jobs)
- - [ ] Phase 3 — Playwright cache in `.forgejo/workflows/snapshots-regen.yml` and `.forgejo/workflows/e2e.yml`
+ - [x] Phase 1 — Playwright cache in `.forgejo/workflows/ci.yml` (`ui-storybook` job)
+ - [x] Phase 2 — design-tokens cache in `.forgejo/workflows/ci.yml` (`web`, `ui-quality`, `ui-storybook` jobs)
+ - [x] Phase 3 — Playwright cache in `.forgejo/workflows/snapshots-regen.yml` and `.forgejo/workflows/e2e.yml`
```

- [ ] **Step 2: Commit**

```bash
git add specs/tasks/active.md
git commit -m "$(cat <<'EOF'
chore(tasks): tick T-2026-05-05-002 sub-steps as the PR is ready

All implementation phases complete. Entry stays in active.md with
status in-progress until the PR merges, per the task-stack rules.

Refs T-2026-05-05-002.
EOF
)"
```

---

## Task 6: Push branch and observe first run (cache miss expected)

**Files:** None modified.

This task validates that the cache YAML is syntactically and semantically correct on the actual runner.

- [ ] **Step 1: Push branch**

```bash
BRANCH=$(git rev-parse --abbrev-ref HEAD)
git push -u origin "$BRANCH"
```

Expected: branch pushed; tracking set up. Forgejo may emit a "Create a new pull request" hint URL — note it but don't open the PR yet.

- [ ] **Step 2: Wait for the push-triggered CI run to start**

Poll the run list until the run for the latest commit appears (status `running` or `success`):

```bash
SHA=$(git rev-parse HEAD)
for i in $(seq 1 30); do
  RUN=$(curl -sS "http://code.homelab.local/api/v1/repos/kkucherenkov/course_shelf/actions/tasks?limit=20" | jq -r --arg sha "${SHA:0:40}" '.workflow_runs[] | select(.head_sha == $sha) | .name + " " + .status' | head -1)
  if [ -n "$RUN" ]; then
    echo "$RUN"
    break
  fi
  sleep 5
done
```

Expected: at least one job for the just-pushed SHA appears within ~2 minutes.

- [ ] **Step 3: Wait for the `ui-storybook` job to finish, then check timing**

```bash
SHA=$(git rev-parse HEAD)
for i in $(seq 1 60); do
  STATUS=$(curl -sS "http://code.homelab.local/api/v1/repos/kkucherenkov/course_shelf/actions/tasks?limit=30" \
    | jq -r --arg sha "$SHA" '.workflow_runs[] | select(.head_sha == $sha and .name == "UI Storybook test-runner") | .status' | head -1)
  echo "ui-storybook: $STATUS"
  if [ "$STATUS" = "success" ] || [ "$STATUS" = "failure" ]; then
    DURATION=$(curl -sS "http://code.homelab.local/api/v1/repos/kkucherenkov/course_shelf/actions/tasks?limit=30" \
      | jq -r --arg sha "$SHA" '.workflow_runs[] | select(.head_sha == $sha and .name == "UI Storybook test-runner") | (.updated_at | fromdateiso8601) - (.run_started_at | fromdateiso8601)' | head -1)
    echo "duration: ${DURATION}s"
    break
  fi
  sleep 15
done
```

Expected on first run after the change: status `success`, duration ≈ 4:30-5:00 (approximately the same as before, because cache miss → full Chromium download still happens). The run populates the cache for next time.

- [ ] **Step 4: If `ui-storybook` failed, dump diagnostic**

If `STATUS=failure`, the cache YAML is broken or the conditional install is wrong. Investigate via the Forgejo Actions UI logs at:

```
http://code.homelab.local/kkucherenkov/course_shelf/actions
```

Common failure modes:

- `Cache not found for input keys: ...` — informational, not a failure.
- `actions/cache failed to save: ENOSPC` — runner out of disk; report BLOCKED.
- `playwright install-deps` exits non-zero — `sudo`/apt issue; report BLOCKED.

Otherwise: success means the YAML is correct. Proceed to Task 7.

---

## Task 7: Trigger second run, verify cache hit

**Files:** None modified.

This validates that the cache key/path are correct: a second run on a commit that doesn't change `pnpm-lock.yaml` or design-tokens sources should hit both caches.

- [ ] **Step 1: Make a no-op commit on the same branch**

```bash
git commit --allow-empty -m "ci: trigger run to verify cache hit"
git push
```

This re-runs CI without changing any input that affects cache keys.

- [ ] **Step 2: Wait for the new run's `ui-storybook` job to finish**

Same poll as Task 6 Step 3, replacing `$SHA` with the new HEAD SHA. Expected: `success`, duration ≈ **3:45-4:15** (45-60s shorter than first run — Chromium download skipped on cache hit).

- [ ] **Step 3: Confirm cache hits in Forgejo Actions UI**

Open the run in the Actions UI:

```
http://code.homelab.local/kkucherenkov/course_shelf/actions
```

Click into the `UI Storybook test-runner` job → `Cache Playwright browsers` step. Expected log line: `Cache hit for key: playwright-Linux-...`.

Click into the `Cache design tokens` step in `web`, `ui-quality`, `ui-storybook` jobs. Expected: `Cache hit for key: design-tokens-Linux-...` in at least the second and third jobs to run (the first job in batch 1 may show miss → save, since the cache was populated by Task 6's run).

- [ ] **Step 4: If cache hit doesn't reduce duration**

If duration is still ~4:45 even on the second run:

- Check Forgejo's `actions/cache` storage backend is configured (cache may not persist between runs if disabled).
- Check the cache key is not picking up a value that changes per-run (it shouldn't — `runner.os` and `hashFiles('pnpm-lock.yaml')` are stable).

Investigate, fix on the same branch, re-run. Don't proceed to PR open until the second run shows the expected speedup.

If after investigation the cache is working but the timing didn't improve — the binary download was not the dominant cost on this runner. Note this in the PR body and decide whether to keep or revert. (We expect the speedup; this should not happen.)

---

## Task 8: Open PR

**Files:** None modified.

- [ ] **Step 1: Open the PR via tea**

Run from repo root:

```bash
tea pulls create --login homelab \
  --title "ci: cache Playwright Chromium + design-tokens outputs" \
  --description "$(cat <<'EOF'
## Summary

Add `actions/cache@v4` around two cacheable artefacts in three Forgejo workflows:

1. **Playwright Chromium binary** (`~/.cache/ms-playwright/`) — cached across runs in `ui-storybook`, `snapshots-regen`, `e2e` workflows. Key: `pnpm-lock.yaml` hash.
2. **Design-tokens generated outputs** — five files emitted by `pnpm design:build`, cached across the three jobs in `ci.yml` that consume them (`web`, `ui-quality`, `ui-storybook`). Key: hash of `packages/design-tokens/{src,scripts}/**` + `specs/design/tokens/**`.

- Spec: [`docs/superpowers/specs/2026-05-05-ci-cache-playwright-tokens-design.md`](docs/superpowers/specs/2026-05-05-ci-cache-playwright-tokens-design.md)
- Plan: [`docs/superpowers/plans/2026-05-05-ci-cache-playwright-tokens.md`](docs/superpowers/plans/2026-05-05-ci-cache-playwright-tokens.md)
- Task: T-2026-05-05-002

## Why

Diagnostic of run #436 (commit c7cbad9) showed CI wall-time is ~8 minutes, dominated by `ui-storybook` (4:45) — and ~30-45s of that is Chromium binary download. The act_runner enforces concurrency=2, so the original "consolidate 6 parallel pnpm installs" framing wasn't where the cost actually lived. This PR is the narrowed scope: cache the two artefacts that genuinely matter.

## Expected impact

- Wall-time per CI run: ~8:00 → ~7:15 (-45s, ~9%)
- `ui-storybook` job alone: 4:45 → ~4:00 on cache hit
- Cache miss behaviour: identical to today

## Test plan

- [x] Workflow YAML parses (yaml.safe_load) for all three modified files
- [x] First run after merge: cache miss, populates cache (verified locally before PR open via Task 6 of the plan)
- [x] Second run: cache hit, duration drop ≥30s on `ui-storybook` (verified via Task 7)
- [ ] Forgejo CI green on this PR

## Risks

- Forgejo `actions/cache` storage limits: total cached data ~150 MB per Playwright cache + tens of KB per tokens cache → well under any reasonable limit.
- `playwright install-deps` requires apt access on the runner — already required by today's `--with-deps` flag, no behaviour change.
EOF
)"
```

Expected: PR created on `code.homelab.local/kkucherenkov/course_shelf`. URL printed.

- [ ] **Step 2: After PR merges, move T-2026-05-05-002 from active.md to done.md**

(After review + merge, not at PR-open time.)

```bash
git checkout main && git pull --ff-only
```

Edit `specs/tasks/active.md` — remove the T-2026-05-05-002 block.

Edit `specs/tasks/done.md` — paste the block at the top with two extra fields:

```
- Completed: <YYYY-MM-DD merge date>
- Result: merged via PR #<N> — <commit-sha>
```

Plus an `- Outcome:` block summarising what shipped (mirroring the format used by previous done.md entries).

Commit:

```bash
git add specs/tasks/active.md specs/tasks/done.md
git commit -m "chore(tasks): T-2026-05-05-002 shipped — move from active to done"
git push
```

---

## Self-review notes

**Spec coverage:**

- Playwright cache pattern → Tasks 1, 3, 4
- Design-tokens cache pattern → Task 2
- Three touched workflows → Tasks 1+2 (ci.yml), 3 (snapshots-regen.yml), 4 (e2e.yml)
- Verification of expected speedup → Tasks 6 (cache miss baseline) + 7 (cache hit speedup)
- Risks R1-R5 → all addressed inline in the spec; verification flow in Tasks 6-7 catches R2 (sudo) and any unexpected misbehaviour
- Phases (3 in spec) → grouped into Tasks 1, 2, 3+4 with one commit per logical change
- Single PR strategy → Task 8

**Type/name consistency check:**

- Cache `id: pw-cache` reused in all three Playwright caches: Tasks 1, 3, 4 ✓
- Cache `id: tokens-cache` used in all three design-tokens caches: Task 2 ✓
- Cache key formula identical in all three Playwright caches: `playwright-${{ runner.os }}-${{ hashFiles('pnpm-lock.yaml') }}` ✓
- Cache key formula identical in all three design-tokens caches: `design-tokens-${{ runner.os }}-${{ hashFiles('packages/design-tokens/src/**', 'packages/design-tokens/scripts/**', 'specs/design/tokens/**') }}` ✓
- Five output paths in design-tokens cache match `turbo.json`'s declared outputs for `@app/design-tokens#build` ✓
- `e2e.yml` correctly omits `--filter @app/ui` (it's not a `@app/ui`-scoped workflow) — Task 4 explicitly notes this ✓

**Placeholder scan:** None — all step bodies contain concrete commands, code, and expected output.
