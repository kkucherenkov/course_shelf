# Active tasks

## T-2026-07-16-005 — email-primary mobile auth + OTP test coverage (E15-F01-S01 / card E15-F01-S03)

- Created: 2026-07-16
- Owner: claude
- Spec: [docs/superpowers/specs/2026-07-16-e15-f01-s03-email-primary-auth-design.md](../../docs/superpowers/specs/2026-07-16-e15-f01-s03-email-primary-auth-design.md)
- Goal: close E15-F01-S03. Phone-OTP runtime already shipped; real gaps are (1) zero OTP test coverage and (2) shipped UI leads with phone-OTP, contradicting the closeout spec's email-primary decision. Flip login to email-primary (web-mirror single screen, layout A), phone-OTP demoted to a secondary link; add OTP + wire + widget tests; remove vestigial `devCode`; correct the card.
- Spec diff: none
- Codegen impact: no (slang i18n regen only, not OpenAPI)
- Sub-steps:
  - [ ] tests: OTP bloc_test cases + `auth_api_test` (mocked Dio) + `sign_in_screen_test` widget test
  - [ ] cleanup: remove `devCode` from AuthState + AuthCubit
  - [ ] i18n: add `signIn.phoneInstead`/`errorEmailInvalid`/`errorPasswordTooShort`, rename `welcome.continueWithPhone`→`getStarted` across en/el/ru/uk; regen slang
  - [ ] UI: extract phone/OTP to `PhoneAuthScreen` (/sign-in/phone); rewrite `SignInScreen` as email form; real email `SignUpScreen`; Welcome CTA → SignInScreen; routes
  - [ ] verify: build_runner + slang, flutter analyze, flutter test, `pnpm check:i18n`
  - [ ] correct card E15-F01-S03 + TODO.md row; PR
- Status: in-progress
- Blockers: —
