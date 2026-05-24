---
target: Auth / sign-in (apps/web/app/pages/sign-in.vue)
total_score: 31
p0_count: 0
p1_count: 1
timestamp: 2026-05-24T17-57-06Z
slug: apps-web-app-pages-sign-in-vue
---
## Re-critique — Auth (after #219)

| # | Heuristic | Score | Was | Key issue |
|---|-----------|-------|-----|-----------|
| 1 | Visibility | 3 | 2 | Success toast fires; but the **rate-limit banner never renders** (store omits status — see P1) |
| 2 | Match real world | 3 | 3 | Copy "Try again in {time}" (m:ss); brief wants "12 min"; seed hardcoded `?? 60`; "No credit card" still nonsense for self-hosted |
| 3 | User control | 3 | 3 | sign-up step 2→1 still discards the verify code |
| 4 | Consistency | 3 | 3 | forgot mail CTA still a hand-rolled `<a>` (AppButton `to` is router-only, so mailto can't use it) |
| 5 | Error prevention | 3 | 3 | novalidate + custom checks intact |
| 6 | Recognition | 3 | 3 | OTP still 6 bare inputs, no paste / one-time-code (deferred) |
| 7 | Flexibility | 3 | 3 | Enter submits; no email autofocus |
| 8 | Aesthetic | 4 | 2 | **Marketing aside + SSO/divider removed from sign-in & AuthLayout** — single centered column. (pane still 420px vs brief 380; SSO still on sign-up) |
| 9 | Error recovery | 3 | 3 | inline role=alert; non-429 still substring-classified (deferred) |
| 10 | Help | 3 | 3 | no first-run "admin account" cue (unused `setup.subtitle`) |
| **Total** | | **31/40** | **28** | **+3; but the headline rate-limit fix is unreachable** |

## Resolved since 28/40
- **Marketing aside removed** (`AuthLayout.vue` form-pane only; 0 `AuthMarketing` references).
- **SSO block + divider removed from sign-in** (no `AppSsoBlock` import).
- **RateLimitBanner no longer double-renders** — exposes `remaining` via slot; page formats m:ss (`RateLimitBanner.vue:34-36`, `sign-in.vue:92-94`).
- **"Keep me signed in" passed through** — `signIn(…, rememberMe)` → Better Auth (`auth.ts:63-79`, `sign-in.vue:47`).
- **Success toast** before redirect (`sign-in.vue:64-65`).

## Anti-Patterns Verdict
Not slop; RateLimitBanner side-stripe CLEAN. **`AuthMarketing.vue` is now an unused orphan** (0 refs, on disk) — should be deleted. Shipped sign-in now follows the brief over the mockup (correct resolution). Detector + browser unavailable (source-only, degraded).

## Remaining / new priority issues
- **[P1 — NEW/REGRESSION] Rate-limit banner is dead code**: `authStore.signIn` returns only `{ ok, error }` (`auth.ts:67,93,116,120`) — never `statusCode`/`retryAfter`. The page's 429 path (`sign-in.vue:50-54`) reads `statusCode === 429` which is always `undefined`, so a real 429 falls through to the generic error and `RateLimitBanner` **never mounts**. #219 polished a slot/format nothing can reach. Fix: capture HTTP status + `Retry-After` from the Better Auth error response in `signIn` (mirror the `set-auth-token` capture) and widen the return type. → harden
- **[P2] SSO divider/block still on sign-up step 1** (`sign-up.vue:302-306`) — same brief "no third-party" rule fixed on sign-in, left half-done on sign-up (provider-gated, so lower sev). → clarify/harden
- **[P2] Rate-limit magnitude** — even once P1 is fixed, `retryAfter ?? 60` → "1:00", not the brief's ~12 min; plumb the server lockout window (`sign-in.vue:53`). → clarify
- **[P3] Dead `AuthMarketing.vue` orphan** — `git rm` after confirming no story/spec refs. → polish
- **[P3 deferred] OTP paste + one-time-code**; **brittle substring error classification** (needs structured backend codes).

## Persona Red Flags
- **Owner-Admin (first-run)**: sign-up step 1 shows generic "Free for self-hosters · No credit card" regardless of first-run; the "first administrator" string is unused; `promoteToAdmin` is a console-warn stub (`auth.ts:273-276`) — first-user→admin not actually wired; library step can't go back.
- **Household learner**: "keep me signed in" now works; but on a real lockout they get the **generic** error, not the countdown (the P1 dead-code) — no wait guidance. No email autofocus.
- **Guest (self-registration off)**: best served — clean `AppNoPermission` "ask your admin" + back link; the sign-in marketing tease is gone.

## Minor
- `$form-max-width: 420px` vs brief's 380px (`AuthLayout.vue:27`).
- forgot success-check + AuthStepper use inline `<svg>` not `IconCS` (aria-hidden, neutral).
- RateLimitBanner ticks inside `role="status"` → some SRs announce each second; an aria-live boundary announcing the sentence only would be cleaner (unverified, no browser).
