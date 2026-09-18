## T-2026-09-18-drop-dead-image-pull-step — repair two workflows #736 left invalid

- Created: 2026-09-18
- Owner: claude
- Spec: none — CI repair, no contract change
- Goal: remove the `Pull external images` step from `e2e.yml` and
  `regen-snapshots.yml`. Its only job was pulling `otel-lgtm`; #736 deleted
  that service and left the step with a `name:` and no `run:`, which GitHub's
  workflow validator rejects outright.
- Acceptance:
  - no step in `.github/workflows/*.yml` has neither `run:` nor `uses:`
  - `e2e.yml` runs again on push and pull_request — its last successful run
    was 2026-09-18T10:35Z, before #736 landed at 13:00Z; every run since
    reported `event=push`, `conclusion=failure`, zero jobs, named by its path
    instead of by the workflow's `name:`, which is how GitHub surfaces a file
    it could not parse
- Spec diff: none
- Codegen impact: no
- Design impact: none
- Tests: CI itself — a green `E2E` run on this PR is the proof, since the
  defect was the file failing to start at all
- Sub-steps:
  - [x] delete the step from `e2e.yml`
  - [x] delete it from `regen-snapshots.yml` too, where #741 had given it a
        `--ignore-buildable` body: every service in both job lists is
        `build:` today, so the step pulls nothing either way, and a step that
        does nothing is the thing that broke
  - [x] scan every workflow for the same shape — none left
  - [x] PR opened, CI green
- Status: done
- Blockers: —
- Completed: 2026-09-18
- Result: https://github.com/kkucherenkov/course_shelf/pull/743
