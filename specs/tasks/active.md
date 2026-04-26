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
  - [x] inventoried `packages/api-client-ts/package.json` + tsconfig — package was exporting raw `.ts` (`main: ./src/index.ts`); api-client-ts already had `exactOptionalPropertyTypes: false` in its own tsconfig, so building to `.d.ts` produces relaxed declarations consumers can trust
  - [x] no `@hey-api/openapi-ts` config exists in repo; chose declaration-emit path instead (cleaner, no codegen-tool flag needed)
  - [x] add `packages/api-client-ts/tsconfig.build.json` (`emitDeclarationOnly: true`, `outDir: dist`) + `build` script (`tsc -p tsconfig.build.json`)
  - [x] flip `package.json`: `types: ./dist/index.d.ts`, conditional `exports.types` → dist; `main` stays at `./src/index.ts` so runtime continues stripping TS via Node `--experimental-strip-types`; `files` adds `dist`
  - [x] wire auto-build: root `prepare` script chains `husky && pnpm --filter @app/api-client-ts build`; root `spec:codegen` chains `... && pnpm --filter @app/api-client-ts build` so a clean clone or a fresh codegen always has dist ready
  - [x] verified: `pnpm -r typecheck` clean across all 8 TS workspace projects; `pnpm -r lint` 0 errors / 53 warnings (pre-existing vue formatting); backend test 70/70
- Status: in-progress
- Blockers: —

## T-2026-04-26-012 — fix Dart codegen (openapi-generator-cli env conflict)

- Created: 2026-04-26
- Owner: claude
- Spec: pre-existing infrastructure issue first surfaced during the E06-F01-S01 codegen run (`be9ac44`). `openapi-generator-cli` v2.31.1 ships with a NestJS dependency wrapper whose runtime cannot coexist with the backend's NestJS install in this pnpm monorepo, so `pnpm spec:codegen` fails partway and `pnpm api-client-dart` gets stale. Fails on `main` too — not a regression.
- Goal: `pnpm spec:codegen` succeeds end-to-end; the Dart Dio client in `packages/api-client-dart/lib/generated/` reflects the current OpenAPI spec.
- Acceptance:
  - `pnpm spec:codegen` exits 0 (TS + Dart legs both succeed).
  - `pnpm exec turbo run typecheck` no longer fails on `@app/specs#codegen`.
  - `apps/mobile` consumes the regenerated client without `flutter analyze` regressions.
- Sub-steps:
  - [ ] read `packages/specs/scripts/codegen.ts` and the openapi-generator-cli invocation
  - [ ] try one of: pin to a working version, replace with a different Dart Dio generator (`dart-dio`, `openapi-generator-cli` standalone JAR, or `swagger-codegen`), or run inside a Docker container
  - [ ] regenerate `packages/api-client-dart/lib/generated/` from the current spec
  - [ ] verify mobile build: `cd apps/mobile && flutter pub get && flutter analyze`
- Status: queued
- Blockers: —
