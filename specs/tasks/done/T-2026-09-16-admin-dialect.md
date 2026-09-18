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
