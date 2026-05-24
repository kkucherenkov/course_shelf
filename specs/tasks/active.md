# Active tasks

## T-2026-05-24-007 — Settings: migrate off raw Nuxt UI onto @app/ui

- Created: 2026-05-24
- Owner: claude
- Spec: `.impeccable/critique/2026-05-24T14-57-28Z__apps-web-app-pages-settings-vue.md` (31/40)
- Goal: Settings uses the same `@app/ui` primitives as every other page, with no dead controls or broken tokens.
- Acceptance:
  - all controls are `@app/ui` (`AppButton`/`AppInput`/`AppSwitch`/`AppPasswordField`/`AppSegmented`), no raw `U*`
  - playback toggles render (no `UToggle`) and pickers have correct padding (no `--space-1-5`)
  - unbuilt features (avatar/email/delete) are disabled with a "coming soon" cue, not active buttons
  - "sign out other devices" is confirmed via `AppDialog`
- Spec diff: none
- Codegen impact: no
- Design impact: none new (`@app/ui` components already exist)
- Tests: none new (page; behaviour preserved); i18n parity (en/ru)
- Sub-steps:
  - [x] buttons → `AppButton`; inputs → `AppInput`; password form → `AppPasswordField`
  - [x] toggles → `AppSwitch`; pickers (theme/density/speed) → `AppSegmented`/`AppSegmentedItem`
  - [x] disable coming-soon controls (avatar/email/delete) with a cue
  - [x] confirm "sign out other devices" via `AppDialog`
  - [x] minors: `IconCS` in `SettingSyncIndicator`; unify token vocabulary; debounce cleanup on unmount + save-on-blur
  - [x] lint/format/stylelint/tests (eslint clean; stylelint clean; @app/ui 845 green; i18n parity en/ru)
- Status: in-progress (awaiting commit/PR)
- Blockers: —
