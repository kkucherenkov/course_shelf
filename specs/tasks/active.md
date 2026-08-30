# Active tasks

## T-2026-08-30-006 — E26-F01-S02 + E26-F01-S04 transcript cues, `?t=` deep links, two player defects

- Created: 2026-08-30
- Owner: claude (lane L3, worktree `e26-transcript-cues`)
- Branch: `kkucherenkov/e26-transcript-cues`
- Cards: [E26-F01-S02](../../docs/roadmap/tasks/E26-F01-S02.md) · GitHub #224 ·
  [E26-F01-S04](../../docs/roadmap/tasks/E26-F01-S04.md) · GitHub #226
- Defects (found while verifying E26-F01-S01 in a browser): GitHub #287 (native
  cue line painted behind `AppPlayerChrome`), GitHub #288 (a non-16:9 video
  overflows the player frame instead of letterboxing)
- Goal: the cues the browser parsed become a reactive array a presentational
  transcript tab can consume; a `?t=` link lands on that second; and the
  subtitle line the previous story shipped is actually readable in any aspect
  ratio.
- Spec diff: none
- Codegen impact: no
- Sub-steps:
  - [ ] `useTranscriptCues` composable + spec (fake video element)
  - [ ] `parseStartTime` util + spec
  - [ ] `?t=` precedence over resume position and the resume preference
  - [ ] #287 — lift the cue box above the chrome's control bar
  - [ ] #288 — letterbox any aspect ratio inside the chrome's 16:9 stage
  - [ ] Gates: web lint/typecheck/test, @app/ui lint/typecheck/test, stylelint, prettier
- Status: in-progress
- Blockers: —

## T-2026-08-30-005 — parametrise the compose host ports and project name

- Created: 2026-08-30
- Owner: claude
- Spec: none (tuxedo #39)
- Goal: two worktrees can bring up the dev stack at the same time, and a host
  process already holding :3000 does not block the stack.
- Spec diff: none
- Codegen impact: no
- Sub-steps:
  - [x] every published host port in `docker/compose.yml` reads `${CS_*_PORT:-<default>}`
  - [x] the URLs derived from those ports (`BETTER_AUTH_URL`, `CORS_ORIGINS`, `NUXT_PUBLIC_*`) follow the same vars
  - [x] `name:` reads `${COMPOSE_PROJECT_NAME:-course-shelf}`
  - [x] `docker/README.md` documents the vars and stops telling the reader to hand-edit `compose.yml`
- Status: in-progress
- Blockers: no docker binary on this host — config-only change, stack not exercised
