# Active tasks

## T-2026-04-26-005 — archive sweep: mark already-shipped roadmap stories as Done

- Created: 2026-04-26
- Owner: claude
- Spec: in-thread plan from session start (option (a) — mark known-shipped stories ✅ Done in a single sweep PR so that progress counters and dependency unblocking reflect reality).
- Goal: walk every `docs/roadmap/tasks/E*.md` card, decide whether the story's acceptance is _already_ satisfied by the current codebase, and flip status to ✅ Done in both the card and `docs/roadmap/TODO.md` for those that are. Conservative: when in doubt, leave at ⬜ Not started rather than over-claim.
- Acceptance:
  - Every card whose acceptance criteria are already met is at `**Status:** ✅ Done`, with `- Completed: 2026-04-26` and `- Result: archive sweep — see {sha-list}` appended under Notes; sub-step boxes are ticked.
  - The matching `- [ ]` in `docs/roadmap/TODO.md` is `- [x]` for each.
  - The "Progress" line in `docs/roadmap/TODO.md` reflects the new count.
  - Unchanged cards stay byte-for-byte identical (no formatting churn).
  - No code outside `docs/roadmap/` and `specs/tasks/` is touched.
- Spec diff: none
- Codegen impact: no
- Design impact: none
- Tests: spot-check three random "now-Done" cards to confirm the change is consistent (status, notes, TODO checkbox, no other diff).
- Sub-steps:
  - [x] inventory which cards are clearly Done given the current `apps/`, `packages/`, `docs/`, `specs/` state — 6 Done (E01-F01-S01, E02-F01-S02, E02-F02-S03, E03-F01-S01, E12-F01-S01, E22-F01-S02), 5 deliberate borderline (E01-F01-S02 missing eslint-plugin-boundaries, E01-F02-S01 stack drifted from card text, E02-F01-S01 Spectral→Redocly, E04-F01-S01 shared kernel files missing, E04-F02-S03 response validation off in prod)
  - [x] update each Done card: status line, sub-step boxes, Notes block
  - [x] tick the matching boxes in `docs/roadmap/TODO.md` and update the progress counter (`6 / 115`)
  - [x] sanity check: `grep -lE '^\*\*Status:\*\* ✅ Done' docs/roadmap/tasks/*.md | wc -l == 6` and `grep -c '^- \[x\]' docs/roadmap/TODO.md == 6`
  - [x] prettier on touched markdown
- Status: in-progress
- Blockers: —
