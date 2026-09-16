# Active tasks

## T-2026-09-16-home-honesty — home page gives two answers to one empty state, uneven revoke confirmation

- Created: 2026-09-16
- Owner: claude
- Goal: two defects of the same class — the interface must not give two
  different answers to the same question. Wave 4 audit, 23/40, scoped to
  `apps/web/app/pages/index.vue` and
  `apps/web/app/pages/admin/permissions/[userId].vue`.
- Sub-steps:
  - [x] #633 — `index.vue`'s "recently added" empty row still branched on
        `userRole === 'ADMIN'` only, unaware of `hasLibraryAccess` (added to
        the two sibling rows by `T-2026-09-16-silent-failures`, #623) — a
        member with zero library grants read "ask an admin to add courses"
        one row below the honest no-access message on continue-watching.
        Three states now, not two: no access (reuses
        `pages.browse.emptyNoAccessTitle/Body` verbatim, same as the
        siblings) → then the existing admin/member split, which only makes
        sense once there's a real library to be a member or admin of. Zero
        new locale keys — reused what #623 already wired.
  - [x] found while verifying live on `audit-empty@example.com` (flagged by
        the assessment, not in either issue): `completedCountLabel`
        (`HomeRow`'s `collapsibleMeta`, rendered in the row's header —
        outside its own `status`-gated body) showed "0 courses" during the
        `pending` fetch. Guarded on `status.value === 'success'`, mirroring
        `browse.vue`'s `subtitle` pattern.
  - [x] not touched: `CourseWideCard`'s `resumeLabel` (continue-watching
        "Section 3 · Lesson 7" instead of "34% · 12/40") — traced the
        existing wiring on `courses/[id].vue` (`primaryCTALabel` /
        `resumePosition`) back to `CourseOutlineSummary.sections`; the home
        page's `ContinueWatchingItem` DTO carries only `lastSeenLessonId`
        (an id, no section/lesson number or title) — building this label
        needs a DTO field that doesn't exist. Flagged to maintainer per
        their own stated boundary, not implemented here.
  - [x] admin/permissions/[userId].vue: course-scope grant revoke
        (`@set-course` → `handleSetCourse` directly) fired with no
        confirmation, inconsistent with the library-scope revoke's dialog
        (#606). Generalized the existing `pendingRevokeLibraryId`/
        `revokeDialogOpen` pair into one `pendingRevoke: {kind, id} | null`
        state shared by both rows (`requestSetLibrary`/`requestSetCourse` →
        `requestRevoke` → one `AppDialog`, one confirm/cancel pair) — second
        caller, not a second dialog. Course title for the dialog is a free
        byproduct of the `getCourse` call `ensureCourseLibraryResolved`
        already makes per granted course (#576) — no second fetch. New
        locale key `revokeDialogTitleCourse` (en/ru) since the existing
        `revokeDialogTitle`'s Russian text hardcodes "к библиотеке" (to the
        library) and can't be reused verbatim for a course.
  - [x] tests: `index.spec.ts` extended (3-state matrix on recently-added,
        pending-vs-loaded `collapsibleMeta`); `admin-permissions-user.spec.ts`
        extended (course revoke confirm + cancel, mirroring the existing
        library-revoke pair). Every new/changed assertion confirmed red
        against a `git checkout --` of the pre-fix page file before
        restoring the fix (patch saved and reapplied, not a raw revert).
  - [x] gates: `pnpm design:build` (generated tokens were missing in this
        fresh worktree), lint --fix, stylelint:fix, format, `pnpm
check:i18n`, `pnpm exec turbo run lint test typecheck --filter=@app/web
        --filter=@app/ui` — all green (`@app/web` 563/563, 9/9 turbo tasks)
  - [x] live-stand check — not on the shared `:8090` stand (frozen at
        `417c5cbb`, predates this fix); built this worktree's own isolated
        compose stack instead (`csh-homehonesty-verify-*`, torn down after,
        mirrors `nav-and-keys`' approach). Signed up a fresh admin (`/setup`)
        and a fresh zero-grant member (`/sign-up`) — confirmed by eye: all
        three home rows read identically ("No courses available to you yet"
        / "You have not been granted access to a course library. Ask an
        administrator to grant you access."); granted then revoked a
        course-scope grant on `/admin/permissions/[userId]` as the admin —
        confirmed the dialog now reads `Revoke access to "Seed course —
fundamentals" from Member Zero?` before it fires.
- Status: ready for PR
- Blockers: — (resumeLabel flagged above, needs a DTO change out of this
  lane's scope)

## T-2026-09-16-note-safety — flush pending note save on unmount instead of dropping it

- Created: 2026-09-16
- Owner: claude
- Goal: #632 — `AppNoteEditor`'s debounced `save` emit was cancelled outright
  in `onBeforeUnmount`, silently discarding the last ~600ms of typing on tab
  switch, autoplay-next, or navigation — while the sync indicator kept
  showing the stale "Saved" label from the previous save.
- Sub-steps:
  - [x] `onBeforeUnmount` now flushes the pending debounce
        (`emit('save', modelValue)`) instead of just clearing the timer —
        covers all three loss paths (tab switch, autoplay-next, route
        navigation) in one place, since all three unmount the component the
        same way.
  - [x] `AppNoteEditor.spec.ts`: replaced the test that asserted the old
        (wrong) behaviour ("does not fire save after unmount") with one that
        asserts the flush. Verified red against the pre-fix component, green
        after.
  - [x] live-stand check: built this worktree's own `docker/compose.yml`
        stack on isolated ports (`csh-notesafety-*`, torn down after) since
        the shared `:8090` audit stand runs a frozen pre-fix image. Headless
        Playwright against a real signed-in session: typed a note, switched
        to Sections and back inside the 600ms debounce window — text
        survived, sync indicator read "Saved · just now" confirming the
        flush actually reached the backend, not just local state. Reverted
        the component fix in place (container picks up host edits via bind
        mount) and reran the same script — text lost, matching the reported
        defect exactly. Restored the fix, reran — green again.
  - [x] gates: `@app/ui` lint/test — 23/23 `AppNoteEditor` tests green.
- Status: ready for PR
- Blockers: —
- Not fixed (flagged, not in scope): `PlayerNotesTab.vue` duplicates the
  "N time ago" formatter a third time in the project (admin has its own,
  fixed by another lane this wave) — no shared helper exists yet; told the
  maintainer rather than introducing one unasked.

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
