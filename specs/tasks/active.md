# Active tasks

## T-2026-08-30-006 — E25-F01 whisper foundation (S01, S02, S04)

- Created: 2026-08-30
- Owner: claude
- Spec: [docs/superpowers/specs/2026-08-29-b4-transcription-design.md](../../docs/superpowers/specs/2026-08-29-b4-transcription-design.md)
- Cards: [E25-F01-S01](../../docs/roadmap/tasks/E25-F01-S01.md) (#210),
  [E25-F01-S02](../../docs/roadmap/tasks/E25-F01-S02.md) (#211),
  [E25-F01-S04](../../docs/roadmap/tasks/E25-F01-S04.md) (#213)
- Goal: give the transcription work a writable derived volume, whisper config,
  a pinned whisper.cpp binary in the backend image, a guarded derived-path
  resolver, and speech-to-text behind a port.
- Spec diff: none
- Codegen impact: no
- Sub-steps:
  - [ ] `AppConfig.derivedPath` + `AppConfig.transcription` with a colocated spec
  - [ ] writable `/data/derived` in `compose.yml`, `compose.prod.yml`, `compose.release.yml`
  - [ ] ggml model mounted read-only; env wired in prod and release
  - [ ] `.env.example` + `.gitignore` cover `DERIVED_PATH` and every `WHISPER_*`
  - [ ] whisper.cpp pinned in both backend Dockerfiles, both binaries verified in-container
  - [ ] `transcription.errors.ts`
  - [ ] `derived-path.ts` + spec (guard separate from `lesson-file-locator.ts`)
  - [ ] `whisper.port.ts` + `WHISPER_ADAPTER` token
  - [ ] `local-whisper.adapter.ts` + spec (`execFile` mocked, no real binary)
  - [ ] docs: `README.md`, `README.ru.md`, `docker/README.md`
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
