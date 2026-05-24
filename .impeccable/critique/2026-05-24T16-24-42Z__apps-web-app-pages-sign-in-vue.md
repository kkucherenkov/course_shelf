---
target: Auth / sign-in (apps/web/app/pages/sign-in.vue)
total_score: 28
p0_count: 0
p1_count: 2
timestamp: 2026-05-24T16-24-42Z
slug: apps-web-app-pages-sign-in-vue
---
## Design Health Score — Auth (anchored on sign-in)

| # | Heuristic | Score | Key issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Button spinner ok, but no success toast (brief requires one); rate-limit countdown never re-announces |
| 2 | Match System / Real World | 3 | Rate-limit says "try again in 60s" while brief specifies "12 minutes" |
| 3 | User Control and Freedom | 3 | Sign-up wizard editable, but step 2→1 discards verify code; no back from library step |
| 4 | Consistency and Standards | 3 | Forgot's mail button is a hand-rolled `<a>` imitating AppButton (`forgot.vue:144`) |
| 5 | Error Prevention | 3 | `novalidate` + custom checks correct; submit disabled-on-invalid gives no inline "why" |
| 6 | Recognition Rather Than Recall | 3 | Fields labeled, autocomplete correct; OTP is 6 bare inputs, no paste |
| 7 | Flexibility and Efficiency | 3 | Enter submits; no autofocus on email |
| 8 | Aesthetic and Minimalist Design | 2 | Contradicts brief's "single column, max 380px, no marketing, no third-party": 420px pane + marketing aside + SSO block |
| 9 | Error Recovery | 3 | Inline `role="alert"` banners (never modal); but non-429 errors collapse via brittle substring matching on server text |
| 10 | Help and Documentation | 3 | Hints present; no first-run "this is the admin account" cue despite `useFirstRun` |
| **Total** | | **28/40** | **Solid but compromised** |

## Anti-Patterns Verdict
Not slop — disciplined tokens/BEM, named SCSS vars with WHY comments, `useId` a11y wiring, real state machines. **`RateLimitBanner` side-stripe check: CLEAN** (renders `AppBanner variant="warning"`, transparent border, no `::before` stripe). No gradient text/glass/hero-metric/modal.
**AuthMarketing finding (the flagged tension)**: brief §6.2 says "No marketing copy" + "no third-party auth", but the build renders `AuthMarketing.vue` (`AuthLayout.vue:24`, `aria-hidden`) + an `AppSsoBlock` (`sign-in.vue:159`). The **mockup** (`cs-web-auth/app.jsx:16-29`) itself shows marketing + SSO, so the code followed the mockup over the brief prose → a **brief-vs-mockup conflict**, not a code defect, but it ships marketing + SSO on a self-hosted login against the written spec. Needs an explicit ruling. `detect.mjs` is a stub; no browser automation (source-only, degraded).

## Strengths
- A11y-correct form primitives: `AppField`/`AppPasswordField` spread `id`/`aria-describedby`/`aria-invalid`/`aria-required`; error nodes `role="alert"` (`AppField.vue:29-34,49`, `AppPasswordField.vue:88-93,118`).
- Errors inline + never modal, per brief (`sign-in.vue:104`, `AppBanner.vue:45`).
- Correct password autocomplete across flows (`current-password` sign-in, `new-password` sign-up/reset).

## Priority Issues
- **[P1] Rate-limit countdown wrong + double-rendered** — `'…Try again in {n}s.'` fed raw seconds (`en.ts:71`), passed as `bodyPrefix` then re-appended in `RateLimitBanner.vue:15-19` → "…in 60s 60s"; brief wants "12 minutes". Region is `role="status"` with no `aria-live`. Fix: banner owns the sentence, format mm:ss, `aria-live="polite"`. → clarify
- **[P1] Brief↔mockup conflict: marketing pane + SSO on a "no marketing / no third-party" screen** — `AuthLayout.vue:24-26`, `sign-in.vue:154-160` vs brief §6.2. Get a ruling; if brief wins, gate `AuthMarketing` + keep SSO conditional on providers (already conditional). → shape
- **[P2] No success state** — every flow does a bare `navigateTo('/')` (`sign-in.vue:74`, `forgot.vue:67`, `sign-up.vue:205`); brief wants "transient toast then redirect", esp. after password reset / first-run. → harden
- **[P2] Brittle error classification** — substring-matches lowercased server text (`'invalid'`/`'credential'`/`'exist'`) to pick a message (`sign-in.vue:67-71`, `sign-up.vue:103-106`); breaks on localized/changed server strings. Branch on status code (the 429 path already does). → clarify
- **[P3] OTP entry fragile** — 6 inputs, focus moved via `querySelectorAll`, no paste handler (paste fills only the last box) (`sign-up.vue:142-158,338-349`). Add paste distribution + `autocomplete="one-time-code"`. → harden

## Persona Red Flags
- **Owner-Admin (first-run)**: `useFirstRun` promotes the first user to admin, but step-1 shows the same "Free for self-hosters. No credit card." copy regardless; the unused "first administrator" string (`en.ts:143`) is never surfaced; library step can't go back. "No credit card" is nonsense for self-hosted.
- **Household learner (returning)**: must read past marketing + SSO + divider to reach the password field; no email autofocus; **"Keep me signed in" is bound but never passed to `authStore.signIn`** (`sign-in.vue:57,138`) — silent broken control.
- **Guest (self-registration off)**: best-served — `/sign-up` shows a clean `AppNoPermission` "ask your admin" state with a back link (`sign-up.vue:227-238`); only tease is the sign-in marketing promises to someone who can't register.

## Minor Observations
- `AuthLayout` `$form-max-width: 420px` contradicts brief's "max ~380px".
- `AuthMarketing.vue:90` hardcodes `COURSESHELF · v0.1` version string (will rot; not config-sourced).
- "Keep me signed in" + "Forgot password?" share a `space-between` row with no wrap rule — can collide at narrow widths with long localized strings.
- Sign-in's disabled-until-valid button + no autofocus = first impression is a dead button; consider validate-on-submit.
