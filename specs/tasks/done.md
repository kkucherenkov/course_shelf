# Done tasks

_Archive of shipped tasks. Never delete entries — cancelled tasks go here with reason._

## T-2026-04-26-010 — Library aggregate + register/list/get endpoints (E06-F01-S01)

- Created: 2026-04-26
- Completed: 2026-04-26
- Result: three commits on `feat/library-aggregate`: `a710c5d` (spec), `be9ac44` (TS codegen), `0ef1607` (impl). Merged into main as a fast-forward chain.
- Owner: claude
- Goal: first real domain story for Catalog — Library aggregate with name + rootPath invariants, persisted via Prisma behind a domain-owned port, exposed at `POST/GET /api/v1/libraries{,/{id}}`.
- Spec diff: `packages/specs/openapi/openapi.yaml` (3 paths + 3 schemas, version bumped 0.1.0 → 0.2.0)
- Codegen impact: yes — TS regenerated; Dart skipped (env issue tracked separately)
- Design impact: none
- Sub-steps:
  - [x] OpenAPI: registerLibrary / listLibraries / getLibrary + LibraryDto / LibraryListDto / RegisterLibraryRequest
  - [x] TS codegen committed separately
  - [x] Library aggregate at `apps/backend/src/modules/catalog/domain/library/` (path corrected from `contexts/` to match the existing `modules/` pattern + boundaries)
  - [x] LibraryRepository port + Prisma adapter + mapper
  - [x] CQRS: RegisterLibraryCommand + ListLibrariesQuery + GetLibraryQuery handlers
  - [x] CatalogController + CatalogModule registered in app.module.ts
  - [x] Prisma `Library` model + migration SQL (authored manually because Docker was off; identical to what `prisma migrate dev --create-only` would produce)
  - [x] 5 spec files (aggregate, three handlers, repository roundtrip), 70/70 passing
  - [x] backend `lint` clean; workspace `tsc` regression in generated TS clients tracked as T-011 (not E06 fault)

## T-2026-04-26-009 — Prisma generate postinstall + close E01-F01-S02

- Created: 2026-04-26
- Completed: 2026-04-26
- Result: merged locally to main as `a6006cf` (no GitHub PR; `git merge --ff-only` from `chore/prisma-generate`).
- Owner: claude
- Goal: workspace-wide `pnpm -r lint` finishes with zero errors on a clean clone right after `pnpm install`, without any manual codegen step.
- Spec diff: none
- Codegen impact: no
- Design impact: none
- Sub-steps:
  - [x] run `prisma generate` once to verify lint/typecheck go green
  - [x] wire `postinstall: prisma generate` in `apps/backend/package.json`
  - [x] verify postinstall fires on `pnpm install`
  - [x] confirm `pnpm -r lint` reports 0 errors workspace-wide
  - [x] flip E01-F01-S02 to ✅ Done; TODO progress 7 / 115 → 8 / 115

## T-2026-04-26-008 — stage the design bundle under docs/design/ + index + .gitattributes

- Created: 2026-04-26
- Completed: 2026-04-26
- Result: merged locally to main as `5a57b7f` (no GitHub PR; `git merge --ff-only` from `chore/design-bundle-index`).
- Owner: claude
- Goal: a clone of the repository carries the full design handoff bundle alongside an index that names every project slug, its consumption story, and its file inventory; `.gitattributes` collapses prototype HTML/JSX/CSS as vendored.
- Spec diff: none
- Codegen impact: no
- Design impact: yes — bundle is now first-class repo content
- Sub-steps:
  - [x] move `docs/design/uploads/DESIGN_BRIEF.md` → `docs/design/DESIGN_BRIEF.md`
  - [x] write `docs/design/README.md` (index + handoff conventions)
  - [x] write `.gitattributes` (linguist-vendored on `docs/design/**` + linguist-generated on Dart tokens)
  - [x] flip `docs/roadmap/tasks/E00-F01-S01.md` to ✅ Done; tick TODO; bump progress to 7 / 115
  - [x] move T-006 / T-007 to `done.md`

## T-2026-04-26-007 — apps/backend/src/shared kernel: Branded IDs + DomainError + subclasses

- Created: 2026-04-26
- Completed: 2026-04-26
- Result: merged locally to main as `a3a8449` (no GitHub PR; `git merge --ff-only` from `chore/backend-shared-kernel`).
- Owner: claude
- Goal: cross-context kernel for `apps/backend` — `Brand<T,B>`/`Id<B>` for compile-time identifier safety and `DomainError` (+ `InvariantViolation`/`NotFound`/`PermissionDenied`) for RFC 9457 mapping.
- Spec diff: none
- Codegen impact: no
- Design impact: none
- Sub-steps:
  - [x] write `apps/backend/src/shared/{branded-id,domain-error}.ts` + spec files
  - [x] move three `common/errors/domain-error` import sites to `shared/`
  - [x] remove `apps/backend/src/common/errors/`
  - [x] add `shared` element to `boundaries/elements`
  - [x] tests 43/43; lint/typecheck regress-free (only pre-existing prisma type errors remain)

## T-2026-04-26-006 — eslint-plugin-boundaries: enforce DDD bounded-context boundaries

- Created: 2026-04-26
- Completed: 2026-04-26
- Result: merged locally to main as `6a17c89` (no GitHub PR; `git merge --ff-only` from `chore/eslint-boundaries`).
- Owner: claude
- Goal: a sibling-module import inside `apps/backend/src/modules/<X>` referencing `apps/backend/src/modules/<Y>` (Y ≠ X) fails lint with a readable, action-oriented message.
- Spec diff: none
- Codegen impact: no
- Design impact: none
- Sub-steps:
  - [x] add `eslint-plugin-boundaries` + `eslint-import-resolver-typescript` to `@app/eslint-config`
  - [x] wire `boundaries/elements` (module / common / i18n / app) and `boundaries/element-types` rule in `nest.mjs`
  - [x] mutation test confirmed cross-import rejection with the expected message
  - [x] left `boundaries/element-types` (v5 syntax) — v6 `boundaries/dependencies` rejected the migrated config; deferred follow-up

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
