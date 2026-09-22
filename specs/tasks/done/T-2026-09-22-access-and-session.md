## T-2026-09-22-access-and-session — Fix access, session-visibility and entry-point defects from the 1.9.0 pre-release audit

- Created: 2026-09-22
- Owner: claude
- Spec: `~/audit-courseshelf/run20/assessment-a.md` (findings 2, 3, 4, 5, 11, 12), `~/audit-courseshelf/run20/synthesis.md`
- Goal: a first-time user can find and use `/flashcards/review`, a non-admin
  never sees the admin dashboard shell, an unconfirmed session is visible
  instead of silently anonymising the app, a no-grants user has a next step,
  and every screen (404 included) keeps its title and its chrome.
- Acceptance:
  - `/flashcards/review` has a permanent sidebar + bottom-tab entry, with a
    due-count badge when cards are due.
  - The review screen tells "no cards yet" (with a link to make one) apart
    from "done for today" — never both as the same "all reviewed" message.
  - `/admin/*` shows a loading state while role is unconfirmed and an inline
    "no access" screen (no retry button) once role is confirmed non-admin —
    never the real dashboard.
  - `get-session` has its own rate-limit budget, separate from sign-in's.
  - An unconfirmed session shows a visible, retryable banner instead of
    silently degrading the sidebar to anonymous.
  - `/` and `/browse`'s no-grants screen shows a configured contact address
    when the deployer sets one.
  - 404 renders inside the authenticated shell (when a session exists) and
    always carries a non-empty `<title>`.
  - `/flashcards/review` and `/admin/scrapers` have distinct `<title>`s.
- Spec diff: none (`packages/specs/` is out of scope for this lane; the
  no-grants request-access flow, if delivered, would need one — see report).
- Codegen impact: no.
- Design impact: `AppNavigationShell`'s `NavItem` gains an optional `badge`
  count, rendered in the sidebar, bottom-tab bar and overflow dialog.
- Tests: unit (auth-throttle predicates, `useAdminAccess`, `AdminAccessGate`,
  review page empty-state split), `@app/ui` spec updates for the nav badge,
  existing web/backend suites green, `pnpm check:i18n` green.
- Sub-steps:
  - [x] Read audit report + synthesis, confirm findings against source.
  - [x] Backend: split `get-session` off the sign-in-shared throttle budget.
  - [x] Web: permanent nav entry + due-count badge for flashcards review.
  - [x] Web: split the flashcards review empty state (never/done-for-today).
  - [x] Web: `/admin/*` three-state gate (loading/denied/granted) via a new
        `AdminAccessGate` component, replacing `admin.ts`'s redirect.
  - [x] Web: visible "session unconfirmed" banner + retry.
  - [x] Web: no-grants contact block on `/` and `/browse` (CTA + contact only).
  - [x] Web: 404 renders inside the shell + always has a title.
  - [x] Web: page titles for the two new 1.9.0 screens.
  - [x] Lint/format/test/i18n gates green.
  - [x] PR against `main`.
- Status: done
- Blockers: —
- Completed: 2026-09-22
- Result: https://github.com/kkucherenkov/course_shelf/pull/788
