# Active tasks

## T-2026-05-25-002 — Remove redundant client-side promoteToAdmin stub

- Created: 2026-05-25
- Owner: claude
- Spec: deferred item A from T-2026-05-24-015 (Auth cheap polish, #223)
- Goal: drop the dead client-side first-admin promotion; the backend already promotes the first user.
- Rationale: `auth.service.ts` `databaseHooks.user.create.before` sets `role: 'ADMIN'` for the first user at row creation. The client `promoteToAdmin` stub (always returns ok, only warns) and its sign-up call are dead weight. Better Auth `admin.setRole` is not needed for first-admin.
- Acceptance:
  - `promoteToAdmin` removed from `stores/auth.ts` (method + return entry)
  - sign-up no longer calls it; orphaned submit-time `refreshHasUsers` guard removed (only served the promotion decision)
  - `hasUsers` still drives the first-run framing (`isFirstAdmin`)
- Spec diff: none
- Codegen impact: no
- Design impact: none
- Tests: `auth.spec.ts` does not reference `promoteToAdmin` (verified); eslint + typecheck
- Sub-steps:
  - [x] remove `promoteToAdmin` from `stores/auth.ts` (method + return entry)
  - [x] remove the call + orphaned `refreshHasUsers` guard from `sign-up.vue`; trimmed destructure to `{ hasUsers }`
  - [x] lint/typecheck (eslint web clean; typecheck EXIT=0; no `promoteToAdmin` refs remain)
- Status: in-progress (awaiting commit/PR)
- Blockers: —

## T-2026-05-25-001 — Sign-up OTP polish: paste support + clear code on edit-email

- Created: 2026-05-25
- Owner: claude
- Spec: deferred items B + D from T-2026-05-24-015 (Auth cheap polish, #223)
- Goal: pasting a 6-digit code fills the OTP cells; going back to edit the email clears the stale code/timer.
- Acceptance:
  - paste of a 6-digit string into the code row distributes one digit per cell
  - paste strips non-digits and ignores overflow past 6
  - "edit email" (verify → account) resets the code, clears the step-2 error, stops the resend timer
  - OTP input logic lives in a tested `useOtpInput` composable (repo idiom)
- Spec diff: none
- Codegen impact: no
- Design impact: none
- Tests: new `composables/__tests__/useOtpInput.spec.ts` (paste/input/keydown/reset); existing green
- Sub-steps:
  - [x] `useOtpInput.ts` composable — `{ digits, fullCode, onInput, onKeydown, onPaste, reset }`, injected `focusInput`
  - [x] `useOtpInput.spec.ts` — TDD, 15 cases green (input+advance, backspace+retreat, paste distribute/strip/overflow, reset)
  - [x] wire into `sign-up.vue` (replaced inline verifyCode/onCodeInput/onCodeKeydown/fullCode; `@paste`; template-ref focus, dropped global querySelectorAll)
  - [x] `onEditEmail()` — reset + clear step2Error + stop resendTimer (refactored timer into `stopResendCountdown`)
  - [x] lint/format (eslint web clean; typecheck EXIT=0)
- Status: done (#225) — pending archive to done.md (batched chore PR)
- Blockers: web vitest runner is env-broken on main (@nuxt/ui `#build/ui/badge` subpath unresolved under vite optimizeDeps) — composable verified via isolated vitest config (Node 24), 15/15 green
