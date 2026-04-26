# Active tasks

## T-2026-04-26-006 — eslint-plugin-boundaries: enforce DDD bounded-context boundaries

- Created: 2026-04-26
- Owner: claude
- Spec: closes the second acceptance bullet of `docs/roadmap/tasks/E01-F01-S02.md` (the `boundaries` ruleset). The third acceptance bullet ("`pnpm lint` reports zero errors") is **outside** this PR — pre-existing `@typescript-eslint/no-unsafe-call` errors in `src/common/prisma/prisma.service.ts` and `src/modules/health/infra/prisma-db.checker.ts` stem from a missing Prisma client codegen and are tracked separately.
- Goal: a sibling-module import inside `apps/backend/src/modules/<X>` referencing `apps/backend/src/modules/<Y>` (Y ≠ X) fails lint with a readable, action-oriented message.
- Acceptance:
  - `eslint-plugin-boundaries` and `eslint-import-resolver-typescript` added to `@app/eslint-config` deps.
  - `packages/eslint-config/nest.mjs` declares `boundaries/elements` (module / common / i18n / app) and a `boundaries/element-types` rule that disallows `module → module` of a different name.
  - Mutation test: a deliberate cross-import in `src/modules/realtime/_cross-context.fixture.ts` produces `boundaries/element-types` error with `Cross-context import: module "realtime" cannot import from module "health"`. Confirmed and reverted.
  - `boundaries/no-unknown` is `error` (catches files that do not match any element pattern at the import target).
  - `boundaries/no-unknown-files` is `warn` (informational; surfaces orphan files for triage).
  - No regressions: clean lint after fixture removed reports the same 4 pre-existing prisma errors as before, no new ones.
- Spec diff: none
- Codegen impact: no
- Design impact: none
- Tests: mutation fixture above; manual lint diff before/after.
- Sub-steps:
  - [x] add `eslint-plugin-boundaries` and `eslint-import-resolver-typescript` to `packages/eslint-config/package.json`
  - [x] add boundaries config block to `nest.mjs` (elements + dependencies rule + import resolver settings)
  - [x] verify resolved config via `eslint --print-config` — boundaries plugin and rules surface for backend files
  - [x] mutation test: cross-import deliberately fails with expected message
  - [x] keep v5-style `boundaries/element-types` rule name; v6 `boundaries/dependencies` schema rejected the migrated config and left as a follow-up
  - [x] prettier on touched files
- Status: in-progress
- Blockers: —
