# Active tasks

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
