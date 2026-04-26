# Active tasks

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
