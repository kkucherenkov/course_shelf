## T-2026-09-16-style-gates — stylelint gates for font-weight/line-height literals, legacy media syntax, token aliases

- Created: 2026-09-16
- Owner: claude
- Spec: —
- Goal: Closes #664. Rule before cleanup, one PR at a time: add three
  stylelint gates (literal `font-weight`/`line-height`, legacy
  `min-width`/`max-width` media syntax, short token-alias consumption) so the
  dialect drift the wave-6/7 audits found can't silently reappear. This pass
  (per maintainer: "чини только packages/ui, жди сигнала на остальное") wires
  the gates scoped to `packages/ui/src/components/**` and cleans every
  violation there. `apps/web` still carries violations — deferred to a
  follow-up once the other three parallel lanes land, so this PR doesn't fail
  CI on files those lanes own or are mid-flight on.
- Spec diff: none (no API/contract change)
- Codegen impact: no
- Sub-steps:
  - [x] Measured real marker counts repo-wide instead of trusting the
        brief's table — it undercounted/overcounted before, and did again
        here: `font-weight:` literal 22 total (matches brief) — 17 in
        `apps/web` (deferred), 5 in `packages/ui` (fixed). Legacy
        `@media (max-width:`/`(min-width:` — **5 total, inverted from the
        brief's "5 outside admin / 0 in admin"**: 1 in `packages/ui`
        (`AppScanProgress.vue`, fixed), 4 inside `apps/web/.../admin/**`
        (`AdminScansTable.vue` ×3, `AdminTranscriptionCard.vue` ×1,
        deferred — admin-dialect's own cleanup only covered `min-width`,
        not `max-width`). Token aliases (`--text-muted`/`--text-subtle`,
        47+7=54) — all in `apps/web/.../admin/**`, 0 in `packages/ui`
        (matches brief, deferred). Raw `<input type="search">` — 4 total, 1
        in `apps/web` (deferred), 3 in `packages/ui`, of which 1
        (`AppSearchField.vue`) is the canonical primitive itself and not a
        violation; the other 2 (`AppCommandPalette.vue`,
        `AppNavigationShell.vue`) are real bespoke raw inputs — flagged
        below, not fixed (no stylelint rule can gate template HTML, and
        `AppInput` isn't a drop-in without visual risk to their bespoke
        styling)
  - [x] `stylelint.config.mjs`: extended the `packages/ui` override with
        `declaration-property-value-disallowed-list` (font-weight,
        line-height, 26-alias regex on `/.*/`) + `media-feature-name-disallowed-list`
        (`min-width`, `max-width`)
  - [x] Cleaned `packages/ui` violations: 5× font-weight literal →
        `var(--fw-medium)`/`var(--fw-semibold)`, 1× legacy
        `@media (max-width: 359px)` → `@media (width <= 359px)`
        (`AppScanProgress.vue`). Left `AppNoteEditor.vue`'s `line-height:
20px` literal untouched — the line-height regex is unitless-only
        (`/^[\d.]+$/`, matches the brief), so it doesn't even fire there;
        that literal already carries its own documented rationale from
        `T-2026-09-16-token-vocabulary`
  - [x] Proved the gate fails on an injected violation
        (`AppSectionHeader.vue`: `font-weight: 600` → red, 1 error at the
        exact line), then reverted — confirmed clean again, `git diff
