## T-2026-09-18-browse-controls-stack — stop the browse filters moving between locales

- Created: 2026-09-18
- Owner: claude
- Goal: the filter group sits in the same place in every language.
- Spec diff: none
- Codegen impact: no
- Sub-steps:
  - [x] e2e guard: the selects start below the chips in en and ru alike
  - [x] stack `.page-browse__controls` into a column
- Status: done
- Blockers: —
- Completed: 2026-09-18
- Result: https://github.com/kkucherenkov/course_shelf/pull/715
