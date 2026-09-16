# Active tasks

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
  - [ ] Commit 1: 54 alias reads → canonical long token name (1:1 value
        substitution, `--text-muted`→`--text-secondary`,
        `--text-subtle`→`--text-tertiary`)
  - [ ] Commit 1: 14 `font-weight:` literals → `var(--fw-medium|semibold|bold)`
  - [ ] Commit 1 gates + `grep` both markers → 0 in `apps/web`
  - [ ] Commit 2: fix the 4 legacy `max-width` media queries (range syntax),
        live-check at 359/360, 767/768, 1023/1024px — both sides of every
        breakpoint, screenshot or note any reflow
  - [ ] Commit 3: `stylelint.config.mjs` — remove the `packages/ui`-only
        scoping on the three gates (declaration-property-value-disallowed-list
        font-weight/line-height/alias regex + media-feature-name-disallowed-list),
        fold into top-level `rules` (merge with the existing top-level
        `declaration-property-value-disallowed-list` `/.*/` pattern rather
        than shadow it); keep the BEM `selector-class-pattern` override
        `packages/ui`-only, that one is unrelated to #676
  - [ ] Prove the gate fails on an injected violation in `apps/web` (not
        `packages/ui` this time), then revert
  - [ ] `grep` all four markers repo-wide → 0
  - [ ] Gates: `pnpm --filter @app/web lint --fix`, `pnpm stylelint:fix`,
        `pnpm format`, `pnpm turbo run lint test typecheck`, `pnpm check:i18n`
  - [ ] Open PR, `Closes #676`
- Status: in-progress
- Blockers: —

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
- Status: in-progress (PR #668 open, second commit pushed, awaiting
  review/merge)
- Blockers: waiting on `dead-surfaces`' PR to land before starting
  apps/web cleanup — it's deleting `apps/web/app/pages/libraries.vue`
  outright, which carries a font-weight literal (line 210) and a
  duplicate `@keyframes` (line 277) this lane would otherwise redo work
  on; maintainer will give the signal + an up-to-date marker list once it
  merges. `AppProgressBadge`/`CoursePosterCard` is a redesign call, not
  this release; `AppToast`/`AppSsoBlock`/`AppProgressCircle` tracked in
  #672, not this lane's.

## T-2026-09-16-no-grants-home — collapse the no-access home state to one message

