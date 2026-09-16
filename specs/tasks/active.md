# Active tasks

## T-2026-09-16-layout-headings — main landmark overflow, admin/lesson headings, landmark labels

- Created: 2026-09-16
- Owner: claude
- Goal: audit round 3 (25/40) fixes — #616 regression (main landmark 4px
  wider than viewport at 375px, from #590's landmark work) + #623 heading
  structure (missing h1 on 8/9 admin pages, no heading at all on
  `permissions/[userId].vue` and the lesson player) + #623 landmark-label
  plumbing (`AppNavigationShell` must accept `sidebar-label`/
  `right-rail-label` and not silently fall back to an English literal).
- Sub-steps:
  - [x] #616 — root cause: `.app-navigation-shell__right` is a grid item
        with no `overflow`/`min-width` override, so its automatic minimum
        width (the topbar's un-shrunk content) blew the single-column
        mobile grid track past the viewport by however much that content
        overflowed — 375px audited on the live stand measured +10px on
        `/` (report's own +4px was presumably a different page/persona,
        same mechanism). Fixed with one `min-width: 0` on `&__right`,
        letting the track clamp to the real available width and `&__search`
        actually shrink into it. Verified red before fix, green after, on a
        local dev server (not the audit stand — that runs a baked image);
        regression test added: `tests/e2e/home.spec.ts` "375x800 › document
        never scrolls horizontally". Checked 320px per the ticket's ask —
        clean at the grid-track level (`&__right`/`&__topbar` both now
        report a genuine 320px box), but the topbar's own children still
        don't fit in 320px (a pre-existing, un-audited content-floor issue,
        not this regression) — flagged to maintainer, not fixed here.
  - [x] #623 (headings) — h1 on all 9 admin pages (`users`,
        `permissions/index`, `permissions/[userId]` — had zero headings,
        now an h1 on the loaded-user name — `libraries/index`,
        `libraries/[id]`, `identify-tasks/index`, `backups`, `admin/index`;
        `identify-tasks/[id]` already had an h1) — sibling `h3`s directly
        under a promoted `h1` bumped to `h2` so no level gets skipped
        (`libraries/[id]` ×2, `admin/index`, `backups`). Lesson player
        (`courses/[id]/lessons/[lessonId].vue`) had no heading and no
        data-driven `<title>` (app.vue explicitly deferred both as a
        follow-up) — added a visually-hidden `h1` + page-local `useHead()`,
        both driven by `lessonData.title`, falling back to a generic
        translated "Lesson"/"Урок" only before the lesson loads. New i18n
        key `pages.lessonPlayer.title` (en/ru). Regression test:
        `tests/e2e/lesson-player.spec.ts` "document heading" (tab title +
        hidden h1), verified red (showed the bare app name) before the fix.
  - [x] #623 (landmark labels) — `sidebarLabel`/`rightRailLabel` changed
        from optional-with-English-default to required, no default: a
        missing/forgotten label is now a type error and a Vue prop-
        validation warning instead of a silent English fallback (exactly
        the gap that let this live through two prior audits). Updated the
        colocated spec/story to pass real values. `layouts/default.vue`
        unblocked mid-task (nav-and-keys merged and closed) — wired
        `:sidebar-label`/`:right-rail-label` from two new `ui.nav.*` keys
        (en/ru) myself.
  - [x] Storybook visual regression checked by hand against the 7 committed
        `AppNavigationShell` baselines (own chromium binary, same
        `#storybook-root` capture method as the test-runner, pixelmatch
        diff) — 0.25–0.62% drift on every story including ones the CSS
        change cannot reach (`light-mode`, `menu-open`), all pure font
        anti-aliasing noise from a non-Docker Chromium (the config's own
        documented caveat), no structural shift. Confirmed both `Narrow`
        stories still render at desktop width regardless of the
        `mobile1` viewport parameter (a pre-existing test-runner gap, not
        touched) — the single-column branch the fix targets never actually
        gets exercised by these snapshots. Baselines left untouched.
  - [x] gates: lint, stylelint, format, `check:i18n`,
        `turbo run lint test typecheck --filter=@app/web --filter=@app/ui`
        — all green (`@app/web` 524/524, `@app/ui` typecheck clean)
- Status: ready for PR
- Blockers: — (320px topbar content-floor and the pre-existing
  desktop-width Storybook viewport gap flagged above, not fixed — out of
  this ticket's stated criterion)

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
