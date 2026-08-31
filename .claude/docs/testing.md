# Testing, Definition of Done, PR checklist

## Testing pyramid

**Unit tests** (bulk) — every command/query handler, every pure domain function. Mock ports (interfaces), not Prisma.

**Integration tests** — controller → handler → repository, real Prisma against a test DB.

**E2E tests** (Playwright / Flutter integration) — critical journeys only: auth, booking, payment. Not every button.

**Contract tests** (Schemathesis) — run against the live backend to catch spec drift beyond the in-process validator.

Rule: don't mock what you own — mock ports (interfaces), not Prisma or the HTTP layer.

### Backend test locations

- Unit: `apps/backend/src/**/*.spec.ts` — handlers with mocked ports.
- E2E: `apps/backend/test/**/*.e2e-spec.ts` — minimal Nest module + supertest +
  mocked external systems. Built by `test/e2e-app.ts`, which calls the same
  `configureApp()` `main.ts` uses, so helmet / validator / guard ordering is the
  real thing rather than a copy. Runs in the default `pnpm --filter @app/backend
  test` — the suite needs no services.

### Web test locations

- Unit: `packages/ui/src/**/*.spec.ts` — component tests (Vitest + Vue test utils).
- E2E: `apps/web/tests/e2e/**` — Playwright, seeds DB in `global-setup.ts`.

### Mobile test locations

- `apps/mobile/test/**` — `bloc_test` for Bloc/Cubit state flows, `mocktail` for port mocks.
- Widget tests: wrap in `BlocProvider.value(value: mockBloc)`.

## Definition of Done

A task is done when **all** hold:

1. Code + tests merged to `main` via a PR.
2. `pnpm -r lint typecheck test` + `flutter analyze test` green in CI.
3. OpenAPI / AsyncAPI updated if contracts changed; codegen committed.
4. New user-visible strings in `en` **and** `ru` translation files.
5. New UI has a Storybook story + spec file.
6. Task entry moved from `specs/tasks/active.md` to `done.md` with PR link.
7. No TODO without an issue reference; no `@ts-ignore` / `eslint-disable` without a WHY comment.

## Coverage thresholds (backend)

`apps/backend/vitest.config.ts` enforces coverage on `application/**` and `domain/**` handler files only (infra and controllers are excluded — they require integration tests, not unit tests):

```
lines:      43%
functions:  38%
statements: 44%
branches:   44%
```

These are **ratchet thresholds** — they reflect the current baseline. CI fails if coverage drops below them. Raise them as new handler tests are added. Every new handler **must** have a unit test — not enforced by the threshold alone, but checked in PR review.

Target: grow toward 70%/70%/70%/60% as more modules gain test coverage.

## PR review checklist

- [ ] Spec-first: no route without an OpenAPI/AsyncAPI entry.
- [ ] No hand-edited files in `packages/api-client-*/generated/`.
- [ ] `any` / `dynamic` / `!important` / inline `style=""` absent.
- [ ] User-visible strings go through `t()` / `AppLocalizations`.
- [ ] Public function signatures have explicit return types.
- [ ] List endpoints paginate; responses aren't unbounded.
- [ ] PII / secrets / tokens absent from logs.
- [ ] Error paths render, not just the happy path.
- [ ] Tests added for new behaviour; edge cases considered.
- [ ] `specs/tasks/active.md` → `done.md` entry updated.
- [ ] `pnpm --filter @app/ui audit:components` exits 0 (no story/spec gaps).
- [ ] Every new page handles all three states: loading, error, empty — not just the happy path.
- [ ] Every new form uses `useFormValidation(schema)` — no inline regex or `computed` validators.
- [ ] Every new backend handler has a unit test (`*.handler.spec.ts`).
- [ ] No NestJS HTTP exceptions (`NotFoundException`, …) in `application/`, `domain/`, or `*.service.ts` — use DomainError subclasses (ESLint enforces this).
- [ ] No `PrismaService` imported directly in `application/**` or `domain/**` — inject a port symbol (ESLint enforces this).
- [ ] Command handlers return `void`, `{ id: string }`, or a side-effect confirmation — **never** a full entity/DTO object. If the HTTP response needs the resource, chain a query in the controller (see handbook.md → CQRS).
