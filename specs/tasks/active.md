# Active tasks

## T-2026-08-31-009 — dark-theme contrast pass + a11y gate for the dark ramp

- Created: 2026-08-31
- Owner: claude (frontend-engineer, lane L6 — dark-theme-contrast)
- Spec: `docs/design/shared/tokens.json`, WCAG 2.2 AA (SC 1.4.3 / 1.4.11)
- Goal: the dark ramp meets AA, and the Storybook a11y job audits dark as well
  as light so a regression cannot land unnoticed.
- Spec diff: none (no wire contract touched)
- Codegen impact: yes — `pnpm design:build` regenerates web CSS/TS, `@app/ui`
  CSS/TS and the Flutter `tokens.g.dart`
- Sub-steps:
  - [x] measure the real dark-theme axe count (the tuxedo note said 29)
  - [x] fix the failing dark tokens in `docs/design/shared/tokens.json`
  - [x] wire Nuxt UI's neutral slots onto our tokens (stock slate leaked in)
  - [x] `pnpm design:build`, regenerate both consumers
  - [x] audit dark in the Storybook test-runner so CI fails on a regression
  - [ ] re-record Flutter goldens and web visual snapshots — must run in CI
        (Actions → _Regenerate visual snapshots_, suite `both`); the committed
        baselines were captured on Linux and every one of them fails on a mac
        host even with the tree unchanged
  - [x] update `docs/design/` copy that states a contrast claim
- Status: in-progress
- Blockers: —
