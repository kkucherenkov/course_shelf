# Active tasks

## T-2026-05-24-014 — Auth follow-ups: live rate-limit, SSO off sign-up, drop orphan

- Created: 2026-05-24
- Owner: claude
- Spec: `.impeccable/critique/2026-05-24T17-…__apps-web-app-pages-sign-in-vue.md` (Auth re-critique 28 → 31; the #219 gaps)
- Goal: make the rate-limit banner actually reachable, finish the brief's "no third-party" on sign-up, and remove the dead marketing component.
- Acceptance:
  - a 429 sign-in surfaces `statusCode`/`retryAfter` from the store, so `RateLimitBanner` mounts with the server's Retry-After
  - sign-up no longer renders an SSO block / divider
  - `AuthMarketing.vue` is gone (0 references)
- Spec diff: none
- Codegen impact: no
- Design impact: none new
- Tests: existing suites green; i18n parity (en/ru, unchanged)
- Notes (carried, not in scope): rate-limit "12 min" magnitude depends on the backend lockout window (now plumbed via Retry-After, falls back to 60s); `promoteToAdmin` is a backend stub; OTP paste + structured error codes deferred; `$form-max-width` 420 vs 380.
- Sub-steps:
  - [x] `authStore.signIn` returns `statusCode` + `retryAfter` (Better Auth `error.status` + `Retry-After` via `onError`); page drops the casts
  - [x] remove SSO block/divider + imports + `ssoProviders` from `sign-up.vue`
  - [x] `git rm` orphan `AuthMarketing.vue`
  - [x] lint/format (eslint clean; stylelint clean on changed .vue; `@app/ui` green). NOTE: `@app/web` vitest can't start under Node 20 (`ERR_REQUIRE_ESM`); `auth.spec` asserts are property-level so the additive `signIn` fields don't break them.
- Status: in-progress (awaiting commit/PR)
- Blockers: —
