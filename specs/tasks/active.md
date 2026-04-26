# Active tasks

## T-2026-04-26-007 — apps/backend/src/shared kernel: Branded IDs + DomainError + subclasses

- Created: 2026-04-26
- Owner: claude
- Spec: closes the shared-kernel acceptance bullets of `docs/roadmap/tasks/E04-F01-S01.md` (Branded ID at `apps/backend/src/shared/branded-id.ts`, DomainError + named subclasses at `apps/backend/src/shared/domain-error.ts`). E04-F01-S01 still has the empty bounded-context-modules bullet outstanding (Catalog/Access/Learning/Streaming/Ops do not exist yet — they materialise in their own epics), so the card stays at ⬜ for now.
- Goal: every aggregate in `apps/backend` has a single import path for the cross-context kernel: `Brand<T,B>` / `Id<B>` for compile-time identifier safety, and `DomainError` (+ `InvariantViolation` / `NotFound` / `PermissionDenied`) so HttpExceptionFilter can map any business error to RFC 9457 without controller logic.
- Acceptance:
  - `apps/backend/src/shared/branded-id.ts` exports `Brand<T,B>`, `Id<B>`, and a `brand()` no-op cast.
  - `apps/backend/src/shared/domain-error.ts` exports `DomainError` plus `InvariantViolation` (422), `NotFound` (404), `PermissionDenied` (403).
  - `apps/backend/src/common/errors/` directory removed; old import paths (`../common/errors/domain-error`) replaced with `../shared/domain-error` in three call sites: `http-exception.filter.ts`, `_template/domain/_template.errors.ts`, `realtime/domain/realtime.errors.ts`.
  - `boundaries/elements` in `packages/eslint-config/nest.mjs` carries a new `shared` element so `src/shared/**` is not flagged by `boundaries/no-unknown-files`.
  - Unit tests: `apps/backend/src/shared/{branded-id,domain-error}.spec.ts` cover the API including a `@ts-expect-error` cross-brand assignment; `pnpm --filter @app/backend test -- src/shared` passes (43 / 43 in the suite).
  - No regressions: lint and typecheck report only the same 4 pre-existing Prisma `no-unsafe-call` / TS2339 errors as before (Prisma client codegen is missing — separate concern).
- Spec diff: none
- Codegen impact: no
- Design impact: none
- Tests: vitest spec files cover `Brand<T,B>` no-op runtime + cross-brand type rejection, and DomainError + subclass instances (status/code/title/name/cause/instanceof).
- Sub-steps:
  - [x] write `apps/backend/src/shared/branded-id.ts` (`Brand<T,B>`, `Id<B>`, `brand()`)
  - [x] write `apps/backend/src/shared/domain-error.ts` (base + `InvariantViolation` / `NotFound` / `PermissionDenied`)
  - [x] write spec files for both modules
  - [x] move all `common/errors/domain-error` imports to `shared/domain-error` (3 sites)
  - [x] remove `apps/backend/src/common/errors/` directory
  - [x] add `shared` element to `boundaries/elements` in `packages/eslint-config/nest.mjs`
  - [x] verify: `pnpm --filter @app/backend test -- src/shared` 43/43 passing; lint/typecheck regress-free
  - [x] prettier on touched files
- Status: in-progress
- Blockers: —
