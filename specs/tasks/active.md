# Active tasks

## T-2026-04-26-003 — brand-align design tokens + emit alias layer (PR 3a)

- Created: 2026-04-26
- Owner: claude
- Spec: in-thread agreement (option C-full, split into 3a/3b).
- Goal: replace the blue-stub palette in `specs/design/tokens/*.json` with the actual CourseShelf brand values used by `docs/design/shared/tokens.css`, and teach the emitter to publish the prototype's short CSS-var names (`--bg`, `--surface`, `--primary`, …) as aliases of the DTCG long names (`--surface-page`, `--surface-surface`, `--brand-accent`, …) so any component lifted from the JSX prototype works under code-stack tokens unchanged.
- Acceptance:
  - Every hex in `apps/web/app/assets/css/tokens.generated.css` (and the mirror in `packages/ui/src/tokens.generated.css`) for the prototype's short-name vars **byte-equals** the corresponding hex in `docs/design/shared/tokens.css` for both `:root` (dark) and `[data-mode="light"]`.
  - The emitter still produces the long-name DTCG vars unchanged (no regression on existing consumers).
  - `pnpm --filter @app/design-tokens build` succeeds; `lint` + `typecheck` pass.
  - Generated `tokens.g.dart` and `design-tokens.generated.ts` keep building (no API break).
  - DTCG inputs (`specs/design/tokens/{color,shadow,opacity}.json`) carry CourseShelf hex values, not the Tailwind-blue defaults.
- Spec diff: none
- Codegen impact: no (no `@app/api-client-*` regen)
- Design impact: yes — first time the code-stack carries actual CourseShelf brand
- Tests: manual hex parity check between generated CSS and prototype CSS; visual sanity on a subset of vars; existing `pnpm --filter @app/design-tokens lint typecheck` clean.
- Sub-steps:
  - [x] inventory short-name CSS vars in `docs/design/shared/tokens.css` (dark vs light blocks)
  - [x] inventory DTCG roles in `specs/design/tokens/{color,shadow,opacity}.json`
  - [x] write the role mapping (DTCG long → prototype short) as a const inside `emit-scss.ts` (annotated)
  - [x] add new DTCG roles missing from current schema — `color.text.loud`, `color.surface.skeletonBase`, `color.surface.skeletonShine`, `color.brand.accentSoft`, `color.status.{success,warning,error,info}Soft` (types.ts permissive — no schema change required)
  - [x] rewrite `specs/design/tokens/color.json` with brand hex values (warm neutrals + amber accent + brand semantic)
  - [x] rewrite `specs/design/tokens/shadow.json` with brand shadow values
  - [x] tune `specs/design/tokens/motion.json` durations (150/200/250) and easings to match prototype curves
  - [x] extend `emit-scss.ts` with themed alias section + static `--d-*`/`--e-*` aliases
  - [x] run `pnpm --filter @app/design-tokens build`; alias hex parity vs `docs/design/shared/tokens.css` is byte-equal for all checked pairs (dark + light)
  - [x] `pnpm --filter @app/design-tokens lint --fix && pnpm --filter @app/design-tokens typecheck` clean
  - [x] prettier-safe JSON (Write produced canonical form); emitter passed lint --fix
- Status: in-progress
- Blockers: —

## T-2026-04-26-004 — design-token cross-source audit + CI gate (PR 3b, queued)

- Created: 2026-04-26
- Owner: claude
- Spec: in-thread agreement (option C-full part 2).
- Goal: lock the brand alignment from PR 3a behind a CI gate that fails on hex drift between `docs/design/shared/tokens.json` and `specs/design/tokens/*.json` (after applying the role mapping).
- Acceptance: deferred until PR 3a lands.
- Status: queued
- Blockers: depends on T-2026-04-26-003.
