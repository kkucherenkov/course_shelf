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
- PR: https://github.com/kkucherenkov/course_shelf/pull/628 (merged)
