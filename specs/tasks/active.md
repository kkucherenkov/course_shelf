# Active tasks

## T-2026-08-31-branch-unique-task-ids — make task ids branch-unique

- Created: 2026-08-31
- Owner: claude
- Spec: local `tuxedo` 18
- Goal: two lanes working at the same time cannot pick the same task id, so
  `active.md` stops conflicting on a file whose entries never overlap.
- Spec diff: none
- Codegen impact: no
- Sub-steps:
  - [x] replace `T-YYYY-MM-DD-NNN` with `T-YYYY-MM-DD-<branch-slug>` in
        `specs/tasks/README.md`, with the reasoning and the 2026-08-31 evidence
  - [x] update `specs/tasks/templates/feature.md` and the README's own example
  - [x] state the rule in `.claude/CLAUDE.md` — both in the task-stack list and
        in **Parallel work**, which is where lanes read it
  - [x] leave the numeric ids already in `done.md` alone
- Status: in-review
- Blockers: —
