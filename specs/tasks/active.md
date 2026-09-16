# Active tasks

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

## T-2026-09-16-admin-polish — mislabeled navigation, filter-blind empty state, missing confirmations

- Created: 2026-09-16
- Owner: claude
- Goal: heuristic 6 (recognition over recall) + admin-polish's half of the
  confirmation-policy pass, on `apps/web/app/pages/admin/{permissions,identify-tasks}/**`
  and `AdminIdentifyTask*.vue`.
- Sub-steps:
  - [x] #599 — `permissions/[userId].vue`: two buttons labeled for an action
        they don't perform (`errorRetry`/`addGrantCta` both just navigate to
        `/admin/permissions`) get a label naming the actual transition;
        `overridesByLibrary`'s in-flight `getCourse` resolution no longer lets
        the badge count creep up silently — skeleton stays until resolved
  - [x] #600 — `identify-tasks/index.vue` empty state learns about its own
        default `status=proposed` filter (mirrors `browse.vue`'s
        `'filtered'` empty-kind + "show all" action)
  - [x] #606 (admin-polish half) — confirm dialogs for the two heaviest
        unconfirmed actions on this surface: revoking a library grant
        (`handleSetLibrary`, names who/what) and applying an identify task
        (`AdminIdentifyTaskReview`, shows changed-field count)
  - [x] gates: lint, stylelint, format, `turbo run lint test typecheck` — all
        green (474 web + 918 ui tests)
- Status: in-progress — PR #611 open, all checks green except one
- Blockers: "Storybook visual regression" fails on PR #611 with 3 drifted
  stories (`AppNavigationShell`, `AppPlayerChrome`, `IconCS`) — none in this
  branch's diff (no `packages/ui` files touched). Confirmed pre-existing:
  the same check already fails on `main` at `ed3653d0` and `a99a7b80` before
  this branch diverged. Out of this lane's file ownership
  (`AppNavigationShell`→`a11y-document`, `AppPlayerChrome`→
  `audit-regressions`, `IconCS` unowned this wave) — flagged to maintainer
  rather than fixed here.

## T-2026-09-16-edit-guard — fix three "UI lies about state" defects

## T-2026-09-16-i18n-plurals — Russian pluralization audit (#582, #594)

- Created: 2026-09-16
- Owner: claude
- Goal: `apps/web/i18n/i18n.config.ts` never configured `pluralRules`, so
  vue-i18n applied English's two-form rule to every three-form pipe-plural
  Russian message — wrong noun form on every screen that shows a count. Also
  audited every pipe-form message in both locales for structural bugs
  (content confined to one plural alternative, ru/en cross-contamination).
- Sub-steps:
  - [x] #594 — add `pluralRules.ru` (CLDR one/few/many by last 1-2 digits) in
        `apps/web/i18n/plural-rules.ts`, wired from `i18n.config.ts`
  - [x] #594 — split `statLibrariesMeta` (courses + lessons in one message,
        can't carry two independent plural indices) into
        `statLibrariesMetaCourses` / `statLibrariesMetaLessons`, both locales
  - [x] #582 — same root cause fixes "0 курс" → "0 курсов" on `/browse` and
        the home dashboard
  - [x] found in audit (not named in either issue): `statLastScanMeta` and
        `pages.search.headerCount` each confined static content
        (`{libraryId}`, `{q}`) to one plural alternative, so it vanished for
        every count except the one that alternative belongs to — fixed by
        repeating the content in every alternative, both locales
  - [x] audited full `ru.ts`/`en.ts` for remaining pipe-strings (18/18 in each
        file, all now correct) and ru/en cross-contamination (none found)
  - [x] regression test `apps/web/tests/unit/i18n-plural.spec.ts`, confirmed
        red pre-fix on the three structural bugs
  - [x] gates: lint, format, typecheck, `pnpm check:i18n`, `turbo run lint test typecheck --filter=@app/web` (486/486)
  - [ ] flagged to maintainer, not fixed (outside `apps/web/i18n/**`):
        `apps/web/app/pages/admin/index.vue:54-58` still calls the removed
        `statLibrariesMeta` key — needs to call both new keys and join with
        `·`; `apps/web/app/pages/index.vue:126-129`
        (`completedCountLabel`) shows "0 courses" during loading, unguarded
        by fetch status (unlike `browse.vue`, which already guards this)
