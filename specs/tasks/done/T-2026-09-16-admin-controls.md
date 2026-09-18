## T-2026-09-16-admin-controls — dead role selector on /admin/permissions, inert density control

- Created: 2026-09-16
- Owner: claude
- Goal: two controls that look interactive but aren't, both eroding trust in
  the rest of the admin UI (heuristic 1 — visibility of system status /
  heuristic 9 — honest affordances). Third audit pass: 25/40, target 32+.
- Sub-steps:
  - [x] #619 — `admin/permissions/index.vue`'s role chip opened a real
        listbox but `@role-change="() => {}"` silently dropped every
        selection. Added `rolesEditable`/`roleReadOnlyTooltip` props to
        `AdminUserRow` (orthogonal to the existing `isSelf` self-protect
        axis) so the chip renders genuinely read-only here — roles are
        changed on `/admin/users`, reusing the already-written
        `roleChipReadOnlyTooltip` key. Also fixed the dead `@more="() => {}"`
        (now shows the same "coming soon" toast `/admin/users` already
        gives) and the dishonest `edit-aria-label` (`addGrantCta` → "Add
        grant" → reused `editPermissions`, matching what the button
        actually does: navigate to the user's permissions page). Zero new
        i18n keys — every string reused from `/admin/users`' existing wiring.
  - [x] #622 — `[data-density='compact']` never shrank `AppInput`/`AppSelect`
        (density has been inert since #585 removed the third `cozy` option);
        instead it applied `height:30px` to `<html>`. Root cause confirmed by
        building `@app/ui` and reading `dist/index.css`: the Vue SFC scoped-
        CSS compiler drops everything after `:global(sel)` when a descendant
        combinator follows outside the parens, collapsing
        `:global([data-density='compact']) .app-input--md` to a bare
        `[data-density=compact]{...}`. Fixed by wrapping the _whole_ selector
        in `:global(...)`, verified against the compiled CSS and a headless
        screenshot (icon fields don't clip at the 30px compact height).
        AppSelect had the identical bug, fixed the same way.
  - [x] also: `AdminUserRow.vue`'s joined-date formatter was hardcoded to
        `'en-US'`, showing an English date under the Russian locale — now
        uses `useI18n().locale`.
  - [x] tests: `AdminUserRow.spec.ts` (+6), new
        `pages/__tests__/admin-permissions-index.spec.ts` (4), `AppInput`/
        `AppSelect` `.spec.ts` source-pattern guards against the `:global()`
        regression (documented as a deliberate lighter-weight check than a
        full compiled-CSS test — see the `ponytail:` comment in
        `AppInput.spec.ts`). Every new assertion confirmed red against the
        pre-fix source before restoring the fix.
  - [x] gates: `@app/web` lint/stylelint/format clean, 531/531 tests;
        `@app/ui` lint clean, 931/931 tests; both typecheck clean (after
        `pnpm design:build` — the generated tokens file is gitignored and
        was simply missing in this fresh worktree, not a real defect).
- Status: ready for PR
- Blockers: —
- PR: https://github.com/kkucherenkov/course_shelf/pull/627 (merged)
