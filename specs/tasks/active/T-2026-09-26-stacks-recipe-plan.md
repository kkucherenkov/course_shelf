## T-2026-09-26-stacks-recipe-plan — Harvest the todoer findings and plan the stack recipe

- Created: 2026-09-26
- Owner: claude
- Spec: [two-layer project template](../../docs/superpowers/specs/2026-09-25-project-template-two-layer-design.md) §5, §7 phase 4
- Goal: `stacks/ts-monorepo` becomes executable work — the capture notes catch up
  with todoer, and the phase-4 plan exists.
- Acceptance:
  - `docs/superpowers/plans/ts-monorepo-recipe-notes.md` covers todoer through
    the CLI outbox wave and is tracked by git (it is untracked today)
  - `docs/superpowers/plans/2026-09-26-stacks-ts-monorepo.md` exists, names every
    one of the 11 modules, and says per module whether it is extracted-and-diffed
    or first-run
- Spec diff: none
- Codegen impact: no
- Design impact: none
- Tests: none — documents only. The plan's own tasks carry the tests.
- Sub-steps:
  - [ ] Harvest the 50 todoer commits since 2026-09-25 21:35 into the notes
  - [ ] Track the notes file with `git add -f` (global gitignore hides `docs/`)
  - [ ] Write the phase-4 plan, after the shipyard repository exists
  - [ ] Correct tuxedo 337 — phase 1's plan landed in PR #814
- Status: in-progress
- Blockers: —
