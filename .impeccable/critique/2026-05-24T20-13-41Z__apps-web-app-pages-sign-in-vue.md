---
target: Auth / sign-in (apps/web/app/pages/sign-in.vue)
total_score: 33
p0_count: 0
p1_count: 0
timestamp: 2026-05-24T20-13-41Z
slug: apps-web-app-pages-sign-in-vue
---
## Re-critique — Auth (after #222)

| # | Heuristic | Score | Was | Key issue |
|---|-----------|-------|-----|-----------|
| 1 | Visibility of System Status | 4 | 3 | **Rate-limit banner now reachable** — `signIn` returns `statusCode`/`retryAfter`, page mounts `RateLimitBanner` on 429 with the server's Retry-After |
| 2 | Match System / Real World | 3 | 3 | Countdown is now server-driven; but sign-up still says "Free for self-hosters. No credit card." (`en.ts:76`) — nonsense for a self-hosted instance |
| 3 | User Control and Freedom | 3 | 3 | sign-up step 2→1 still discards the verify code; library step can't go back |
| 4 | Consistency and Standards | 4 | 3 | SSO/divider now gone from **both** sign-in and sign-up; consistent. (forgot's mailto `<a>` is a legit exception — `AppButton.to` is router-only) |
| 5 | Error Prevention | 3 | 3 | novalidate + custom checks; submit disabled-until-valid with no inline "why" |
| 6 | Recognition Rather Than Recall | 3 | 3 | OTP still 6 bare inputs, no paste / one-time-code (deferred) |
| 7 | Flexibility and Efficiency | 3 | 3 | Enter submits; still no email autofocus (`sign-in.vue`) |
| 8 | Aesthetic and Minimalist Design | 4 | 4 | Single centered column, no marketing/SSO. (pane `max-width: 420px` vs brief 380) |
| 9 | Error Recovery | 4 | 3 | The 429 recovery path now works (countdown + auto-clear); non-429 still substring-classified generic (deferred) |
| 10 | Help and Documentation | 3 | 3 | No first-run "this is the admin account" cue (unused `setup.subtitle`) |
| **Total** | | **33/40** | **31** | **The headline P1 is now genuinely fixed; remaining gaps are copy/backend/minor** |

## Resolved Since 31/40 (#222)

- **[P1] Rate-limit banner reachable** — `authStore.signIn` returns `statusCode` + `retryAfter` (Better Auth `error.status` + `Retry-After` via `onError`, `auth.ts:67,90-95`); the page reads `result.statusCode === 429` → `result.retryAfter ?? 60` (`sign-in.vue:50-52`) and mounts `RateLimitBanner`. The prior dead-code path is live. (Code-path verified; rendering not browser-verified.)
- **[P2] SSO off sign-up** — `sign-up.vue` no longer renders the SSO block/divider; `AppSsoBlock`/`SsoProvider`/`IconName`/`ssoProviders` removed. The brief's "no third-party auth" is now consistent across the surface.
- **[P3] Orphan removed** — `AuthMarketing.vue` deleted (0 references).
- **Rate-limit magnitude** — now driven by the server's `Retry-After` (60s fallback) instead of a hardcoded misleading value.

## Anti-Patterns Verdict
Not slop; no ban hits. The surface is now fully on the brief (single column, no marketing, no third-party). Detector + browser unavailable (source-only, degraded) — the rate-limit banner's live render/announcement is unverified, only its reachability via the code path.

## Remaining / new priority issues
- **[P2] First-run admin framing missing + "No credit card" copy** — sign-up step 1 shows "Free for self-hosters. No credit card." (`en.ts:76`) regardless of first-run; the purpose-built "first administrator" string (`setup.subtitle`) is never surfaced. "No credit card" is meaningless for self-hosted. → clarify
- **[P2] `promoteToAdmin` is a stub** — `auth.ts:282-285` console-warns and resolves `{ ok: true }`; the first user is not actually promoted to admin. First-run setup is incomplete. → backend (Better Auth `admin.setRole`)
- **[P3] No email autofocus on sign-in** — returning users get an extra click; combined with the disabled-until-valid button, the first paint is a dead button. → harden
- **[P3] `$form-max-width: 420px` vs brief 380** (`AuthLayout.vue:27`). → polish
- **[P3 deferred] OTP paste + `one-time-code`**; **brittle substring error classification** (needs structured backend error codes); **sign-up step 2→1 discards the verify code**.

## Persona Red Flags
- **Owner-Admin (first-run)**: generic "Free for self-hosters / No credit card" copy, no "you're the first admin" framing, and `promoteToAdmin` doesn't actually run — first-run setup is cosmetically there but functionally incomplete. Library step can't go back.
- **Household learner (returning)**: now gets a real countdown on lockout (the big fix). Still no email autofocus; first paint is a disabled button.
- **Guest (self-registration off)**: clean `AppNoPermission` "ask your admin" + back link; no marketing/SSO tease remaining. Solid.

## Minor Observations
- forgot success-check + AuthStepper use inline `<svg>` not `IconCS` (aria-hidden, neutral).
- `RateLimitBanner` updates `remaining` each second inside `role="status"`; some SRs may announce each tick — an aria-live boundary announcing only the sentence would be cleaner (unverified, no browser).
- `signIn`'s `rememberMe = true` default is moot since the page always passes an explicit boolean (harmless).
