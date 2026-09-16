# Active tasks

## T-2026-09-16-silent-failures — error/empty states that go silent (#624), home/browse persona mismatch + reset-progress confirm (#623 partial)

- Created: 2026-09-16
- Owner: claude
- Goal: heuristic 1 (visibility of system status) — close #624 within this
  lane's file ownership (`AppEmptyState/AppErrorState/AppNoPermission/AppBanner`,
  `search.vue`, `index.vue`, `CourseActions.vue`), and this lane's slice of
  #623 (not closeable — other lanes own the rest).
- Sub-steps:
  - [x] slot-name grep across `@app/ui` + consumers: only one mismatch found
        (`admin/libraries/index.vue:115` uses `#actions`, the 3 state
        components gate on `action`) — that file is `scan-surface`'s, so fix
        it in the shared components instead: `action`/`actions` both work
        (fallback-slot alias), zero cross-lane file edits needed
  - [x] `index.vue`: 4 home rows show an error title with no body
        (`continueWatching`/`recentlyAdded`/`recentlyCompleted`/`yourWeek`) —
        wire `errorBody` through `HomeRow.vue`/`HomeYourWeek.vue`, add
        matching en/ru keys
  - [x] `index.vue` vs `browse.vue` persona mismatch (#623): a user with zero
        library grants sees "start a course"/"finish a course" copy on
        `continueWatching`/`recentlyCompleted` instead of the honest
        no-access message `browse.vue` already has — branch those two rows
        on the same no-access signal `browse.vue` uses (`useLibraries`),
        reusing `pages.browse.emptyNoAccessTitle/Body` verbatim (no new copy)
  - [x] `search.vue:117`: hand-rolled `role="alert"` div replaced with
        `AppErrorState` (third bespoke error-rendering form in the app)
  - [x] verified, NOT a bug: the "4 identical `errorGeneric` strings" finding
        (sign-in/sign-up/forgot) — each already buckets known causes
        (wrong credentials, rate limit, taken email, bad/expired token, OTP
        errors) before falling back to the shared generic string; the
        fallback string being reused across pages is not the defect. Not
        touched (also outside this lane's file list).
  - [x] `CourseActions.vue`: fix the comment's false "fully reversible by
        rewatching" claim (largest course in the audit DB is 540 lessons,
        no undo) — confirm dialog restored via `courses/[id].vue`'s existing
        shared rescan/transcribe `AppDialog`, extended with a third `reset`
        branch (page-level gate; `CourseActions` itself keeps emitting
        directly, unchanged)
  - [x] found while verifying the above live (not in either issue):
        `AppDialog` never actually showed for **any** consumer mounted via
        `v-if` with `open` already `true` on creation — the exact pattern
        every confirm dialog on `courses/[id].vue` uses (rescan, transcribe,
        now reset). A non-immediate `watch` only fires on a later _change_,
        so `.showModal()` never ran on that first render: the native
        `<dialog>` stayed closed and invisible in a real browser. jsdom
        component tests never caught it — `.exists()` is true either way,
        `showModal()` is a no-op there without the element ever needing to
        actually paint. `immediate: true` on the watch does not fix it
        either (its first call runs synchronously in `setup()`, before the
        template ref binds) — moved the "already open at mount" case to
        `onMounted`. Also found and fixed while it was open in a real
        browser for the first time: the dialog rendered visible but pinned
        to the page's top-left instead of centered (Tailwind's preflight
        strips the margin the native centering relies on, plus a
        `position`-ed ancestor gives the UA's `position: absolute` the
        wrong containing block) — explicit `position: fixed; inset: 0;
margin: auto`. `AppDialog` isn't in this wave's ownership table;
        fixed directly since it silently broke this lane's own restored
        confirm dialog and every existing rescan/transcribe one. New spec
        case (mount-already-open); full `@app/ui`/`@app/web` suites still
        green (933/933, 533/533).
  - [x] confirmed against `tests/e2e/course-detail.spec.ts:336` (pre-existing,
        not written by this lane) — red on `main` since a5ef065c/#611
        (`.app-dialog` locator never found: the wave that dropped the
        confirm never updated this test, and Playwright isn't a required
        branch-protection context, so it merged red). Reverted
        `courses/[id].vue` + `AppDialog.vue` to `HEAD` and reran: red,
        `.app-dialog` not found, matching CI exactly. Restored the fix: full
        `course-detail.spec.ts` green (8/8); full `pnpm e2e` green except
        one pre-existing, unrelated failure (`smoke.spec.ts`'s real-backend
        health check — no backend was running for this manual pass; every
        other spec is route-mocked and hermetic).
  - [x] gates: lint, stylelint, format, `pnpm check:i18n`,
        `turbo run lint test typecheck` (@app/web 533/533, @app/ui 933/933)
- Status: ready for PR
- Not closing #623 (other lanes own the rest); not touching
  `admin/libraries/[id].vue` (scan-surface) or `layouts/default.vue`'s
  discarded `useScanLifecycle` status (nav-and-keys) — flagged, not fixed.

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

## T-2026-09-16-scan-surface — errors survive scan completion, honest toast, visible start failure

