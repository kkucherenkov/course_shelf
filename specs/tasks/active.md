# Active tasks

## T-2026-09-16-auth-bearer — session restore and refresh go through bearer, not cookies

- Created: 2026-09-16
- Owner: claude
- Spec: none — bug fixes reported by the maintainer from a live audit.
  Closes #577, #572.
- Goal: `useAuthStore.refresh()` (and everything routed through it —
  `auth.global.ts`, `api.client.ts`'s 401 handler, `useStreamUrl`,
  `useScanLifecycle`) must authenticate `getSession()` with the bearer token
  from `localStorage`, not rely on the `better-auth.session_token` cookie.
  With cookies cleared and a valid token in storage, `refresh()` currently
  always returns `false` and bounces the user to `/sign-in`.
- Root cause: `createClient()` in `stores/auth.ts` sets
  `fetchOptions.credentials: 'include'` but never attaches an
  `Authorization` header to Better Auth's own client — only the generated
  `@app/api-client-ts` client gets that treatment, via `api.client.ts`'s
  request interceptor. Better Auth's `$fetch` never sees the header.
- Fix: pass a `Bearer` `auth` accessor through `createClient()`'s
  `fetchOptions.auth` so every Better Auth client call (not just
  `getSession`) carries the token automatically — the same mechanism
  `@better-fetch/fetch` already exposes and the same shape as
  `api.client.ts`'s interceptor, just at the client-config layer instead of
  per-request.
- Related (#572): with the header never attached, every `refresh()` call
  failed and left the dead token in `localStorage`, so every subsequent
  navigation re-attempted the same doomed round-trip. `refresh()` now clears
  the stale token on a confirmed "no session" response (no error, no user),
  while leaving it in place on a network/server error — an outage shouldn't
  sign a valid session out.
- Sub-steps:
  - [x] `createClient()` takes a token accessor, sets `fetchOptions.auth`
  - [x] `refresh()` clears the dead token on confirmed invalid session
  - [x] fix the misleading `credentials: 'include'` comment
  - [x] regression test: refresh() succeeds with cookies absent, token present
  - [x] lint/format/typecheck/test gates
- Status: in-progress
- Blockers: —
