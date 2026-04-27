# Handbook — backend, web, mobile patterns

## Anti-patterns — hard bans

Rejected in review, no exceptions:

- `any` (TS) or `dynamic` (Dart, outside serialization) — use `unknown` + narrowing.
- `!important` in SCSS/CSS.
- `@ts-ignore`, `@ts-nocheck`, `// eslint-disable-*` without a WHY comment. `// fix later` is not a reason.
- Inline `style=""` with literal values.
- Magic numbers / colors — every non-zero literal in layout/colour/timing is a named token or a `const`.
- God components — `.vue` or `.dart` files over ~300 lines. Split.
- Raw `z-index: 37` — use the z-index token scale.
- `console.log` in shipped code.
- Hand-rolled fetch / dio clients outside `composables/useApi.ts` or Flutter `data/` layer.
- `fetch` with no error branch.
- Mixing concerns: visual components with data fetching, domain code with SQL, controllers with business logic.

## TypeScript

- `strict: true`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` — keep them on everywhere.
- `packages/ui` is the **only** place `exactOptionalPropertyTypes` is relaxed (Nuxt UI v4 prop types).
- Ban `any`. Public function/method signatures must have explicit return types.
- DTOs and API types come from `@app/specs` or the generated clients — never hand-rolled.

## NestJS modules

```
apps/backend/src/modules/<context>/
├── domain/           # entities, value objects, port interfaces (Symbols)
├── application/
│   ├── commands/     # XCommand + XCommandHandler
│   ├── queries/      # XQuery + XQueryHandler
│   └── events/
├── infra/            # adapters: Prisma repos, Redis, HTTP clients
├── <context>.controller.ts
└── <context>.module.ts
```

One bounded context per module. Cross-module communication via events or an explicit facade — never direct service imports.

## CQRS

- `@nestjs/cqrs`. Commands → `XCommand` + `XCommandHandler`. Queries → `XQuery` + `XQueryHandler`.
- Controllers: validate → dispatch (`CommandBus` / `QueryBus`) → shape response. No business logic, no Prisma.
- Reads and writes may diverge (separate repos / read models).

### Command return type rule (enforced in PR review)

**Commands must not return full entity or DTO objects.** Allowed return types:

| Type                           | When                                                           |
| ------------------------------ | -------------------------------------------------------------- |
| `void`                         | Delete, cancel, fire-and-forget writes                         |
| `{ id: string }`               | Create — caller issues a separate query if full data is needed |
| `{ requestedAt: string; ... }` | Async side-effect confirmation (GDPR export, account deletion) |

Returning a full read model from a command couples the write and read sides and defeats CQRS. If the HTTP endpoint must return the created/updated resource, the **controller** chains a query:

```ts
// ✓ Correct — command returns ID, controller fetches the record
const { id } = await this.commandBus.execute<{ id: string }>(new CreateXCommand(...));
return this.queryBus.execute(new GetXQuery(id));

// ✗ Wrong — command returning a full entity
return this.commandBus.execute(new CreateXCommand(...)); // → returns full resource
```

The reference implementation is `apps/backend/src/modules/_template/`.

## Inversion of control

- Domain depends on **ports** (interfaces in `domain/`). Infra provides **adapters** (classes in `infra/`).
- Register: `{ provide: SYMBOL_TOKEN, useClass: ConcreteAdapter }`. Tests mock ports, not Prisma.
- Never `new` a service. Never `process.env` outside `common/config` — use `AppConfig`.
- **ESLint enforces this**: direct `PrismaService` imports in `application/**` and `domain/**` are banned. Inject the port symbol instead.

## Prisma & anti-N+1

- Every list read: use `include` / `select` shaped for the use case. Don't load whole graphs.
- Batch: inject `IDataLoaderFactory` via `@Inject(DATA_LOADER_FACTORY)` from `common/dataloader/`, then `factory.get<K,V>('loaderKey', batchFn)`. Or use `findMany({ where: { id: { in: ids } } })` directly. Loaders are request-scoped — same key returns the same instance within one request.
- Never: `for (const x of xs) await prisma.y.findUnique(...)`.
- Log queries in dev; `EXPLAIN` on hot queries.

## Validation

- HTTP input: class-validator + global `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })`.
- Second belt: `express-openapi-validator` against the bundled spec rejects drift automatically.
- Web forms: schemas from `@app/specs` — don't hand-roll a parallel validator.

## Errors

- RFC 9457 `application/problem+json` — see `apps/backend/src/common/filters/http-exception.filter.ts`.
- Business errors extend `DomainError`. Never `throw new Error(...)` from domain code.
- **ESLint enforces this**: NestJS HTTP exceptions (`NotFoundException`, `ForbiddenException`, …) are banned inside `application/**`, `domain/**`, and `**/*.service.ts` via `no-restricted-imports`. The rule fires if you try to import them there.
- Each module owns its errors file: `modules/<name>/domain/<name>.errors.ts`.

```ts
// modules/<name>/domain/<name>.errors.ts
import { DomainError } from '../../../common/errors/domain-error';

