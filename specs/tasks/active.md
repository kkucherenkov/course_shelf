# Active tasks

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
