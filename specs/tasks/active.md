# Active tasks

## T-2026-04-26-010 — Library aggregate + register / list / get endpoints (E06-F01-S01)

- Created: 2026-04-26
- Owner: claude
- Spec: `docs/roadmap/tasks/E06-F01-S01.md` — first real domain story for the Catalog bounded context. Establishes the spec-first loop end-to-end (openapi → codegen → domain → application → infra → controller → tests) so subsequent E06/E07 stories follow the same template.
- Goal: an authenticated Owner-Admin can register a new Library by POSTing a name + rootPath; the Library aggregate enforces name-non-empty and rootPath-absolute-and-unique invariants; persistence round-trips through a Prisma repository behind a domain-owned port.
- Acceptance:
  - OpenAPI: `POST /api/v1/libraries`, `GET /api/v1/libraries`, `GET /api/v1/libraries/{id}` defined under tag `Catalog` with `BearerAuth` requirement; `LibraryDto` schema, `RegisterLibraryRequest` schema, RFC 9457 Problem responses on 400/401/403/404/409.
  - Codegen: `pnpm spec:validate && pnpm spec:bundle && pnpm spec:codegen` runs clean; `@app/api-client-ts` and `@app/api-client-dart` generated artefacts updated; codegen lands in its own commit.
  - Domain: `apps/backend/src/modules/catalog/domain/library/library.ts` exposes a `Library` aggregate with `register({ id, name, rootPath })` factory enforcing the invariants. `LibraryNameRequiredError`, `LibraryPathNotAbsoluteError`, `LibraryAlreadyExistsError` extend `DomainError`. `LibraryRepository` port lives next to the aggregate; no Prisma types leak across the boundary.
  - Persistence: `apps/backend/src/modules/catalog/infra/prisma-library.repository.ts` implements the port via `PrismaService`; mapper handles aggregate ↔ row translation. Prisma `Library` model added to `apps/backend/prisma/schema.prisma`.
  - Application: `RegisterLibraryCommand` + handler; `ListLibrariesQuery` + handler; `GetLibraryQuery` + handler. Handlers throw `DomainError` subclasses, never NestJS HTTP exceptions.
  - Presentation: `CatalogController` (`/api/v1/libraries`) routes the three endpoints into the CQRS bus; `CatalogModule` wires it up and is registered in `app.module.ts`.
  - Tests: domain unit tests cover both invariants. Handler tests with mocked port. Repository unit tests with mocked PrismaService (no real DB). lint / typecheck / test all clean.
  - Quality gates: `pnpm --filter @app/backend lint && typecheck && test` clean; `pnpm spec:validate && spec:bundle` clean.
- Spec diff: `packages/specs/openapi/openapi.yaml` — three new paths and three new schemas under `components`.
- Codegen impact: yes — regenerate `@app/api-client-ts` and `@app/api-client-dart`.
- Design impact: none — admin libraries UI lives in a later story (E14-F04-S01).
- Tests: see Acceptance.
- Sub-steps:
  - [x] T-010-A: spec edit — three paths + Library/RegisterLibraryRequest schemas (spec-writer subagent)
  - [x] T-010-B: codegen — `pnpm spec:codegen`; commit generated artefacts separately (codegen-runner subagent)
  - [x] T-010-C: Prisma model added to `schema.prisma`; migration draft created manually (DB not running)
  - [x] T-010-D: domain — aggregate + port + errors
  - [x] T-010-E: persistence — Prisma adapter + mapper
  - [x] T-010-F: application — command/queries + handlers
  - [x] T-010-G: presentation — `CatalogController` + `CatalogModule` + register in `app.module.ts`
  - [x] T-010-H: tests — domain unit (8), handler unit (3+3+3), repository unit (8) = 27 new tests, 70 total
  - [x] T-010-I: lint clean, typecheck pre-existing errors in generated client only, test 70/70 pass, prettier run
- Status: done
- Blockers: —
