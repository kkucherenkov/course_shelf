# Feature Migration Guide

Use this when porting a feature from an existing project into this boilerplate-based repo.

## Claude prompt to start a migration

"Read the [FeatureName] module from [/path/to/source/project/src/modules/feature].
Migrate it to this project following the spec-first workflow and boilerplate conventions."

## Migration checklist (Claude follows these steps)

1. **Read source domain** — ports.ts, errors.ts, domain models
2. **Add to OpenAPI spec** — new paths in packages/specs/openapi/openapi.yaml
3. **Validate + bundle + codegen** — `pnpm spec:validate && pnpm spec:bundle && pnpm spec:codegen`
4. **Create task** — add a file under specs/tasks/active/
5. **Backend** — create module with handlers using IoC port pattern (no direct PrismaService in handlers)
6. **Web** — create page(s) + composables using @app/api-client-ts
7. **Tests** — unit spec per handler, coverage must stay ≥ thresholds
8. **Quality gate** — `turbo run lint typecheck` + `pnpm --filter @app/backend test:coverage`
9. **Done** — git mv the file into specs/tasks/done/

## Quality rules (enforced by CI and ESLint)

- No PrismaService imports in handlers — use port interfaces via @Inject(SYMBOL)
- No inline styles — use SCSS + design tokens
- No hardcoded strings in UI — use t() / AppLocalizations
- Commands return void or {id: string} — never full entities
- Every @app/ui component needs .vue + .stories.ts + .spec.ts + index.ts
- pnpm audit --audit-level=high must pass after adding new deps
