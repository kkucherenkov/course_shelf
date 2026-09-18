## T-2026-09-18-schemathesis-unicode-pattern — stop the contract run reddening at random

- Created: 2026-09-18
- Owner: claude
- Goal: a branch that never touched the API stops failing the contract gate (tuxedo 255).
- Spec diff: none
- Codegen impact: no
- Sub-steps:
  - [x] confirm Python's `re` cannot compile `[\p{L}\p{N}]`
  - [x] exempt the three upsert operations from `negative_data_rejection`
- Status: done
- Blockers: —
- Completed: 2026-09-18
- Result: https://github.com/kkucherenkov/course_shelf/pull/721
