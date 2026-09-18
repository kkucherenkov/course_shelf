## T-2026-09-15-library-register-composable — HTTP + 409 handling duplicated outside useLibraries

- Created: 2026-09-15
- Owner: claude
- Spec: none — `registerLibrary`/`listLibraries` already in the generated
  client; no wire change. Closes #495.
- Goal: `AdminAddLibrarySheet.vue` and `pages/sign-up.vue` (step 3) both call
  `registerLibrary`/`client` directly instead of `useLibraries`, each
  hand-rolling their own idempotent-conflict handling. Pull the HTTP call +
  conflict handling into one place in `useLibraries.ts`.
- Design: extract `registerLibraryRequest` (plain async fn, no
  `useAsyncData`) — resolves a defensive 409 via a fresh `listLibraries` call
  and returns the existing row, or throws `RegisterLibraryError(detail)`.
  `useLibraries().register` becomes a thin wrapper around it (refetches its
  own list cache after). Kept deliberately free of `useAsyncData`: mounting
  the full `useLibraries()` composable in `sign-up.vue` would fire an
  authenticated `listLibraries` GET at step-1 mount time, before the account
  exists — the response interceptor treats that 401 as a dead session and
  redirects to `/sign-in`, breaking the wizard. `registerLibraryRequest` only
  hits the network when actually called (step-3 submit, post-auth).
- Sub-steps:
  - [x] `registerLibraryRequest` + `RegisterLibraryError` in `useLibraries.ts`
  - [x] `AdminAddLibrarySheet.vue` calls it instead of raw `registerLibrary`
  - [x] `pages/sign-up.vue` step 3 calls it instead of raw `registerLibrary`
  - [x] update `useLibraries.spec.ts`'s 409 test for the new call path +
        add coverage for `registerLibraryRequest` itself
  - [x] lint/stylelint/format/typecheck gates green, 387 web tests green
  - [x] PR `Closes #495` — [#553](https://github.com/kkucherenkov/course_shelf/pull/553)
  - [x] CI green on #553
  - [ ] merge #553
- Status: done
- Completed: 2026-09-15
- Blockers: —
