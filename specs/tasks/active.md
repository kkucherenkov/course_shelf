# Active tasks

## T-2026-04-26-002 — rewrite roadmap story registry under the current stack

- Created: 2026-04-26
- Owner: claude
- Spec: in-thread agreement; closes the divergence between `docs/roadmap/` and `.claude/CLAUDE.md` flagged at the start of this session.
- Goal: every story in `docs/roadmap/tools/generate.py` reflects the real codebase — `apps/backend`, generated `@app/api-client-{ts,dart}`, Nuxt UI v4 + Tailwind 4 + `@app/ui`, Centrifugo realtime, and the current `packages/design-tokens` pipeline.
- Acceptance:
  - `grep -nE 'apps/api|packages/(api-contracts|api-types|api-dtos-nest|shared-kernel)|Vuetify|Style Dictionary|pnpm gen:all|useApi(\b|/)|useAuthToken' docs/roadmap/` returns nothing.
  - Registry covers Centrifugo: `POST /api/v1/realtime/token` story plus an AsyncAPI sub-step.
  - E05 (shared kernel) is folded into a story under E04 (or its own feature inside E04) that lives in `apps/backend/src/shared/`; no `packages/shared-kernel/` reference remains.
  - `python3 docs/roadmap/tools/generate.py` runs clean (no WARNING lines), regenerates 115 task files plus README/ROADMAP/TODO.
  - Story dependencies still resolve (no `WARNING: depends on unknown` in script output).
- Spec diff: none (registry-only rewrite; no OpenAPI/AsyncAPI edits in this PR).
- Codegen impact: no (no `@app/api-client-*` regeneration).
- Design impact: none (tokens canonicalisation is a separate PR).
- Tests: manual — sanity grep above; visual diff review on a sample of regenerated tasks; `python3 docs/roadmap/tools/generate.py` exit 0 with zero warnings.
- Sub-steps:
  - [x] inventory legacy terms in the registry (`apps/api`, `packages/api-contracts|api-types|api-dtos-nest|shared-kernel`, Vuetify, Style Dictionary, `pnpm gen:all`, `useApi`/`useAuthToken`)
  - [x] swap paths: `apps/api`→`apps/backend`; legacy contract packages → `packages/specs` + `@app/api-client-{ts,dart}`; `packages/shared-kernel`→`apps/backend/src/shared`
  - [x] swap web stack: Vuetify→Nuxt UI v4 + Tailwind 4 + `@app/ui`; remove `useApi/useAuth/useAuthToken` composables in favour of `@app/api-client-ts`
  - [x] swap design pipeline: Style Dictionary → current `packages/design-tokens` (`pnpm design:build`)
  - [x] swap commands: `pnpm gen:all` → `pnpm spec:codegen`; quality gate updated to `turbo run lint test typecheck && pnpm format && pnpm stylelint:fix && pnpm check:i18n`
  - [x] add Centrifugo coverage: AsyncAPI sub-step in E02 + new epic E24 with `E24-F01-S01` for `POST /api/v1/realtime/token`
  - [x] dissolve E05 into E04-F01-S01 (E05 epic removed; deps cleaned in E06-F01-S01 and E09-F01-S01)
  - [x] keep Drift in E15 as-is (no driver alternative in scope)
  - [x] run `python3 docs/roadmap/tools/generate.py`; zero warnings, 115 task files regenerated
  - [x] prettier on regenerated `.md`; sanity-grep clean (PCRE)
- Status: in-progress
- Blockers: T-2026-04-26-001 not yet merged — PR 2 stacks on top of `chore/roadmap-collapse`; safe to develop in parallel, but merge order matters.

## T-2026-04-26-001 — collapse duplicate roadmap copies, retarget generator path

- Created: 2026-04-26
- Owner: claude
- Spec: in-thread agreement (priority for `.claude/CLAUDE.md`); see roadmap workflow plan in this session.
- Goal: one source of truth for the roadmap lives under `docs/roadmap/`; the generator writes there instead of a sandbox path.
- Acceptance:
  - `docs/README.md`, `docs/ROADMAP.md`, `docs/TODO.md` no longer exist.
  - `docs/roadmap/tasks/` holds all 115 story files (content unchanged from `docs/tasks/`).
  - `docs/roadmap/README.md` exists, links to `./TODO.md`, `./ROADMAP.md`, `./tasks/`, and points the live work log at `specs/tasks/active.md`.
  - `docs/roadmap/tools/generate.py` writes outputs under `docs/roadmap/` (relative to its own location); no `/mnt/user-data/...` paths remain in the script.
  - The script's own README/ROADMAP write paths reference `docs/roadmap/tools/generate.py`, not `tools/roadmap/generate.py`.
- Spec diff: none
- Codegen impact: no
- Design impact: none
- Tests: manual — `ls docs/roadmap/tasks | wc -l == 115`, `grep -r '/mnt/user-data' docs/` empty, `grep -r 'tools/roadmap/generate.py' docs/` empty.
- Sub-steps:
  - [ ] move `docs/tasks/` → `docs/roadmap/tasks/`
  - [ ] remove `docs/{README,ROADMAP,TODO}.md` (untracked duplicates)
  - [ ] write `docs/roadmap/README.md` (workflow points at `specs/tasks/active.md`; `packages/api-contracts` → `packages/specs/openapi/openapi.yaml`; `pnpm gen:all` → `pnpm spec:codegen`)
  - [ ] retarget `docs/roadmap/tools/generate.py`: `OUT` derived from `__file__`; `write_readme()`/`write_roadmap()` mention the script at its real path; sync the README workflow text with the hand-written README
  - [ ] do NOT run the generator in this PR — PR 2 rewrites the story registry under the current stack (`apps/backend`, Nuxt UI v4, Centrifugo, generated `@app/api-client-{ts,dart}`)
  - [ ] prettier on touched `.md`
- Status: in-progress
- Blockers: —
