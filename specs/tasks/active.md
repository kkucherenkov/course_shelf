# Active tasks

## T-2026-09-17-lesson-summary-export — lesson summary with screenshots, Markdown export

- Created: 2026-09-17
- Owner: claude
- Spec: [docs/superpowers/specs/2026-09-17-lesson-summary-and-export-design.md](../../docs/superpowers/specs/2026-09-17-lesson-summary-and-export-design.md)
- Goal: a lesson leaves the app as a ZIP you can drop into a notes vault — summary, slides, note, bookmarks.
- Spec diff: openapi.yaml — summary routes, export routes, signed frame route
- Codegen impact: yes
- Sub-steps:
  - [x] design pre-step (settles E28-F01-S01's first sub-step)
  - [ ] ADR-0012: hosted model provider, supersedes ADR-0011
  - [ ] roadmap card for the summary feature under E29
  - [ ] hosted model adapter + AppConfig
  - [ ] FfmpegAdapter: widen thumbnail dimensions, add scene extraction
  - [ ] LessonSummary aggregate, routes, admin review screen
  - [ ] renderer + ZIP export + web entry point (E28-F01-S01)
- Status: in-progress
- Blockers: —
