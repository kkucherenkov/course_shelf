# T-2026-09-21-reconcile-task-entries

- Created: 2026-09-21
- Owner: claude
- Spec: none — bookkeeping rot found while cleaning up merged lanes
- Goal: no entry under `specs/tasks/done/` claims a state it is not in, and no
  shipped task is left sitting in `specs/tasks/active/`.
- Context: 19 of the 269 entries in `done/` still read `in-progress` or
  `ready for PR`, several naming a PR that merged days earlier. One task,
  `T-2026-09-18-r3-quiz-model`, shipped as #751 but never left `active/` —
  the PR that would have moved it (#753) was closed unmerged.
- Method: each entry's own id gives its branch slug (`T-DATE-<slug>`), so the
  PR number and merge date come from `gh pr list` matched on the head branch,
  not from the PR numbers quoted in the entry's prose — those cite neighbours
  as often as the entry's own PR.
- Sub-steps:
  - [x] flip 19 stale `done/` entries to their real PR and merge date
  - [x] move `T-2026-09-18-r3-quiz-model` into `done/` with #751's outcome
  - [x] decide what to do with `T-2026-09-18-r6-e2e-gate`, still `blocked`
        on a PR that has since merged — closed as done: its blocker was the
        branch-protection toggle, and `Playwright smoke (web + backend
health)` is now a required context on `main`
- Status: done
- Blockers: —
- Completed: 2026-09-22
- Result: PR_URL_PLACEHOLDER
