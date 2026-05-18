# Spec-first runbook

The wire is the contract. Every new HTTP route, request shape, response shape, or real-time channel starts in `packages/specs/`, then flows out through codegen into the apps. Skip the spec and `express-openapi-validator` will reject the request at runtime — you'll just have done the work twice.

This runbook walks through adding a new endpoint end-to-end. Substitute names freely; the **shape** of each step is what matters.

## TL;DR

```sh
# 1. Edit the YAML
$EDITOR packages/specs/openapi/openapi.yaml

# 2. Validate + bundle + regenerate clients (one command)
pnpm spec:codegen

# 3. Implement in apps/backend
$EDITOR apps/backend/src/modules/<bounded-context>/...

# 4. Consume in apps/web (or apps/mobile)
$EDITOR apps/web/app/...

# 5. Stage codegen artefacts in their own commit, then ship the PR
```

`pnpm spec:codegen` chains `validate → bundle → codegen` via turbo — never run them separately during normal work.

## Worked example: add `GET /libraries/{id}/recent-scans`

### 1 — Edit `packages/specs/openapi/openapi.yaml`

Add the path under `paths:`. Reuse existing schemas via `$ref`; add new ones to `components.schemas`.

```yaml
paths:
  /libraries/{id}/recent-scans:
    get:
      operationId: listRecentScans
      summary: Recent scan history for a library.
      tags: [admin]
      parameters:
        - $ref: '#/components/parameters/PathLibraryId'
        - in: query
          name: limit
          schema: { type: integer, minimum: 1, maximum: 50, default: 10 }
      responses:
        '200':
          description: Recent scans.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/RecentScanList'
        '403': { $ref: '#/components/responses/Forbidden' }
        '404': { $ref: '#/components/responses/NotFound' }
```

Add the new schema (or extend an existing one). Examples are required when the operation accepts or returns a meaningful payload — Spectral fails the build otherwise:

```yaml
components:
  schemas:
    RecentScanList:
      type: object
      required: [items]
      properties:
        items:
          type: array
          items: { $ref: '#/components/schemas/RecentScanItem' }
      example:
        items:
          - id: scan_01HV...
            startedAt: '2026-04-30T12:00:00Z'
            status: succeeded
```

### 2 — Codegen

```sh
pnpm spec:codegen
```

That command runs:

| Step            | What it does                                      | Where                                          |
| --------------- | ------------------------------------------------- | ---------------------------------------------- |
| `spec:validate` | Spectral lint + OpenAPI 3.1 schema check          | `packages/specs/openapi/openapi.yaml`          |
| `spec:bundle`   | Resolves `$ref`s into a single deterministic file | `packages/specs/dist/openapi.bundled.yaml`     |
| `spec:codegen`  | Regenerates TS + Dart clients + NestJS DTOs       | `packages/api-client-{ts,dart}/.../generated/` |

Generated client files are **checked in** (regenerate via `pnpm spec:codegen`, never edit by hand). The DTOs live at `@app/api-client-ts/server` for the NestJS controllers; the runtime client lives at `@app/api-client-ts` for the SPA.

If validation fails, fix the YAML — never disable Spectral rules without a `// reason` comment in `.spectral.yaml`.

### 3 — Backend: command/query → handler → controller

Use CQRS: controllers dispatch a `Query` (read) or `Command` (write) onto the bus; handlers implement the use case. No HTTP exceptions inside handlers — throw a `DomainError` subclass and `HttpExceptionFilter` translates it to RFC 9457.

```ts
// apps/backend/src/modules/admin/application/queries/list-recent-scans.query.ts
export class ListRecentScansQuery {
  constructor(
    public readonly libraryId: string,
    public readonly limit: number,
    public readonly actor: { id: string; role: 'user' | 'admin' },
  ) {}
}
```

```ts
// apps/backend/src/modules/admin/application/queries/list-recent-scans.handler.ts
@QueryHandler(ListRecentScansQuery)
export class ListRecentScansHandler implements IQueryHandler<ListRecentScansQuery, RecentScanList> {
  constructor(
    @Inject(SCAN_REPOSITORY) private readonly scans: ScanRepository,
    @Inject(AUTHORIZATION_SERVICE) private readonly authz: AuthorizationService,
  ) {}

  async execute(q: ListRecentScansQuery): Promise<RecentScanList> {
    if (q.actor.role !== 'admin') throw new PermissionDenied('admin only');
    const items = await this.scans.findRecentByLibrary(q.libraryId, q.limit);
    return { items: items.map(toRecentScanItem) };
  }
}
```

