## T-2026-09-18-fix-sidebar-scroll-container — bound the lesson player sidebar

- Created: 2026-09-18
- Owner: claude
- Goal: the sidebar keeps its own scroll container instead of stretching the lesson page (tuxedo 253).
- Spec diff: none
- Codegen impact: no
- Sub-steps:
  - [x] e2e guard: a long outline must scroll inside the sidebar, not the document
  - [x] cap `.page-lesson-player__sidebar` in `dvh`, as the transcript panel already is
  - [x] remeasure on the audit stack at 1440x900 and 390x844
- Status: done
- Blockers: —
- Completed: 2026-09-18
- Result: https://github.com/kkucherenkov/course_shelf/pull/713
