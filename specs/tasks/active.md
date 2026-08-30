# Active tasks

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
