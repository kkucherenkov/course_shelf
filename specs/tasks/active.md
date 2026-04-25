# Active tasks

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
