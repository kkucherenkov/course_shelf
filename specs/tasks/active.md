# Active tasks

## T-2026-09-17-player-transport-controls — familiar transport controls and a readable transcript

- Created: 2026-09-17
- Owner: claude
- Spec: [docs/superpowers/plans/2026-09-17-player-transport-and-transcript.md](../../docs/superpowers/plans/2026-09-17-player-transport-and-transcript.md)
- Goal: the lesson player behaves like a video player people have used before,
  and the transcript gets the width it needs to be read.
- Spec diff: none
- Codegen impact: no
- Sub-steps:
  - [x] raise the page-spec timeout so a loaded runner stops reporting false reds (tuxedo 231)
  - [x] add 15s skip buttons and a play target over the picture (tuxedo 222)
  - [x] show the subtitles and fullscreen toggles as pressed (tuxedo 223)
  - [x] replace the speed cycle with a menu (tuxedo 224)
  - [x] move the transcript below the video at full column width (tuxedo 216)
- Status: in-progress
- Blockers: —

## T-2026-09-17-storybook-mcp — expose the design system to agents over MCP

- Created: 2026-09-17
- Owner: claude
- Spec: — (infrastructure; no feature spec)
- Goal: an agent asked to build UI finds the existing `@app/ui` component
  before writing a new one, by querying a running Storybook over MCP.
- Spec diff: none
- Codegen impact: no
- Sub-steps:
  - [x] raise the Storybook toolchain to ^10.6.0 (the floor `@storybook/addon-mcp` requires)
  - [x] add `@storybook/addon-mcp` and register it in `packages/ui/.storybook/main.ts`
  - [x] point `.mcp.json` at the dev server's `/mcp` endpoint
  - [ ] bring the compose `storybook` service up and verify the endpoint answers
  - [ ] re-run the Storybook visual regression suite — a minor bump can move snapshots
  - [x] document the workflow in README, README.ru and `.claude/CLAUDE.md`
- Status: in-progress
- Blockers: —

## T-2026-09-17-lesson-summary-export — lesson summary with screenshots, Markdown export

- Created: 2026-09-17
- Owner: claude
- Spec: [docs/superpowers/specs/2026-09-17-lesson-summary-and-export-design.md](../../docs/superpowers/specs/2026-09-17-lesson-summary-and-export-design.md)
- Goal: a lesson leaves the app as a ZIP you can drop into a notes vault — summary, slides, note, bookmarks.
- Spec diff: openapi.yaml — summary routes, export routes, signed frame route
- Codegen impact: yes
- Sub-steps:
  - [x] design pre-step (settles E28-F01-S01's first sub-step)
  - [x] ADR-0012: hosted model provider, supersedes ADR-0011
  - [ ] roadmap card for the summary feature under E29
  - [x] hosted model adapter + AppConfig
  - [ ] FfmpegAdapter: widen thumbnail dimensions, add scene extraction
  - [ ] LessonSummary aggregate, routes, admin review screen
  - [ ] renderer + ZIP export + web entry point (E28-F01-S01)
- Status: in-progress
- Blockers: —
