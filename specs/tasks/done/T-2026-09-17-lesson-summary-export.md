## T-2026-09-17-lesson-summary-export — lesson summary with screenshots, Markdown export

- Created: 2026-09-17
- Owner: claude
- Spec: [docs/superpowers/specs/2026-09-17-lesson-summary-and-export-design.md](../../docs/superpowers/specs/2026-09-17-lesson-summary-and-export-design.md)
- Goal: a lesson leaves the app as a ZIP you can drop into a notes vault — summary, slides, note, bookmarks.
- Spec diff: openapi.yaml — summary routes, export routes, signed frame route
- Codegen impact: yes
- Outcome: **split**. The export half shipped; the summary half was cut from
  this scope on 2026-09-22 at the maintainer's decision and is now
  [E29-F04-S01](../../docs/roadmap/tasks/E29-F04-S01.md), deferred rather than
  cancelled. Nothing here is abandoned — the design doc specifies the summary
  in full and the card carries its acceptance criteria.
- Sub-steps:
  - [x] design pre-step (settles E28-F01-S01's first sub-step)
  - [x] ADR-0012: hosted model provider, supersedes ADR-0011
  - [x] roadmap card for the summary feature under E29 — E29-F04-S01, new
        feature F04 "Generated summaries" rather than F02 "Generated quizzes",
        which a summary is not
  - [x] hosted model adapter + AppConfig
  - [x] renderer + ZIP export + web entry point (E28-F01-S01) — shipped in
        PR #766 as its own lane, with the OpenAPI edit in the same PR
  - [~] FfmpegAdapter: widen thumbnail dimensions, add scene extraction —
    moved to E29-F04-S01
  - [~] LessonSummary aggregate, routes, admin review screen — moved to
    E29-F04-S01
- Status: done
- Blockers: —
- Completed: 2026-09-22
- Result: https://github.com/kkucherenkov/course_shelf/pull/766
