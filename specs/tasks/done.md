# Done tasks

_Archive of shipped tasks. Never delete entries — cancelled tasks go here with reason._

## T-2026-04-26-005 — archive sweep: mark already-shipped roadmap stories as Done

- Created: 2026-04-26
- Completed: 2026-04-26
- Result: merged locally to main as `c19c247` (no GitHub PR; `git merge --ff-only` from `chore/roadmap-archive-sweep`).
- Owner: claude
- Goal: walk every `docs/roadmap/tasks/E*.md` card, flip status to ✅ Done where the story's acceptance is already satisfied by the current codebase. Conservative — borderline left at ⬜.
- Spec diff: none
- Codegen impact: no
- Design impact: none
- Sub-steps:
  - [x] inventory: 6 Done (E01-F01-S01, E02-F01-S02, E02-F02-S03, E03-F01-S01, E12-F01-S01, E22-F01-S02), 5 deliberate borderline
  - [x] update each Done card: status line, sub-step boxes, Notes block
  - [x] tick matching boxes in `docs/roadmap/TODO.md` and update progress counter (`6 / 115`)
  - [x] sanity check on counts
  - [x] prettier on touched markdown

## T-2026-04-26-004 — design-token cross-source audit (PR 3b)

- Created: 2026-04-26
- Completed: 2026-04-26
- Result: merged locally to main as `5189c92` (no GitHub PR; `git merge --ff-only` from `chore/design-tokens-audit`).
- Owner: claude
- Goal: cross-source audit script comparing `docs/design/shared/tokens.json` (palette) ↔ `specs/design/tokens/*.json` (DTCG); fails CI on hex drift. Plus closing residual scale drift (spacing/radius/font) surfaced by the first run.
- Spec diff: none
- Codegen impact: no
- Design impact: locked the brand alignment behind a script
- Sub-steps:
  - [x] write `packages/design-tokens/scripts/audit-cross-source.ts`
  - [x] add `audit:cross-source` script to `packages/design-tokens/package.json`
  - [x] close residual scale drift in `specs/design/tokens/{spacing,radius,typography}.json`
  - [x] mutation test confirmed audit fails on a flipped hex
  - [x] new `packages/design-tokens/README.md` documents both sources, alias layer, and audit's role
  - [x] lint, typecheck, audit (42 / 42) all green; 4 known prototype-internal drifts reported as ℹ

## T-2026-04-26-003 — brand-align design tokens + emit alias layer (PR 3a)

- Created: 2026-04-26
- Completed: 2026-04-26
- Result: merged locally to main as `9e0a851` (no GitHub PR; merge happened on the local clone via `git merge --ff-only` from `chore/design-tokens-canonical`).
- Owner: claude
- Goal: replace the blue-stub palette in `specs/design/tokens/*.json` with CourseShelf brand values and teach the emitter to publish prototype short CSS-var names (`--bg`, `--surface`, `--primary`, …) as `var()` aliases of the DTCG long names.
- Spec diff: none
- Codegen impact: no
- Design impact: yes — first time the code-stack carries actual CourseShelf brand
- Sub-steps:
  - [x] rewrite `specs/design/tokens/color.json` with brand hex values + new roles (text.loud, surface.skeleton{Base,Shine}, brand.accentSoft, status.{\*}Soft)
  - [x] rewrite `specs/design/tokens/shadow.json` with brand shadow tints
  - [x] tune `specs/design/tokens/motion.json` durations/easings to match prototype curves
  - [x] extend `emit-scss.ts` with themed alias section + static `--d-*`/`--e-*` aliases
  - [x] verified: short-name alias hex byte-equals prototype hex for all 22 color/shadow pairs (dark + light)
  - [x] lint --fix + typecheck clean

## T-2026-04-26-002 — rewrite roadmap story registry under the current stack

- Created: 2026-04-26
- Completed: 2026-04-26
- Result: merged locally to main as `417bcfe` (no GitHub PR; merge happened on the local clone via `git merge --ff-only` from `chore/roadmap-collapse`).
- Owner: claude
- Goal: every story in `docs/roadmap/tools/generate.py` reflects the real codebase — `apps/backend`, generated `@app/api-client-{ts,dart}`, Nuxt UI v4 + Tailwind 4 + `@app/ui`, Centrifugo realtime, and the current `packages/design-tokens` pipeline.
- Spec diff: none
- Codegen impact: no
- Design impact: none
- Sub-steps:
  - [x] inventory legacy terms in the registry
  - [x] swap paths: `apps/api`→`apps/backend`; legacy contract packages → `packages/specs` + `@app/api-client-{ts,dart}`; `packages/shared-kernel`→`apps/backend/src/shared`
  - [x] swap web stack: Vuetify→Nuxt UI v4 + Tailwind 4 + `@app/ui`; remove `useApi/useAuth/useAuthToken` composables in favour of `@app/api-client-ts`
  - [x] swap design pipeline: Style Dictionary → current `packages/design-tokens` (`pnpm design:build`)
  - [x] swap commands: `pnpm gen:all` → `pnpm spec:codegen`
  - [x] add Centrifugo coverage: AsyncAPI sub-step in E02 + new epic E24
  - [x] dissolve E05 into E04-F01-S01
  - [x] keep Drift in E15 as-is
  - [x] run generator; 115 task files, zero warnings
  - [x] prettier on regenerated `.md`; sanity-grep clean

## T-2026-04-26-001 — collapse duplicate roadmap copies, retarget generator path

- Created: 2026-04-26
- Completed: 2026-04-26
- Result: merged locally to main as `32dcead` (no GitHub PR; merge happened on the local clone via `git merge --ff-only` from `chore/roadmap-collapse`).
- Owner: claude
- Goal: one source of truth for the roadmap lives under `docs/roadmap/`; the generator writes there instead of a sandbox path.
- Spec diff: none
- Codegen impact: no
- Design impact: none
- Sub-steps:
  - [x] move `docs/tasks/` → `docs/roadmap/tasks/`
  - [x] remove `docs/{README,ROADMAP,TODO}.md` (untracked duplicates)
  - [x] write `docs/roadmap/README.md` (workflow points at `specs/tasks/active.md`; `packages/api-contracts` → `packages/specs/openapi/openapi.yaml`; `pnpm gen:all` → `pnpm spec:codegen`)
  - [x] retarget `docs/roadmap/tools/generate.py`: `OUT` derived from `__file__`; `write_readme()`/`write_roadmap()` mention the script at its real path
  - [x] prettier on touched `.md`