- Created: 2026-09-16
- Owner: claude
- Spec: —
- Goal: a USER with zero library grants sees the "no access" explanation
  **once** on `/` instead of three times (one per `HomeRow`), and the right
  rail ("Your week") does not show a 0/0 scoreboard next to it (#666).
- Spec diff: none (no API/contract change)
- Codegen impact: no
- Sub-steps:
  - [x] Gate `page-home__layout` (3 rows + rail) behind `hasLibraryAccess`;
        render one `AppNoPermission` block instead when false (same
        component/copy `browse.vue` already uses for the same state — lock
        icon, warning palette, `pages.browse.emptyNoAccess*` keys, no new
        i18n needed)
  - [x] Drop the now-dead `hasLibraryAccess`-ternary branches from the three
        empty-state computeds (title/body) — only reachable when access is
        true now; deleted 2 of the 4 computeds outright (title was a
        constant once the ternary was gone)
  - [x] Updated `index.spec.ts` for the new shape — it asserted the old
        per-row ternaries directly; replaced the two zero-grants tests with
        one "renders a single no-access block, zero `HomeRow`s" test, added
        `AppNoPermission` to the `@app/ui` mock
  - [x] Proposed a "next action" for the no-access block to the maintainer;
        answer was **no button, ever** — refetching resolves nothing (the
        grant not existing isn't a staleness problem), and both real
        next-actions (mailto, request-access) need an endpoint the contract
        doesn't have and are out of scope for this fix. Left explicit as a
        code comment next to the block so the omission reads as deliberate.
        "Request access" filed as its own future feature by the maintainer,
        not tracked here.
  - [x] `pnpm --filter @app/web lint --fix && pnpm format && pnpm stylelint:fix`,
        `turbo run lint test typecheck` (18/18 green, 569/569 web,
        2130/2130+29 backend incl. the contract e2e suite once
        `pnpm spec:bundle` regenerated the missing bundle this fresh
        worktree didn't have), `pnpm check:i18n` clean
  - [x] Verified live: built `courseshelf-web:no-grants-home`, hot-swapped
        the shared `csh-audit` stand's `web` container (project `csh-audit`,
        not the compose file's own `courseshelf-release` — first attempt
        without `-p csh-audit` stood up a disconnected duplicate stack,
        cleaned up). `audit-empty@example.com`: one message, one lock icon,
        no rail, on both `/` and `/browse` (browse unchanged, not this
        lane's file) — screens don't contradict. `audit-admin@example.com`:
        unaffected, still 3 rows + rail + posters. Reverted the stand's
        `web` image back to `audit6` for the other lanes
  - [x] PR #670 opened; CI Playwright caught a real gap —
        `tests/e2e/home.spec.ts` never mocked `/api/v1/libraries`, so a
        non-admin fell through to `hasLibraryAccess === false` against a
        fixture that also mocked non-empty content rows — a persona that
        can't exist for real (content with zero grants). Added a
        one-library fixture (existing tests keep the "has access" persona
        they were written for, renamed the 1440px test to say so) and a
        second, genuinely new test for the zero-grants case, confirmed to
        fail against `main`'s `index.vue` before checking it back to this
        branch's. Ran the full local `pnpm e2e` (backend not started — all
        calls in scope are route-mocked): 34/34 relevant tests green, the
        one `smoke.spec.ts` backend-health failure is the missing backend,
        not this change
  - [x] CI green on #670 after the fixture fix (all checks passed)
- Status: in-progress — PR #670 open and green, awaiting merge
- Blockers: —

## T-2026-09-16-scan-panel — scan panel covers bottom nav; duplicate finish toast

- Created: 2026-09-16
- Owner: claude
- Spec: —
- Goal: `ScanLifecycleNotifier.vue` fixed panel outranks `AppNavigationShell`'s
  bottom-tab bar on `z-index` below 600px, so an in-flight scan makes nav
  unreachable for its whole duration (an active card can't be dismissed).
  Second, unrelated defect in the same component: the finish toast fires even
  when the panel already renders the same card, doubling the notification in
  the same bottom-right corner (#667).
- Spec diff: none (no API/contract change)
- Codegen impact: no
- Sub-steps:
  - [x] Reproduced both live on the audit stand at 375px (Playwright,
        cookie+bearer auth, admin scan triggered via API): panel bottom edge
        overlapped the nav bar by 48 of its 64px, `elementFromPoint` at the
        nav row hit panel content, not a tab; finish moment showed panel +
        matching toast simultaneously, toast auto-dismissed ~5s later, panel
        stayed
  - [x] Raised panel's `bottom` above the bar at <600px, height sourced from
        the same `--space-8` token the bar itself uses
  - [x] Toast-on-finish now skips any card already present in `visibleCards`
        (only fires for scans pushed past `MAX_VISIBLE` by more concurrent
        activity)
  - [x] Updated component spec: two prior tests asserted the buggy
        always-toast behavior for a single finished scan — rewrote them
        against an overflow scenario (4 concurrent scans) so the plural
        formatting they test still exercises a real toast; added a spec for
        the fix itself
  - [x] `turbo run lint test typecheck` — 18/18 green (570 web + 2159
        backend tests; the 27 pre-existing `foundations.vue` lint errors and
        6 timeout-flaked web specs are unrelated — both reproduce identically
        on an unmodified checkout and pass clean in isolation)
  - [x] Re-verified live: rebuilt the `web` image from this branch,
        hot-swapped onto the shared `csh-audit` stand's `web` container
        (375px viewport, admin session, scan triggered via API) and reverted
        after — panel's bottom edge now clears the nav bar by 16px instead of
        overlapping it by 48, `elementFromPoint`/a real click on the nav row
        reach the tab (navigated to `/browse`) instead of the panel, and the
        finish moment shows the panel with zero toasts for the whole 15s
        window instead of one
- Status: in-progress (gates + live check done; PR next)
- Blockers: —

## T-2026-09-16-token-vocabulary — stop consuming short design-token aliases; clamp CourseDescription

- Created: 2026-09-16
- Owner: claude
- Spec: —
- Goal: `packages/ui/src` and `apps/web/app` outside `admin/` stop consuming
  `emit-scss.ts`'s short-name token aliases (`--primary`, `--error`, ...) and
  reference the canonical DTCG long names directly, so the alias layer can
  eventually be deleted without redoing this work file-by-file (#654). Second,
  unrelated fix in the same PR: `CourseDescription.vue` gets a readable
  measure + line-clamp, and literal `line-height` values in this lane's scope
  move to `--leading-*` tokens.
- Spec diff: none (no API/contract change)
- Codegen impact: no
- Sub-steps:
  - [x] Measured real `var(--alias)` consumption in scope (not comments, not
        BEM modifiers that happen to share a token's English word) — 7 files,
        25 occurrences, not the ~99 raw-grep figure quoted in the brief (that
        count included BEM modifier classes like `&--primary`/`&--error` and
        historical "ships as alias" doc comments, neither of which are actual
        token consumption)
  - [x] Replaced all 25 with canonical names: `AppAlert.vue`, `AppBanner.vue`,
        `AppSkeleton.vue`, `AppToast.vue`, `AppAlert.stories.ts`,
        `HomeRow.vue`, `forgot.vue`; cleaned the one now-stale alias-mapping
        comment (`AppSkeleton.vue`)
  - [x] Left `emit-scss.ts`'s `themedAliasLines()` untouched — admin-dialect
        lane still depends on it; final removal deferred to maintainer go-ahead
  - [x] `CourseDescription.vue`: 70ch measure, 6-line clamp with a "show
        more"/"show less" toggle (`AppButton` ghost/sm), collapses again on a
        new `description` (no stale expand state across course navigation).
        `line-height: 1.6` → `--leading-relaxed`.
  - [x] Literal `line-height` → `--leading-*` elsewhere in scope: 11 of the
        planned 12 (6 web + 5 ui, not 6 — see next line), exact-value matches
        (`1` → `--leading-none`, `1.25` → `--leading-tight`) and two
        nearest-token approximations (`1.2`/`20px` → `--leading-tight`/
        `--leading-relaxed`, both sub-pixel at their font sizes)
  - [x] **Left one deliberately literal**: `AppNoteEditor.vue`'s
        `line-height: 20px` looked like the same "nearest token" case as the
        rest (`--leading-relaxed` = 19.5px, 0.5px off) but the Storybook
        visual-regression run measured otherwise — 7 stories drifted 2.0–2.3%,
        one grew 10px and clipped a line of note text. It's a fixed-height
        preview box, not flowing body copy, so a 0.5px per-line rounding
        compounds across a multi-line note into a real reflow. Reverted to
        the literal `20px` with a comment explaining why; confirmed 0 drift
        on the re-run
  - [x] `pnpm design:build`, `turbo run lint test typecheck` (18/18 green,
        568/568 web tests including a new spec case for the toggle)
  - [x] Storybook visual regression, full suite, in the pinned
        `mcr.microsoft.com/playwright:v1.59.1-jammy` container: 51/51 suites,
        305/305 snapshots — 0 drift on both the token-alias swap and the
        final line-height set (after reverting `AppNoteEditor.vue`)
  - [x] Measured the paragraph the same way as the brief (`measure-type.mjs`
        methodology) against this branch's `web` image, hot-swapped onto the
        shared `csh-audit` stand's `web` container and reverted after:
        **70ch at both 1440px and 1024px** (was 111ch/96ch on `main`).
        `IUJgcSn2VoE9cPFTG63Lw` (the course the brief named) has a **null**
        description on the current stand's data, not "several thousand
        characters" — used `lINAImJmhXXLSEGHkL5iH` instead (4734-char
        description, the longest of the 68 seeded courses)
  - [x] Verified the clamp on that course: 6 lines exactly
        (`clientHeight: 117px` = 6 × 19.5px), toggle appears
        ("Показать полностью"), click removes the clamp and shows all 4734
        characters, label flips to "Свернуть" — screenshotted both states
  - [x] Gates + PR
- Status: in-progress (PR open, awaiting review/merge; final
  `themedAliasLines()` removal deferred to maintainer go-ahead)
- Blockers: —

## T-2026-09-16-admin-dialect — close the admin style dialect

**Issue**: Closes #655 — admin scope diverged stylistically from the rest of
`apps/web`/`@app/ui` even after the wave-5 component consolidation: 24×
`@media (min-width:` (vs 0 elsewhere), ~41 literal `font-weight:` (should be
`var(--fw-*)`), ~10 duplicate `@keyframes *skel-pulse` (should be
`AppSkeleton`), 4× `__btn--icon` (should be `AppIconButton`), 2 raw
`<input type="search">` (should be `AppSearchField`), 1 hand-rolled segmented
control in `AdminPermissionRow.vue` (should be `AppSegmented`/
`AppSegmentedItem`). Mid-brief addition: 2 literal `line-height:` in the same
scope, replace with `--leading-*` alongside the font-weight pass — same class
of defect, same commit. Font-size scale explicitly out of scope (maintainer
call, owned by `token-vocabulary`).

**Plan**:

- [x] `@media (min-width: Npx)` → `@media (width >= Npx)` range syntax
      (matches the rest of `apps/web`, e.g. `HomeRow.vue`, `settings.vue`)
- [x] Literal `font-weight: 500/600` → `var(--fw-medium)`/`var(--fw-semibold)`
      (exact token values: regular 400, medium 500, semibold 600, bold 700 —
      confirmed against `docs/design/shared/tokens.json`); drop
      `AdminRoleChip.vue`'s `$chip-fw: 500` scss-var indirection, inline the
      token like every sibling file already does
- [x] Literal `line-height: 1.5` → `var(--leading-normal)` (exact match),
      `line-height: 1.4` → `var(--leading-snug)` (nearest: 1.375 vs 1.5)
- [x] Duplicate `@keyframes *-skel-pulse` opacity-pulse loaders → `AppSkeleton`
      (own shimmer animation, replaces the hand-rolled one). Own grep found
      10 name-matching files, not the audited 9, plus one more
      (`admin/permissions/index.vue`'s `adm-perm-picker-skel`) that is the
      same duplicate under a name the marker's substring match missed —
      treated all 11 as the same defect since the audit's own count was
      already shown unreliable elsewhere in this wave. `admin/index.vue`'s
      copy turned out to be dead CSS (no local consumer left after
      `AdminStatCard` internalised its own skeleton) — deleted outright.
- [x] 4× `__btn--icon` (`AdminUserRow.vue`, `AdminLibraryRow.vue` + specs/snapshots) → `AppIconButton`
- [x] 2× raw `<input type="search">` (`admin/users.vue`, `admin/permissions/index.vue`) → `AppSearchField`.
      No visually-hidden-label variant exists on `AppField`, so both now show
      a real (translated, already-existing) label above the input — a small,
      deliberate visual change, not a page-level style patch.
- [x] Hand-rolled segmented toggle in `AdminPermissionRow.vue` (both the
      library-level and per-course row) → `AppSegmented`/`AppSegmentedItem`.
      `AppSegmentedItem` has one neutral "selected" look, no per-value
      colour — the old green(read)/grey(none) semantic coding is gone,
      replaced by the standard segmented highlight.
- [x] Update/delete stale specs and snapshots for every touched component —
      2 snapshots regenerated (`AdminUserRow`, `AdminLibraryRow`), 7 spec
      files gained new `@app/ui` stub entries (`AppSkeleton`, `AppIconButton`,
      `AppSearchField`) their mock factories were missing
- [x] `grep` each marker in scope → 0; `pnpm --filter @app/web lint --fix`,
      `pnpm stylelint:fix`, `pnpm format`, `turbo run lint test typecheck`
      (18/18 tasks green, 566/566 web tests, `check:i18n` clean)
- [x] Live check on `:8090` (audit6 stand), both themes — rebuilt the `web`
      image from this branch (`ghcr.io/kkucherenkov/courseshelf-web:audit6`,
      same tag the running `csh-audit` compose project already points at),
      recreated the `web` container, drove it with Playwright over the real
      bearer+cookie auth against 68 real courses / 5973 lessons. `AppSearchField`
      (users + permissions pickers), `AppIconButton` (row actions, both the
      xs-only and md+-only copies), `AppSkeleton` and `AppSegmented`
      (permissions detail, library + course row, both `light`/`dark`,
      1440px + 375px) all render at the height/radius/focus-ring of the row
      they sit in — no page-level style patch needed. Clicked a course-level
      segment end to end: flips `aria-checked`, round-trips through the
      existing revoke-confirmation dialog, persists across reload; reverted
      the one grant this touched back to its original `None` (confirmed
      persisted). Zero console/page errors across every page × theme ×
      viewport combination checked.

**Boundary**: `apps/web/app/components/admin/**` and
`apps/web/app/pages/admin/**`, except `AdminEditLibrarySheet.vue` (owned by
lane `edit-sheet`, #653). Short token aliases (`--text-muted` etc.) are lane
`token-vocabulary`'s (#654) — leave them as-is.

- Status: in-progress (PR open, awaiting review/merge) — https://github.com/kkucherenkov/course_shelf/pull/660
- Blockers: —

## T-2026-09-16-admin-edit-library-dialog

**Issue**: Closes #653 — `AdminEditLibrarySheet` was the one admin dialog the
`admin-dialogs` lane left off `AppDialog` (#645 named it out of scope, filed
as tuxedo #201, now promoted to #653). Own `role="dialog"` `<div>`, no
`keydown` handler at all — no Escape, no focus trap, no focus return —
while `aria-modal="true"` told assistive tech otherwise.

**Plan**:

- [x] Confirmed the defect first: `rg keydown AdminEditLibrarySheet.vue` — no
      match; markup was a plain `<div role="dialog" aria-modal="true">` plus a
      manually rendered backdrop.
- [x] Rebuilt on `AppDialog`, mirroring `AdminRemoveLibraryDialog.vue`:
      dropped the hand-rolled header/close-button/backdrop/sheet SCSS,
      `:open="props.open"` straight through (component stays mounted once the
      page's `v-if="library"` is true, same as `AdminRemoveLibraryDialog` —
      confirmed in `admin/libraries/[id].vue:490-512`).
- [x] Footer: form + buttons stay in the default slot (not `#footer`) so the
      single-input form keeps implicit Enter-to-submit — this matches
      `AdminAddLibrarySheet.vue`'s existing pattern exactly, not a third
      footer variant.
- [x] Updated colocated spec: swapped the old `IconCS`/backdrop-aware stub
      set for the `AppDialog` stub `AdminRemoveLibraryDialog.spec.ts` uses;
      added a test asserting the component renders through `.stub-dialog`
      with `open` passed through.
- [x] Proved the new test fails pre-fix: reverted the component to
      `HEAD`, reran — all 7 tests fail (`IconCS` not in the new mock,
      confirming the old div-based markup is what's gone). Restored the fix,
      reran — 7/7 green.
- [x] `pnpm design:build` (fresh worktree had no generated tokens — unrelated
      pre-existing lint failures in `pages/dev/foundations.vue` cleared once
      run), `pnpm --filter @app/web lint --fix`, `pnpm stylelint:fix`,
      `pnpm format`.
- [x] `pnpm turbo run lint test typecheck` — 18/18 tasks green (567/567 web
      tests).
- [x] `pnpm check:i18n` clean — no new locale keys needed, all strings still
      come from props as before.
- [x] Net diff: −98 lines, matching the audit's estimate.
- [x] Live verification, real Chromium via Playwright — split in two instead
      of redeploying the shared audit stand (it carries production-shaped
      data other concurrent work reads; the fix is client-only, so a
      container swap there would have been risk with no extra signal):
  - Pre-fix defect, read-only against the live audit stand (`:8090`, reused
    the existing `audit-admin` session token, no login attempts against its
    rate limiter): opened the Edit sheet — confirmed `<div role="dialog">`
    (not `<dialog>`), focus escaped the sheet within 15 Tabs, Escape left it
    open. Matches the diagnosis exactly.
  - Fix mechanism, against `AppDialog`'s own Storybook story (same file
    `AdminRemoveLibraryDialog`/now `AdminEditLibrarySheet` both delegate to,
    unmodified by this change, and already live-verified for the first two
    in #647's own live check): native `<dialog>`, focus never left it across
    15 Tabs, Escape closed it, focus returned to the trigger.
    `AdminEditLibrarySheet`'s own `AppDialog` wiring is prop-for-prop
    identical to `AdminRemoveLibraryDialog`'s (`:open`, `dismiss-label`,
    `@update:open="close"`) — no new behaviour for the platform mechanics to
    diverge on.
- Status: done, opening PR.

**Boundary**: owns `AdminEditLibrarySheet.vue` and its spec only, per the
`admin-dialogs` lane. Did not touch `admin/libraries/[id].vue`.

## T-2026-09-16-entity-combobox

**Issue**: Closes #646 — no async multi-select combobox in `@app/ui`; `CourseMetadataForm.vue` uses three raw `USelectMenu` for instructors/studios/tags.

**Plan**:

- [x] Build `AppComboBox` in `packages/ui/src/components/AppComboBox/` — pure visual, ARIA combobox pattern (role=combobox on input, role=listbox, `aria-activedescendant`, no focus loss on option highlight). Props in (`items`, `loading`, `modelValue: string[]`, `searchTerm`), events out (`update:modelValue`, `update:searchTerm`). No network access — fetch stays in `useEntitySearch`.
- [x] Stories: empty, loading, has-results, no-results, has-selected-chips, disabled (+ composed-with-AppField).
- [x] Colocated spec: keyboard (arrows/Enter/Escape/Home/End/Backspace-removes-last-chip) + mouse select/remove — written to fail before the component exists (confirmed: `Cannot find module './AppComboBox.vue'`).
- [x] Export from `packages/ui/src/index.ts`.
- [x] Swap all three `USelectMenu` in `CourseMetadataForm.vue` for `AppComboBox`; `grep -c "<USelectMenu" -r apps/web/app` → 0.
- [x] Add locale keys (en+ru) for the new props' strings (loading/no-results/remove-chip).
- [x] Manual verify: built Storybook, drove the real component (Chromium via Playwright) through `ComposedWithAppField` — mouse (select two, remove one) and keyboard-only (same, plus Home/Escape) paths, 15/15 checks green. Then the full backend round-trip on the shared audit stand (`:8090`, 68 real courses): rebuilt `backend`/`web` images from this branch, redeployed onto the existing `csh-audit` compose project (same postgres, real data untouched), opened `/courses/IUJgcSn2VoE9cPFTG63Lw/edit` as `audit-admin`, picked two instructors, removed one, saved, reloaded — persisted exactly the one kept. Catalog had zero instructor/studio/tag rows in this dump, so inserted two throwaway rows to have something to search for, then deleted them (and the course link) back to the original empty state afterward — confirmed `course`/`course_instructor`/`instructor` counts match pre-check.
- [x] Found on the way, fixed in-lane (own component, own failing check): axe caught 3 real violations in `AppComboBox` — status row inside `role="listbox"` with no role (`aria-required-children`/`listitem`), listbox itself with no accessible name (`aria-input-field-name`), `aria-controls` pointing at an id that doesn't exist while loading/empty (`aria-valid-attr-value`). Fixed: status rows render as siblings of the listbox instead of inside it, added `listboxLabel` prop (defaults `'Options'`, wired to the field's own translated label in `CourseMetadataForm.vue`), `aria-controls` now targets the always-present panel. Re-verified: 0 axe violations across all 7 stories × light/dark.
- [x] Gates: lint --fix, stylelint:fix, format, `turbo run lint test typecheck` (9/9 tasks green), `check:i18n` clean.

**Boundary**: owns `packages/ui/src/components/AppComboBox/`, `packages/ui/src/index.ts`, `apps/web/app/components/course-edit/CourseMetadataForm.vue`. Does not touch `apps/web/app/pages/admin/**` or the admin dialog components (other lanes' surface).

## T-2026-09-16-admin-dialogs — AppDialog for admin library dialogs, fix post-await composable calls

- Created: 2026-09-16
- Owner: claude
- Spec: —
- Goal: `AdminAddLibrarySheet` and `AdminRemoveLibraryDialog` get real focus
  trap / Escape / focus return via `@app/ui`'s `AppDialog` (#645); the same
  two files plus `AdminEditLibrarySheet` stop calling `useToast()`/`useI18n()`
  after an `await`, where `getCurrentInstance()` is already null (#639).
- Spec diff: none (no API/contract change)
- Codegen impact: no
- Sub-steps:
  - [x] `AdminAddLibrarySheet.vue` — rebuilt on `AppDialog`, dropped hand-rolled
        header/backdrop/close-button markup
  - [x] `AdminRemoveLibraryDialog.vue` — rebuilt on `AppDialog` (+ `AppField`/
        `AppInput`/`AppButton`), dropped manual `role="dialog"`/`Escape` handling
  - [x] `AdminRemoveLibraryDialog.vue` — hoist `useToast()`/`useI18n()` to setup
  - [x] `AdminEditLibrarySheet.vue` — hoist `useToast()`/`useI18n()` to setup
        (markup left as-is — its own dialog-a11y defect is out of #645's named
        scope; filed as a follow-up: tuxedo #201)
  - [x] Update colocated specs for the new markup; delete stale snapshot
  - [x] Prove the composable-after-await regression in a unit test — guard the
        `useToast`/`useI18n` stubs on `getCurrentInstance()` instead of an
        unconditional stub (answers the "what to do with `vi.stubGlobal`"
        question raised in #639: guard it, don't drop it)
  - [x] Verified guarded stub fails pre-fix at the exact lines #639 named,
        for both `AdminRemoveLibraryDialog` and `AdminEditLibrarySheet`
  - [x] `pnpm --filter @app/web lint --fix`, `pnpm stylelint:fix`, `pnpm format`
  - [x] `turbo run lint test typecheck` — 18/18 green
  - [x] Live check on a scratch docker stack (real Chromium via Playwright,
        not jsdom): `AppDialog`-based Add/Remove genuinely `showModal()`,
        focus trap holds over 15 Tab presses (background nav never reachable
        — only transiently parks on `<body>`, a native top-layer artifact),
        Escape returns focus to the trigger. Success-path Edit/Remove: zero
        i18n console errors post-fix; rebuilt pre-fix `AdminEditLibrarySheet`
        against the same stack and reproduced the live crash verbatim
        (`pageerror: Must be called at the top of a \`setup\` function`)
  - [x] Open PR, `Closes #645` + `Closes #639` — https://github.com/kkucherenkov/course_shelf/pull/647
- Status: in-progress (PR open, awaiting review/merge)
- Blockers: —
