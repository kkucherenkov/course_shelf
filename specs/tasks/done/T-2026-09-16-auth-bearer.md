## T-2026-09-16-auth-bearer — session restore and refresh go through bearer, not cookies

- Created: 2026-09-16
- Completed: 2026-09-16
- Owner: claude
- Spec: n/a (bug fixes, one spec-first field addition)
- Goal: three admin-surface defects fixed — `/admin` icons blocked by CSP
  (fetch to api.iconify.design), identify queue rows unidentifiable without
  opening the task, permissions screen undercounting course-level grants for
  libraries that were never expanded.
- Spec diff: openapi.yaml — `IdentifyTaskDto.courseTitle` (required)
- Codegen impact: yes
- Sub-steps:
  - [x] Closes #571 — replace every `i-heroicons-*` under `apps/web/app/pages/admin` and
        `apps/web/app/components/admin` with `IconCS`; add `circle-stack` +
        `academic-cap` glyphs to `@app/ui` IconCS
  - [x] Closes #575 — spec-first `courseTitle` on `IdentifyTaskDto`, backend handlers,
        `AdminIdentifyTaskRow` shows course title + i18n relative time,
        status filter (default `proposed`) on the queue page, retry button → AppButton
  - [x] Closes #576 — resolve courseId→libraryId for permission overrides
        independent of library-row expansion (`getCourse` per granted course)
- Status: done
- Result: https://github.com/kkucherenkov/course_shelf/pull/587

- Spec: none — bug fixes reported by the maintainer from a live audit.
- Result: https://github.com/kkucherenkov/course_shelf/pull/580 (closes #577, #572, #581)
- Goal: `useAuthStore.refresh()` (and everything routed through it —
  `auth.global.ts`, `api.client.ts`'s 401 handler, `useStreamUrl`,
  `useScanLifecycle`) must authenticate `getSession()` with the bearer token
  from `localStorage`, not rely on the `better-auth.session_token` cookie.
  With cookies cleared and a valid token in storage, `refresh()` used to
  always return `false` and bounce the user to `/sign-in`.
- Root cause: `createClient()` in `stores/auth.ts` set
  `fetchOptions.credentials: 'include'` but never attached an
  `Authorization` header to Better Auth's own client — only the generated
  `@app/api-client-ts` client got that treatment, via `api.client.ts`'s
  request interceptor. Better Auth's `$fetch` never saw the header.
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
- Session cookie (`credentials: 'include'`) left in place — backend side
  untouched, called out as no-longer-load-bearing for the SPA in a comment
  rather than removed, per the maintainer's request not to touch that side
  in this PR.
- Follow-up found during review (#581): the fix above preserves the token on
  a transient `refresh()` failure, but `auth.global.ts` redirected to
  `/sign-in` unconditionally on `!isAuthenticated` regardless of why — a
  429 from the shared rate limiter (the same mechanism #572 measured: 45/56
  navigations) silently signed a live session out. Middleware now passes
  the navigation through instead when the token survived (transient failure
  or mid-cooldown), leaving the destination page's own API calls — which
  already retry once through `refresh()` on a 401 via `api.client.ts` — as
  the authoritative check. A `useSessionRefreshCooldown.ts` composable (same
  extract-for-testability shape as `useHasUsersCache.ts`) backs off retrying
  `refresh()` for 5s after a transient failure so repeated navigations
  during an outage don't keep re-hitting the same rate limit.
