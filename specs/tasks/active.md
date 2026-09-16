# Active tasks

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