- Status: in-progress
- Blockers: two follow-up edits identified outside owned file scope — see
  sub-steps above; not touched, pending maintainer call

## T-2026-09-16-a11y-document — document-level a11y: lang/title, landmarks, role=row, focus/labels, degraded-auth state, accelerators

- Created: 2026-09-16
- Owner: claude
- Goal: heuristics 7 (flexibility) + 10 (help/docs) + document-class a11y
  defects — raise Nielsen audit score, not just close tickets.
- Sub-steps:
  - [x] #589 — `html[lang]` bound to active locale (app.vue + static baseline
        in nuxt.config.ts), per-route `<title>` via existing page-title keys
        (route→key map lives in app.vue; zero new i18n keys, zero other-lane
        page files touched)
  - [x] #590 — `<main>` landmark for the 6 `layout:false` pages (shared
        `AuthLayout.vue` + `setup.vue`/`__tokens.vue`/`reset.vue` own markup);
        confirmed the 1174 `region` violations were the same root cause as
        `landmark-one-main`, not a separate fix
  - [x] #591 — drop orphaned `role="row"` from `AdminUserRow.vue` (neither
        `/admin/users` nor `/admin/permissions` wraps it in a table/grid)
  - [x] #597 — search input `type=search` + reused-placeholder aria-label +
        `:focus-within` ring; `AppAvatar` gained a `role-label` prop wired
        from every caller (killed the hardcoded English, reuses each
        caller's already-translated roleLabel); theme-toggle aria-label
        states current state via string composition of existing keys;
        bottom-tab active state gets `font-weight` beyond the color change.
        AppTabs/PlayerSidebar mislabeling — confirmed caller-side, handed to
        `audit-regressions` (owns `PlayerSidebar.vue`) per maintainer; not in
        this lane's PR.
  - [x] #602 — `layouts/default.vue` renders the shell on bearer-token
        presence, not hydrated-profile presence (maintainer's preferred
        fix; no new copy, `shellUser` already degrades gracefully to blank)
  - [x] #607 — mounted `AppCommandPalette` + Cmd/Ctrl+K in the layout,
        commands built from the existing nav/action labels; language toggle
        next to the theme toggle (self-referential locale names via
        `useI18n().locales`, `setLocale()` on click — no translation needed)
  - [x] admin nav: `/admin/libraries` sidebar entry renamed to "Manage
        libraries" (`ru`: "Управление библиотеками"), distinct from the
        member-facing `/libraries` "Libraries"
  - [x] i18n: 4 new keys added directly to `apps/web/i18n/locales/{en,ru}.ts`
        (maintainer OK'd — new keys are additive, union-mergeable, distinct
        from `i18n-plurals`'s job of editing existing plural strings):
        `ui.commandPalette.{title,placeholder,empty}`,
        `pages.admin.navLibrariesManage`
  - [x] tests: `apps/web/app/__tests__/app.spec.ts` (new), layout/UI specs
        extended for every prop/behaviour above; `AdminUserRow` snapshot
        regenerated (role=row removal); web 476/476, ui 925/925 green
  - [x] gates: lint, stylelint, format, `check:i18n`,
        `turbo run lint test typecheck --filter=@app/web --filter=@app/ui`
        all green
  - [x] Storybook visual baselines regenerated via `regen-snapshots.yml`
        (`suite: storybook`) — `AppNavigationShell` PNGs (locale toggle +
        bold active tab shift every story's topbar/bottom-tab a few px)
- Status: in-progress

## T-2026-09-16-audit-regressions — fix regressions from the previous audit-fix wave

- Created: 2026-09-16
- Owner: claude
- Goal: three defects the last wave introduced (#596) plus this lane's half
  of the confirmation-policy inversion (#606) — heuristics 3 (user control)
  and 4 (consistency), audit target 22/40 → 32/40+.
- Sub-steps:
  - [x] #596-1 — `AppPlayerChrome` overlay never returns on tap (no
        `@click`/`@pointerdown` listener). Fixed with one `@click` handler on
        the root: interactive descendants (`button`, `[role="slider"]`,
        `a`, `dialog`) opt out via `closest()`; otherwise idle-hidden →
        reveal, else → toggle play (doubles as the tap-to-play/pause
        affordance the player never had). Verified red before fix.
  - [x] #596-2 — verified against the actual repository (not just the read):
        `findManyByUser` has no `percent`/completion filter, so a finished
        course stays in continue-watching as long as `lastSeenAt` is recent.
        Fixed client-side in `resumeLesson` (backend/`get-continue-watching`
        is outside this lane's owned surface) — `continueWatching` is
        ignored once `courseState === 'completed'`. Verified red before fix.
  - [x] #596-3 — decided: apply `effectiveLessonState` in
        `CourseSectionsList.vue` too (same treatment already reviewed for
        `PlayerSectionsTab.vue`), so the two lesson-badge displays agree.
        `courseState` / "Your week" stay on server truth on purpose — the
        threshold is a display nicety for one row, not a second source of
        truth for course completion. No spec change. Maintainer signed off
        on the decision but required the settings hint to say honestly what
        the threshold does and doesn't affect — rewrote
        `pages.settings.playbackThresholdHelp` (en/ru). Verified red before
        fix.
  - [x] #606 (this lane's half, part 1) — removed the confirm dialog from
        Reset progress (`CourseActions.vue`): own data, fully reversible,
        fires straight through like Mark complete already does. Verified
        red before fix.
  - [x] #606 (this lane's half, part 2) — added a shared confirm dialog for
        Rescan/Transcribe on `courses/[id].vue` (maintainer approved adding
        new `pages.courseDetail.*` locale keys directly — the i18n-ownership
        rule is about editing existing strings, not adding new ones).
        Verified red before fix.
  - [x] #597 — `PlayerSidebar.vue` passed `AppTabs`' `label` (the tablist's
        own accessible name) the same string as the first `AppTab`'s label,
        so a screen reader announced "Sections, tablist, Sections, tab 1 of
        5". Added a distinct `tabsLabel` prop / `sidebarTabsLabel` locale
        key. `AppTabs` itself is `a11y-document`'s surface and was already
        correct — the bug was in this lane's caller. Verified red before fix.
  - [x] `settings.vue:12` — fixed stale "density (3-up picker)" comment (2
        options today)
  - [x] gates: lint, stylelint, format, i18n-parity, `turbo run lint test
typecheck --force` — all green (`@app/web` 475/475, `@app/ui`
        922/922)

## T-2026-09-16-fix-scan-progress-visibility — honest scan progress, one clock, wired buttons

- Created: 2026-09-16
- Owner: claude
- Goal: scan progress card stops lying about state (heuristic 1 — visibility
  of system status). `#593`: percent is hardcoded 0 (no `totalFiles` on
  `ScanDto`, and that's correct — replace with an indeterminate bar + the
  already-existing "files scanned" counter, not a fake percent); the two
  renders of the same running scan (page vs notifier) disagree on
  added/updated/errors; Cancel button has no backing endpoint (`cancelled`
  is v2-reserved per openapi.yaml) — remove it; "N errors" button is
  unwired — wire it to the real `ScanError[]` already on `ScanDto`. `#603`:
  two independent elapsed-time clocks (2s-poll-bound computed vs a separate
  1s timer) drift apart for the same scan — consolidate into one shared
  clock.
- Sub-steps:
  - [x] #593 — remove fake `percent`; indeterminate bar while running, full
        bar on terminal states; fix admin page's hardcoded
        added=0/updated=0/errors=0 to real `liveScan` values; drop dead
        Cancel button + prop/emit from `AppScanProgress`; wire
        `errors-clicked` (admin page: inline error list from
        `liveScan.errors`; notifier: navigate to the library's admin page)
  - [x] #603 — `useElapsedTime` composable: one shared 1s clock used by both
        `useScanProgress` and `ScanLifecycleNotifier`
  - [x] gates: lint, stylelint, format, `turbo run lint test typecheck`
        (@app/web 475/475, @app/ui 918/918, both clean)
- Status: ready for PR
- Blockers: —
