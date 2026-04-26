# Active tasks

## T-2026-04-26-013 — AccessGrant aggregate + admin endpoints (E07-F01-S01)

- Created: 2026-04-26
- Owner: claude
- Spec: `docs/roadmap/tasks/E07-F01-S01.md` — Access control bounded context first slice. Owner-Admins issue per-user READ grants against either a Library or a Course. Unblocks E08 (Streaming, signed token issuance is gated on a READ grant) and E14-F04-S01 (Admin UI). Builds on E06-F01-S01 — Library is the primary grant target; Course grants compose against E06-F03-S01 once it lands but the contract supports them now.
- Goal: an authenticated admin can `POST /api/v1/access/grants` to grant a user READ access on a library (or a course id placeholder), `DELETE /api/v1/access/grants/{id}` to revoke, and `GET /api/v1/access/grants?userId=` to list a user's grants. Non-admin callers get 403 (Better Auth `admin` plugin role check).
- Acceptance:
  - OpenAPI under tag `Access`: `POST /access/grants` (201 → `AccessGrantDto`), `DELETE /access/grants/{id}` (204), `GET /access/grants?userId=…` (200 → `AccessGrantListDto`). All `bearerAuth`-secured + RFC 9457 Problem responses on 400 / 401 / 403 / 404 / 409.
  - Schemas: `AccessGrantDto`, `AccessGrantListDto`, `RegisterGrantRequest`. Discriminated `target`: `{ kind: 'library', libraryId }` | `{ kind: 'course', courseId }`. Level fixed to `READ` for v1; the field is required + enum-bounded so v2 can extend it.
  - Codegen: `pnpm spec:codegen` runs clean; generated TS + Dart artefacts land in their own commit.
  - Domain: `apps/backend/src/modules/access/domain/grant/{grant.ts, grant.repository.ts, grant.errors.ts}`. Aggregate owns: id (Brand<Lib/Course/User> ids), target tag, level. Invariants: target shape valid, level present, idempotent on (userId, target) — second register surfaces `GrantAlreadyExistsError` from a Prisma P2002.
  - Persistence: Prisma `AccessGrant` model + migration SQL (Docker likely off — author the SQL by hand if needed). Adapter at `apps/backend/src/modules/access/infra/prisma-grant.repository.ts` with mapper.
  - Application: `RegisterGrantCommand`, `RevokeGrantCommand`, `ListUserGrantsQuery` + handlers. `RevokeGrantCommand` throws `GrantNotFoundError extends NotFound` when missing.
  - Presentation: `AccessController` (`/api/v1/access`) with the three operations. Admin guard sourced from Better Auth's `admin` plugin (`session.user.role === 'admin'`); non-admin throws `PermissionDenied`. `AccessModule` registered in `app.module.ts`.
  - Tests: domain unit (target invariants); handler unit for all three; repository roundtrip with mocked PrismaService; controller smoke. Backend `lint && typecheck && test` clean.
- Spec diff: yes — three new paths under `/api/v1/access/grants`, three new schemas in components.
- Codegen impact: yes — TS + Dart regenerated.
- Design impact: none for v1 (the admin permissions UI ships in E14-F04-S01 against this contract).
- Tests: see Acceptance.
- Sub-steps:
  - [x] T-013-A: spec edit (spec-writer) — landed commit d82bceb
  - [x] T-013-B: codegen, separate commit (codegen-runner) — landed commit cba2ae2
  - [x] T-013-C: Prisma model + migration SQL
  - [x] T-013-D: domain — aggregate + port + errors
  - [x] T-013-E: persistence — adapter + mapper
  - [x] T-013-F: application — commands/queries + handlers
  - [x] T-013-G: presentation — controller + admin guard + module registration
  - [x] T-013-H: tests — 102 pass (21 files)
  - [x] T-013-I: lint, typecheck, test, prettier; tick TODO + flip card
- Status: done
- Blockers: —
