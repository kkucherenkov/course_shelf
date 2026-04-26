# Active tasks

## T-2026-04-26-011 — fix workspace tsc regression in generated `@app/api-client-ts`

- Created: 2026-04-26
- Owner: claude
- Spec: regression introduced by `be9ac44` (codegen for E06-F01-S01). The `@hey-api/openapi-ts` output uses optional fields without `| undefined`, which collides with `exactOptionalPropertyTypes: true` in the consuming tsconfigs. `tsc --noEmit` from `apps/backend` (and any other generated-client consumer) now reports TS2379 / TS2375 in `core/serverSentEvents.gen.ts`. Affects no runtime behaviour — just CI typecheck.
- Goal: every workspace project's `pnpm typecheck` exits 0 again, without disabling `exactOptionalPropertyTypes` globally and without manual edits to generated files (which would be lost on the next `pnpm spec:codegen`).
- Acceptance:
  - `pnpm --filter @app/backend exec tsc --noEmit` exits 0.
  - `pnpm -r typecheck` (or `turbo run typecheck`) exits 0 across the workspace.
  - The fix lives in either `packages/api-client-ts/openapi-ts.config.*` (codegen-time directive) or `packages/api-client-ts/tsconfig.json` (compile-time relaxation that does not propagate to consumers — emit `.d.ts` and let consumers read those instead of the raw `.ts`).
  - Re-running `pnpm spec:codegen` produces output that still passes typecheck (no manual post-processing required).
- Spec diff: none
- Codegen impact: maybe — if the fix is to add a build step that emits `.d.ts` from `packages/api-client-ts`, that becomes the new artefact consumers see.
- Design impact: none
- Tests: workspace typecheck.
- Sub-steps:
  - [ ] read `packages/api-client-ts/package.json` + `openapi-ts` config (if any) to understand the codegen invocation
  - [ ] try the cleanest path first: a codegen flag that turns optional `T` into `T | undefined` (`@hey-api/openapi-ts` has `exportType` / `useUnionsForOptional`-style options — verify version)
  - [ ] if codegen has no such switch, add a minimal `tsconfig.build.json` in `packages/api-client-ts` that emits `.d.ts` to `dist/` and have package `exports` point at `dist/`; consumers then read declarations, not raw `.ts`
  - [ ] regenerate, verify `pnpm --filter @app/backend typecheck` clean
  - [ ] run `pnpm -r typecheck` and confirm green workspace-wide
- Status: queued
- Blockers: —
