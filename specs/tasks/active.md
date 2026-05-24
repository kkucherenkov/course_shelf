# Active tasks

## T-2026-05-24-011 — Critique fixes: Search + Auth (defect pass)

- Created: 2026-05-24
- Owner: claude
- Spec: `.impeccable/critique/2026-05-24T16-24-42Z__apps-web-app-pages-search-vue.md` (26) + `…sign-in-vue.md` (28)
- Goal: clear the verifiable defects on Search + Auth; marketing/SSO removed from auth per the brief (user ruling).
- Acceptance:
  - Search: error-state retry actually re-runs the query; error copy is actionable; no-results action is coherent
  - Auth: rate-limit countdown correct (m:ss, no double-render); "keep me signed in" honored (rememberMe); marketing aside + SSO block gone; success toast on sign-in
- Spec diff: none
- Codegen impact: no
- Design impact: `@app/ui` — none new; auth drops `AuthMarketing`/`AppSsoBlock` usage
- Tests: existing suites green; i18n parity (en/ru)
- Sub-steps:
  - [x] Search: `useSearch.retry()` + AppButton; errorStatus-based copy; no-results body/action (→ /browse)
  - [x] Auth: rate-limit countdown (slot + formatter); keep-signed-in → `rememberMe`; remove AuthMarketing + SSO; success toast
  - [x] i18n (en/ru)
  - [x] lint/format/tests (eslint clean; i18n parity en/ru; @app/ui suite green)
- Status: in-progress (awaiting commit/PR)
- Blockers: —

## T-2026-05-24-012 — Critique fixes: Lesson player (next PR)

- Created: 2026-05-24
- Owner: claude
- Spec: `.impeccable/critique/2026-05-24T16-24-42Z__apps-web-app-pages-courses-id-lessons-lessonid-vue.md` (26)
- Goal: localize the player + fix navigation affordances; (pairs with the AppPlayerChrome i18n work).
- Sub-steps:
  - [ ] `AppPlayerChrome`: i18n label props (P1) + wire from page via `t()`
  - [ ] localize `lessonSubtitle` + `PlayerBookmarksTab` "+ Bookmark" string
  - [ ] prev/next disabled at course bounds (`hasPrev`/`hasNext`)
  - [ ] (later) chrome auto-fade (animate) + bottom context-bar (adapt)
- Status: queued
- Blockers: —