```ts
// apps/backend/src/modules/admin/admin.controller.ts
@Controller('libraries/:id/recent-scans')
export class RecentScansController {
  constructor(private readonly bus: QueryBus) {}

  @Get()
  async list(
    @Param('id') libraryId: string,
    @Query('limit') limit = 10,
    @Session() session: SessionContext,
  ): Promise<RecentScanList> {
    return this.bus.execute(new ListRecentScansQuery(libraryId, Number(limit), session.user));
  }
}
```

Wire the controller + handler into the module's providers/controllers list.

### 4 — Tests

| Layer         | What                                                 | Where                                   |
| ------------- | ---------------------------------------------------- | --------------------------------------- |
| Unit          | Handler with fake repo + `AuthorizationService`      | `*.handler.spec.ts` next to the handler |
| Controller    | DI'd `QueryBus` + decorator wiring                   | `*.controller.spec.ts`                  |
| Spec contract | Round-trip request/response against the bundled YAML | `pnpm spec:contract-test`               |

```sh
pnpm --filter @app/backend test -- src/modules/admin/application/queries/list-recent-scans.handler.spec.ts
```

### 5 — Consume from the SPA

```ts
// apps/web/app/composables/useRecentScans.ts
import { listRecentScans } from '@app/api-client-ts';

export function useRecentScans(libraryId: string) {
  return useAsyncData(`recent-scans:${libraryId}`, async () => {
    const { data, error } = await listRecentScans({
      path: { id: libraryId },
      query: { limit: 10 },
    });
    if (error) throw error;
    return data;
  });
}
```

Never import from `packages/api-client-ts/src/generated/` — the public surface is `@app/api-client-ts`.

### 6 — Commit and ship

Land the codegen artefacts in **their own commit** so the diff is reviewable separately:

```sh
git add packages/specs/openapi/openapi.yaml
git commit -m "feat(specs): add GET /libraries/{id}/recent-scans"
git add packages/api-client-ts/src/generated packages/api-client-dart/lib/generated packages/specs/dist
git commit -m "chore(specs): regenerate clients for recent-scans endpoint"
git add apps/backend/src/modules/admin
git commit -m "feat(backend): list recent scans query + controller"
git add apps/web/app
git commit -m "feat(web): wire recent-scans composable + admin sidebar block"
```

PR through `main` — never push directly.

## Before you merge — checklist

- [ ] `pnpm spec:validate` is green; Spectral has no warnings you didn't justify.
- [ ] `pnpm spec:codegen` was the last command to touch `packages/api-client-{ts,dart}/`. If `git diff` shows hand-edits there, regenerate.
- [ ] Handler tests cover the auth + happy + 404 paths.
- [ ] Web composable tests OR Playwright e2e cover the SPA wiring.
- [ ] Conventional Commit prefix on every commit.
- [ ] Spec entry updated in `specs/tasks/active.md` → `specs/tasks/done.md`.

## Pitfalls

- **Editing generated files**: lint will accept them (the generator emits clean code), but the next `spec:codegen` run will overwrite your edits. If a generated type is wrong, fix the spec, not the output.
- **Skipping the bundle step**: `express-openapi-validator` reads the bundled file (`packages/specs/dist/openapi.bundled.yaml`). If you change the spec but don't bundle, the validator runs on a stale schema and accepts requests it should reject.
- **Adding inline schemas in the controller**: every request/response shape is a named `components.schemas` entry. Inline shapes don't make it into the generated DTOs.

## Related

- [`design-first.md`](./design-first.md) — the parallel runbook for UI changes that go through Claude Design before code.
- [`.claude/docs/handbook.md`](../../.claude/docs/handbook.md) — backend / CQRS / Prisma deep dive.
- [`.claude/docs/testing.md`](../../.claude/docs/testing.md) — testing pyramid + DoD.
