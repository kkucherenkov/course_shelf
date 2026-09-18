## T-2026-09-16-style-gates-2 — extend dialect gates to apps/web, drop the packages/ui-only override

- Created: 2026-09-16
- Owner: claude
- Spec: —
- Goal: Closes #676. The three lanes that held back the `apps/web` cleanup
  (`dead-surfaces`, `no-grants-home`, `scan-panel`) have merged. Clean the
  remaining marker violations in `apps/web` (short token aliases, literal
  `font-weight`), fix the 4 legacy `max-width` media queries with a live
  breakpoint check, then remove the `packages/ui`-only scoping on the three
  stylelint gates so they apply repo-wide and can't regress silently again.
- Spec diff: none (no API/contract change)
- Codegen impact: no
- Sub-steps:
  - [x] Re-measured markers repo-wide on current `main` (75f93fee) instead of
        trusting the brief: alias `var(--text-muted|text-subtle)` 54/18
        files, `font-weight:` literal 14/8 files, `@media (...max-width` 4/2
        files, `line-height:` literal 0 — all four match the brief exactly
  - [x] Commit 1: 54 alias reads → canonical long token name (1:1 value
        substitution, `--text-muted`→`--text-secondary`,
        `--text-subtle`→`--text-tertiary`, confirmed against
        `emit-scss.ts`'s own `pairs` mapping) + 14 `font-weight:` literals →
        `var(--fw-medium|semibold|bold)`, 18 files, `grep` both markers → 0
        in `apps/web`. Fresh worktree needed `pnpm install` first (missing
        `node_modules`); the first `lint --fix` run's 27 `foundations.vue`
        type-aware ESLint errors were a red herring — pre-existing,
        unrelated, cleared once `@app/design-tokens#build` (a turbo
        dependency of `lint`) regenerated `design-tokens.generated.ts` in
        this fresh worktree
  - [x] Commit 2: 4 legacy `max-width` media queries → range syntax
        (`max-width: Npx` → `width <= Npx`, same pattern PR #668 used for
        `AppScanProgress.vue` — spec-equivalent, not `width < (N+1)px`).
        Live-verified on the audit stand (`:8090`): built this branch's
        `web` image, hot-swapped `csh-audit-web-1` (backed up as
        `courseshelf-web:audit6-backup`, confirmed same image id as
        `audit6` before touching it), drove `/admin/libraries/lzyU_CiSqwfcmL4LucR4F`
        (real scan + transcription history) with Playwright at 359/360,
        767/768, 1023/1024px. `AdminScansTable`'s three responsive columns
        (`--lg`, `--md-up`, `--md-combined`) and `AdminTranscriptionCard`'s
        stats grid (2-col ≤359, 4-col ≥360) all flip at the exact same
        width as the legacy syntax, zero reflow. Reverted the container to
        the original image afterward, confirmed healthy
  - [x] Commit 3: `stylelint.config.mjs` — removed the `packages/ui`-only
        scoping on the three gates, folded `font-weight`/`line-height`/
        alias-regex into the existing top-level
        `declaration-property-value-disallowed-list` (merged into its
        `/.*/` pattern array rather than shadowing it) and added
        `media-feature-name-disallowed-list` at top level too; kept the BEM
        `selector-class-pattern` override `packages/ui`-only (unrelated to
        #676 — would've wrongly forced `app-`/`health-`/`brand-` prefixes
        onto every `apps/web` class name)
  - [x] Proved the gate fails on an injected violation in `apps/web` this
        time (not `packages/ui`): reverted two `font-weight: var(--fw-semibold)`
        lines in `settings.vue` back to the literal `600` — stylelint
        failed at the exact two lines (609, 704), reverted, confirmed clean
        again
  - [x] `grep` all four markers repo-wide → 0
  - [x] Gates: `pnpm --filter @app/web lint --fix`, `pnpm stylelint:fix`
        (0 changes outside the config edit), `pnpm format` (0 changes),
        `pnpm turbo run lint test typecheck --force --concurrency=1`
        (serial, uncached — the first `--force` parallel run hit the
        documented pre-existing flake, one `course-detail-admin-actions`
        test timeout under concurrency contention; passed standalone and
        on the serial re-run: 18/18 tasks, 567/567 web tests), `pnpm
check:i18n` clean (758/758 en=ru, unchanged — no strings touched)
  - [x] Open PR, `Closes #676` — https://github.com/kkucherenkov/course_shelf/pull/677
- Status: in-progress (PR open, awaiting review/merge)
- Blockers: —
