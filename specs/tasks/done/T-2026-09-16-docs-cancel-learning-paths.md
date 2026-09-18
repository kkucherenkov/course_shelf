## T-2026-09-16-docs-cancel-learning-paths — cancel E29-F03-S01 (Learning paths)

- Created: 2026-09-16
- Owner: claude
- Spec: [docs/roadmap/tasks/E29-F03-S01.md](../../docs/roadmap/tasks/E29-F03-S01.md)
- Goal: Close the last open Stage B fork in E29 by cancelling the card rather
  than answering it. Closes #236.
- Spec diff: none
- Codegen impact: no
- Sub-steps:
  - [x] Card marked ❌ Cancelled with the reasoning, not just a status flip
  - [x] TODO.md row marked ❌; v2 counter moved to `41 / 45` with the card out
        of the denominator, per the legend at the top of that file
  - [x] ROADMAP.md regenerated (`generate.py --roadmap-only` drops a cancelled
        card from the Gantt)
- Status: done
- Completed: 2026-09-16
- Result: cancelled — the maintainer settled the card's own open question on
  2026-09-16: on a single-user instance the order of courses is already in the
  owner's head. Neither option the card offered survived it — a first-class
  entity costs a table, an aggregate, wire contracts and a Home surface; a saved
  filter cannot express arbitrary order, the one thing the card asked for.