--stat` showed exactly one line changed (the real fix), no residue
  - [x] `grep` each marker in `packages/ui` → 0 (all three)
  - [x] Gates: `pnpm --filter @app/ui lint --fix` (0 changes),
        `pnpm stylelint:fix` (0 changes outside packages/ui — confirms the
        override scoping didn't leak), `pnpm format` (0 changes),
        `pnpm turbo run lint test typecheck` (18/18 green, 569/569 web
        tests, 2130/2160 backend — 30 skipped — once `pnpm spec:bundle` was
        run in this fresh worktree; the first parallel `turbo` run showed 4
        flaky web test timeouts under `--concurrency` resource contention,
        gone on a serial re-run — pre-existing environment flake, not this
        change), `pnpm check:i18n` clean (no strings touched)
  - [x] Live check: built Storybook, served statically, drove it with
        Playwright/Chromium (`/usr/bin/chromium`) — computed
        `font-weight`/`grid-template-columns` on the touched selectors
        across 6 stories match the old literal values exactly (500, 500,
        600, 600; 2-col grid at 359px, 4-col at 700px), zero page errors
  - [x] Surfaced to maintainer (not acted unprompted): the 5 zero-consumer
        `@app/ui` components (delete vs `@deprecated`), 2 raw
        `<input type="search">` in `packages/ui` found on the way
        (AppCommandPalette, AppNavigationShell). Maintainer resolution:
        neither is style-gates' call — both filed as maintainer-owned
        issues instead. 5 components: `AppToast` is dead _by decision_
        (toast layer deliberately stays on Nuxt UI), the other 4 need a
        "built-ahead vs abandoned" call the lane has no data for, plus a
        `specs/design/README.md` parity-inventory update — churn on
        release day for no user-facing win. 2 search inputs: the
        borderless command-palette input is correct as-is, not a defect;
        the real question (should `AppSearchField` grow a variant to cover
        it, or are these legitimately different) is a design-system
        decision, not a cleanup
  - [x] Open PR, note the apps/web deferral explicitly in the body —
        https://github.com/kkucherenkov/course_shelf/pull/668
  - [x] Follow-up on PR #668 (maintainer split the 5 dead components:
        1 real duplicate, 4 not this lane's call — #672 covers the rest):
        deleted `AppAlert` outright — `AppBanner` is the strictly richer
        superset (`variant`/`title`/`body`/`dismissible`/`dismissLabel` vs
        `variant`/`message`) with 19 real consumers against `AppAlert`'s
        zero, confirmed by grep (only its own folder, `index.ts`, the
        showcase page, and roadmap/task-history docs, which stay
        untouched — historical record). Removed: component + stories +
        spec + folder, the `index.ts` export, the showcase block in
        `apps/web/app/pages/dev/foundations.vue`, 6 orphaned Storybook
        visual snapshots (`packages/ui/test/__snapshots__/feedback-appalert--*.png`).
        **Did not** hand-edit `packages/ui/components.d.ts` — gitignored,
        `unplugin-vue-components`-generated, self-corrects on next Nuxt
        dev/build. **Did not** delete the `specs/design/README.md`
        inventory row as instructed — verified Flutter's `app_ui` package
        still ships and exports its own `AppAlert` widget
        (`packages/ui_flutter/lib/src/feedback/app_alert.dart`, barrel
        line 34), so the row still describes a real cross-platform
        parity fact; deleting it would have made `pnpm design:audit`
        report "Flutter components missing an inventory row: AppAlert" —
        the same failure mode the instruction was trying to prevent.
        Flipped the Vue column `✓` → `—` instead. `pnpm design:audit`
        (`--strict` too) clean. Full gate green: `pnpm --filter @app/ui
lint --fix`, `pnpm --filter @app/web lint --fix`,
        `pnpm stylelint:fix`, `pnpm format` (0 extra changes),
        `pnpm turbo run lint test typecheck` (18/18, 569/569 web),
        `pnpm check:i18n` clean, `pnpm --filter @app/ui storybook:build`
        succeeds with the story gone
- Status: done
  review/merge)
- Blockers: —
- Completed: 2026-09-16
- Result: https://github.com/kkucherenkov/course_shelf/pull/668
  apps/web cleanup — it's deleting `apps/web/app/pages/libraries.vue`
  outright, which carries a font-weight literal (line 210) and a
  duplicate `@keyframes` (line 277) this lane would otherwise redo work
  on; maintainer will give the signal + an up-to-date marker list once it
  merges. `AppProgressBadge`/`CoursePosterCard` is a redesign call, not
  this release; `AppToast`/`AppSsoBlock`/`AppProgressCircle` tracked in
  #672, not this lane's.
