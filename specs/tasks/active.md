# Active tasks

## T-2026-08-29-002 — E22-F01-S01 · reusable `setup-cs` composite action

- Created: 2026-08-29
- Owner: claude
- Branch: `ci/setup-cs-composite-action`
- Card: [E22-F01-S01](../../docs/roadmap/tasks/E22-F01-S01.md)
- Goal: one place that installs the CourseShelf toolchain, so the Node and
  Flutter versions stop being copy-pasted across five workflow files.
- Spec diff: none
- Codegen impact: no
- Design impact: none
- Sub-steps:
  - [ ] `.github/actions/setup-cs/action.yml` — pnpm + Node + optional Flutter,
        with `~/.pub-cache` (the one acceptance criterion nothing cached yet)
  - [ ] replace the 8 Node/pnpm setup blocks and 2 Flutter blocks across
        `ci.yml`, `quality.yml`, `e2e.yml`, `regen-snapshots.yml`, `release.yml`
  - [ ] drop the now-duplicated `NODE_VERSION` / `FLUTTER_VERSION` env, moving
        the load-bearing golden-version comment onto the action
  - [ ] verify CI green before merge
- Status: in-progress
- Blockers: —

_Remaining follow-up (not carded): per-lesson download state + tap-to-enqueue
once **E19** `DownloadsBloc` lands (#101)._