- Created: 2026-09-16
- Owner: claude
- Goal: `#620` the real per-file `ScanError[]` (fetched by `useScanProgress` via
  `GET /libraries/{id}/scans/latest`, which returns the latest scan's full
  detail regardless of terminal status) is only ever rendered inside
  `v-if="showScanProgress"` — the moment a scan finishes, `showScanProgress`
  goes false and the 106-error list becomes unreachable even though the data
  is still in memory. `#621` the completion toast is wrong three ways:
  `toastFailedSummary` is called with `{ errors: n }` but vue-i18n only reads
  a plural index off `named.n`/`named.count`, so it always renders the first
  form; `toastDoneSummary` is one non-pluralizable string
  (`'{courses} courses · {lessons} lessons'`), not two pipe-messages like the
  `statLibrariesMeta*` split; and the "lessons" number is actually
  `card.filesAdded` (TODO(E13) — no lesson count on the wire), so it lies
  after any rescan. `#624` (partial — only the one line in this lane's file;
  rest belongs to `silent-failures`): `admin/libraries/[id].vue:161` calls
  `runLibraryScan({ throwOnError: false })` and never checks `res.error`, so
  a 403/500 start failure is silent, and the dead `catch` path's toast title
  is the CTA label (`scanNowCta`), not an error message.
- Sub-steps:
  - [x] #620 — moved the error list out from under `showScanProgress`, gated
        only on `scanErrorsOpen && hasScanErrors`; `AdminScansTable`'s
        `errorsCount` cell becomes a button (new `expandableScanId`/
        `expandedScanId` props + `toggle-errors` emit) for the one row that
        actually has detail data — the library's latest scan, same id
        `useScanProgress` already holds. Historical rows have no per-scan
        detail endpoint on the wire (`AdminScanListItem` only carries
        `errorsCount`), so their cells stay static, unchanged from before.
  - [x] #621 — `toastFailedSummary` call switched to the 3-arg
        `t(key, count, { named: { n: count } })` form already used by
        `errorsButton` in the same file; `toastDoneSummary` split into
        `toastDoneSummaryCourses`/`toastDoneSummaryFiles` (renamed from
        "lessons" — honest about what `filesAdded` counts — closes the
        TODO(E13) by relabeling rather than a spec change), joined with `·`
  - [x] #624 (this lane's line only) — `triggerScan` checks `res.error`,
        shows a real error toast (`scanStartError`, mirrors
        `toastRescanError`'s wording) on both the checked-error and thrown
        paths; rest of #624 stays with `silent-failures`
  - [x] i18n: `pages.admin.libraryDetail.scanStartError`,
        `notifiers.scan.toastDoneSummaryCourses`,
        `notifiers.scan.toastDoneSummaryFiles`; `toastFailedSummary`
        placeholder renamed `{errors}` → `{n}`; both locales
  - [x] regression tests: scan-progress page spec (error list survives the
        running→terminal transition), notifier spec (plural index + split
        toast), page spec (silent start failure), AdminScansTable spec
        (button only on the matching row). Confirmed red before fix.
  - [x] gates: lint, stylelint, format, `check:i18n`,
        `turbo run lint test typecheck` — all green
- Status: ready for PR

## T-2026-09-16-nav-and-keys — dead-end nav link, raw locale key on admin dashboard

- Created: 2026-09-16
- Owner: claude
- Goal: #618 non-admins see "Libraries" in primary nav and get silently
  bounced by `middleware/admin.ts`; #617 `/admin` prints the literal key
  `pages.admin.dashboard.statLibrariesMeta` (deleted from both locales when
  a prior wave split it into two plural-safe keys, call site never updated).
  Structural: add a literal-`t()`-key-resolves-in-locale-tree check so this
  class of regression fails CI instead of shipping.
- Sub-steps:
  - [x] #618 — drop `libraries` from `layouts/default.vue`'s primary `nav`
        (decision: not gated-for-admin-only like `adminNav`, but removed
        outright — it duplicated `admin-libraries`; `/libraries` has been
        admin-only since #595 and that page's own comment already calls
        `/admin/libraries` "the equivalent surface"). Removed the now-false
        "member-facing /libraries link" comment and the two now-dead
        `navLibraries` locale keys (en+ru, both namespaces).
  - [x] #617 — `admin/index.vue`'s `statLibrariesMeta` now composes the two
        split keys (`statLibrariesMetaCourses`/`...Lessons`) with the
        existing `·` separator convention instead of calling the deleted
        combined key. Also fixed `formatRelative`'s hardcoded English
        `"Xs ago"` literals (an i18n-mandatory violation) to reuse
        `ui.noteEditor.ago*`, and deleted the dead `statusLabel` function +
        its false "referenced indirectly" comment + now-unused `ScanStatus`
        import.
  - [x] add `apps/web/app/pages/__tests__/admin-dashboard.spec.ts` (page had
        none)
  - [x] `scripts/check-i18n-parity.ts`: walks `apps/web/app` for literal
        `t('…')` calls and flags any that resolve in neither locale; proved
        it against the pre-fix `admin/index.vue` (caught the exact #617
        key), skips `t(someVar)` (one real case, `app.vue:60`, untouched)
  - [x] gates: lint, stylelint, format, `turbo run lint test typecheck` — all
        green (530 web tests, 929 ui tests, 18/18 turbo tasks)
  - [x] live-stand check: built this worktree's own docker/compose.yml stack
        on isolated ports (`csh-navkeys-verify-*`, torn down after) since the
        shared :8090 audit stand runs a frozen pre-fix image. Confirmed both
        fixes by eye: non-admin sidebar shows only Home/Browse (no
        Libraries trap), admin dashboard's Libraries card reads
        "0 courses · 0 lessons" (not the raw key), admin sidebar has exactly
        one library-management entry
- Status: in-progress — PR #625 open
- Blockers: —

Reported to maintainer, not fixed here (owned by other lanes / not mine):
`nuxt.config.ts:30` claims locale messages live in `.json` (they're `.ts`);
three more `formatRelative` English-literal copies at
`admin/libraries/[id].vue:143`, `AdminScansTable.vue:44`,
`AdminLibraryRow.vue:35` (scan-surface lane) — same `ui.noteEditor.ago*` fix
applied here to `admin/index.vue`'s copy.

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
