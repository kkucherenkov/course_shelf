# Active tasks

## T-2026-05-24-015 — Auth cheap polish: first-run framing, autofocus, form width

- Created: 2026-05-25
- Owner: claude
- Spec: `.impeccable/critique/…__apps-web-app-pages-sign-in-vue.md` (Auth re-critique 33; the cheap frontend gaps)
- Goal: clear the cheap, frontend-only Auth gaps from the re-critique.
- Acceptance:
  - first-run sign-up shows the "first administrator" framing (not the generic SaaS copy)
  - the "No credit card" SaaS-ism is gone
  - sign-in autofocuses the email field
  - the auth form column matches the brief's 380px
- Spec diff: none
- Codegen impact: no
- Design impact: none
- Tests: existing green; i18n parity (en/ru — reuses `setup.*`, reworded `signUp.subtitle`)
- Notes (NOT cheap, left out): `promoteToAdmin` is a backend stub (Better Auth `admin.setRole`); OTP paste; structured error codes; sign-up step 2→1 discards the verify code.
- Sub-steps:
  - [x] sign-up: first-run-aware `title`/`subtitle` (`setup.*` when `hasUsers === false`)
  - [x] reword `signUp.subtitle` (drop "Free for self-hosters. No credit card.") en + ru
  - [x] sign-in: `autofocus` on the email field
  - [x] `AuthLayout` `$form-max-width` 420 → 380
  - [x] lint/format (eslint web clean; stylelint clean on changed .vue — no `--no-verify`; i18n parity reused/reworded)
- Status: in-progress (awaiting commit/PR)
- Blockers: —
