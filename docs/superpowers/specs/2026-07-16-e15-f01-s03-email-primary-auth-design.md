# E15-F01-S03 — email-primary mobile auth (design)

**Date:** 2026-07-16
**Card:** [E15-F01-S03](../../roadmap/tasks/E15-F01-S03.md) — AuthCubit + AuthHttpClient (mobile sign-in/out)
**Status:** approved (scope + layout), implementing

## Problem

The card declares **phone-OTP the primary** sign-in path. The 2026-07-15
mobile-foundations closeout spec **reverses that** — "email + password is the
primary sign-in path; phone OTP is secondary … the card gets corrected as part
of PR 3" — and the "web is the tiebreaker" rule agrees: `apps/web` is
email/password only. That correction never landed.

Meanwhile the phone-OTP **runtime is already fully shipped** (`AuthCubit`
states incl. `otpSent`; `requestOtp`/`verifyOtp` hitting
`/api/v1/auth/phone-number/{send,verify}-otp` via raw Dio; `SecureTokenStorage`;
phone+OTP UI; DI). Two real gaps remain:

1. **Zero test coverage** for the OTP path (`requestOtp`, `verifyOtp`,
   `resetToPhoneStep`, the `otpSent`/`error` transitions, `OtpError` 400/410
   mapping) and no wire test of `AuthApiImpl`.
2. **The shipped UI still leads with phone-OTP** — Welcome's only CTA is
   "Continue with phone" → `SignInScreen` (the phone/OTP flow). This
   contradicts the email-primary decision.

Note: the email `signIn`/`signUp` i18n keys already exist
(`lib/i18n/auth_en.i18n.json`), but no screen consumes them — the email
screens were planned and never built.

## Scope

**In:** (approved: "flip UI now")

- Add OTP + wire test coverage (the card's real gap).
- Flip login to **email-primary**, phone-OTP demoted to a secondary link
  (chosen layout: **web-mirror single screen**).
- Remove the vestigial `devCode` field.
- Correct the card + `TODO.md` to email-primary and mark the story done.

**Out (defer to E18-F03-S01):** the final polished login visual design,
`SignInCubit`/first-user routing, rate-limit banner, "keep me signed in",
forgot-password. This flip is a minimal re-order using existing Material
widgets + tokens, not the finished screen.

## Design

### Screens & routing (layout A — web-mirror)

- **`SignInScreen`** → rewritten as an **email + password** form mirroring
  `apps/web/app/pages/sign-in.vue`: heading (`signIn.title`), email field
  (autofocus, `email` autofill), password field (obscured, `password`
  autofill), inline error banner, primary **Sign in** button →
  `AuthCubit.signIn(email, password)`. Below the form: a **"Sign in with phone
  instead"** text link → `PhoneAuthScreen`, and **"No account? Sign up"** →
  `SignUpScreen`. Client-side validation mirrors web (email contains `@` &
  ≥5 chars; password ≥8), surfacing `signIn.errorEmailInvalid` /
  `errorPasswordTooShort`; `invalid-credentials` → `signIn.errorInvalidCredentials`.
- **`PhoneAuthScreen`** (new, route `/sign-in/phone`) → the current
  `_PhoneAuthView` + `_PhoneStep` + `_OtpStep` + banners, **moved verbatim**
  (no behaviour change) out of `sign_in_screen.dart`.
- **`SignUpScreen`** → replaced with a real **email** sign-up form (name,
  email, password → `AuthCubit.signUp`) using the existing `signUp.*` keys,
  with a "Already have an account? Sign in" link. (Today it just forwards to
  the phone flow; email-primary needs a real registration path, and the keys
  already exist.)
- **`WelcomeScreen`** → single CTA now routes to `SignInScreen`; label key
  renamed `welcome.continueWithPhone` → `welcome.getStarted`.
- **`routes.dart`** → add `AppRoutes.phoneAuth = '/sign-in/phone'` →
  `PhoneAuthScreen`. `signIn`/`signUp`/`welcome` unchanged in name.

Each screen wraps its own `BlocProvider<AuthCubit>(getIt<AuthCubit>())`, as
`SignInScreen` does today, so the phone screen keeps an independent cubit.

### Cubit cleanup

Remove `devCode` from `AuthState` (field, ctor, `copyWith`, `props`) and the
`devCode: ''` arg in `AuthCubit.requestOtp`. It is always empty (OTP is
server-side) and unused by any widget.

### i18n (all 4 locales: en, el, ru, uk — `pnpm check:i18n` parity)

- Add `signIn.phoneInstead`, `signIn.errorEmailInvalid`,
  `signIn.errorPasswordTooShort`.
- Rename `welcome.continueWithPhone` → `welcome.getStarted`.
- Regenerate `strings*.g.dart` via `dart run slang`.

## Testing

- **`auth_cubit_test.dart`** (extend): `requestOtp` → authenticating→otpSent
  (+ phone captured); `requestOtp` OtpError → error; `verifyOtp` →
  authenticating→authenticated; `verifyOtp` OtpError(mismatch/expired) →
  otpSent with `errorMessage: otp-<kind>`; `resetToPhoneStep` → phone step.
- **`auth_api_test.dart`** (new): mocked-Dio wire test of `AuthApiImpl` — send-otp
  path/payload `{phoneNumber}`; verify-otp path/payload `{phoneNumber, code}`,
  token persisted + user parsed; 400→`invalid`/`mismatch`, 410→`expired`.
- **`sign_in_screen_test.dart`** (new, widget): email form renders; invalid
  input shows validation error and does not call the cubit; valid submit calls
  `signIn`; "phone instead" link navigates to `PhoneAuthScreen`. (Card asks for
  "widget test on login".)

## Verification

`dart run build_runner build` + `dart run slang`; `flutter analyze` clean;
`flutter test` green; `pnpm check:i18n` parity.

## Card reconciliation

Correct `E15-F01-S03.md` (Goal/acceptance/sub-steps → email-primary, phone
secondary), tick sub-steps, add Completed/Result, flip the `TODO.md` row to
`[x]`.