export class ThingNotFoundError extends DomainError {
  constructor(id: string) {
    super({
      code: 'thing-not-found',
      status: 404,
      title: 'Thing not found',
      detail: `Thing ${id} does not exist.`,
    });
  }
}
```

## New module scaffold

Copy `apps/backend/src/modules/_template/` as a starting point. It shows the full pattern (controller → command/query handlers → port interface → DomainErrors) with annotated comments. After copying, rename every `_template` occurrence to your context name.

## Web form validation

Use `composables/useFormValidation.ts` for all forms. Never inline regex or per-field `computed`:

```ts
// Example — derive schema from @app/specs types where possible
const schema = z.object({
  phone: z.string().min(6, t('validation.phoneMin')),
  password: z.string().min(8, t('validation.passwordMin')),
});
const { errors, validate } = useFormValidation(schema);

async function submit() {
  if (!validate(formData)) return;
  await api.doThing(formData);
}
```

## API design conventions

- **Pagination.** Cursor-based: `cursor` + `limit` (default 20, max 100). Envelope: `{ items: [...], nextCursor: string | null }`.
- **Idempotency.** Mutating retryable endpoints accept `Idempotency-Key`; store key + response ≥24h.
- **Versioning.** URI versioning `/api/v1/…`. Breaking changes bump major; additive changes stay in v1.
- **Deprecation.** `deprecated: true` in OpenAPI at least one minor before removal. Add `Sunset` header on removal.
- **Dates.** ISO-8601 with offset on the wire. UTC internally. Never naive timestamps.
- **Money.** Integer minor units (cents) or string decimals (`"12.34"`) — never JS `number`. Always include `currency`.
- **PII.** Email + phone are PII — never in list endpoints unless explicitly authorised.

## Database migrations

- Every schema change is a Prisma migration (`prisma migrate dev`). No ad-hoc SQL on prod data.
- **Non-destructive default.** Add column is fine; rename/drop requires two-step migration (add → backfill → switch → drop).
- Migrations must be forward-compatible with the previous code version for at least one deploy cycle.
- **Baselining a fresh DB.** If the database was bootstrapped with `prisma db push` (no `_prisma_migrations` table), run `pnpm --filter @app/backend prisma:baseline` to mark every existing migration as applied. The script is idempotent and reads the migrations directory directly, so it stays correct as new migrations are added.

## Web (Nuxt — SPA only)

- `ssr: false`. No server routes or SSR logic.
- Fetch only through `composables/useApi.ts`. Never `$fetch` inline in a component or page.
- Auth only through `composables/useAuth.ts` (wraps `better-auth/vue`).
- Visuals in `@app/ui` (dumb components). Page logic in `apps/web/app/pages`.

### Required page data-fetch pattern

Every `useAsyncData` call **must** destructure and render all three states:

```vue
<script setup>
  const { data, pending, error, refresh } = useAsyncData('key', () => api.getThing());
</script>

<template>
  <LoadingState v-if="pending" :title="t('loading')" />
  <ErrorState
    v-else-if="error"
    :title="t('error')"
    :retry="{ label: t('retry'), onClick: refresh }"
  />
  <EmptyState v-else-if="!data?.items?.length" :title="t('empty')" />
  <template v-else>
    <!-- happy path -->
  </template>
</template>
```

Skipping `error` or `pending` state is a review blocker. This applies to every data fetch on the page, including secondary fetches.

## Mobile (Flutter)

- **Feature layering**: `features/<name>/{domain, data, presentation}/`.
- **State management**: `flutter_bloc` — `Bloc<Event, State>` for multi-event flows, `Cubit<State>` for simple state. Events/states are immutable `Equatable` objects. No logic inside `build()`.
- **DI**: `get_it` in `lib/shared/di/injector.dart`. Singletons for infra; factories for BLoCs/Cubits. Never `getIt<T>()` from `build()`. Never `new Service()` in widgets.
- **HTTP**: Dio, confined to `shared/network/` and `features/*/data/`. Domain and presentation never import `dio`.
- **Secure storage**: bearer + refresh tokens in `flutter_secure_storage` behind a `TokenStorage` port. Dio interceptor attaches token; 401 clears storage and emits sign-out.
- **Models**: `freezed` + `json_serializable`. Regenerate: `dart run build_runner build --delete-conflicting-outputs`.
- **Anti-patterns**: `StatefulWidget` for business state, `Provider.of` / `InheritedWidget` as DI hack, global singletons outside `get_it`, `setState` cascades.

## Commits / PRs

- Conventional Commits: `feat(api): ...`, `fix(web): ...`, `chore(specs): ...`.
- Small, focused PRs. Spec change + codegen + implementation may be one PR but separate commits.
- Every PR that shipped a task updates `specs/tasks/done.md`.
- Never force-push to `main`. Never commit `.env`.
- Dependency bumps: minor/patch grouped weekly; majors get their own PR with changelog link + smoke test.

## Escalation — when to ask vs proceed

**Proceed without asking** when the change is local, reversible, and matches an existing pattern.

**Ask first** when:

- Introducing a new top-level dependency.
- Changing a public API contract in a breaking way.
- Touching auth, payments, or PII in a novel way.
- Refactor grows beyond ~10 files or mixes concerns.
- Would require bypassing a quality gate.
