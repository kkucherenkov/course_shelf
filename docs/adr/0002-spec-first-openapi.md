# 0002 — OpenAPI is the single source of truth, not the code

- **Status:** accepted
- **Date:** 2026-08-29
- **Deciders:** @kkucherenkov
- **Tags:** backend, frontend, mobile, contracts

> Recorded retroactively. Implemented across
> [E02-F01-S01](../roadmap/tasks/E02-F01-S01.md) …
> [E02-F02-S04](../roadmap/tasks/E02-F02-S04.md) and
> [E04-F02-S03](../roadmap/tasks/E04-F02-S03.md).

## Context

Two clients (Nuxt SPA, Flutter app) consume one API. The usual arrangement —
write the controller, then hand-write or annotate a client — puts the contract
in three places and keeps it correct by discipline alone. Discipline does not
survive a refactor: a renamed field in a NestJS DTO is a compile error in one
repo and a runtime `undefined` in the other two.

The generated-from-code alternative (`@nestjs/swagger` decorators) inverts the
dependency: the spec becomes an output, so it can never reject the
implementation, and the mobile client is generated from whatever the backend
happened to emit.

## Decision

`packages/specs/openapi/openapi.yaml` is the contract. Implementations are
derived from it, and the running server validates itself against it:

1. Edit `openapi.yaml`.
2. `pnpm spec:validate && pnpm spec:bundle && pnpm spec:codegen`.
3. Implement in `apps/backend` — `express-openapi-validator` is mounted at
   `/api` (`common/openapi/openapi-validator.middleware.ts`) and rejects drift
   at runtime.
4. Consume via the regenerated `@app/api-client-ts` / `@app/api-client-dart`.

Generated clients are committed, and CI's `Codegen drift guard` re-runs codegen
and fails if the diff is non-empty.

## Consequences

### Positive

- Drift is a build failure, not a bug report. The validator rejects a response
  the spec does not describe, so the contract cannot rot silently.
- Both clients are generated from the same document, so a field cannot exist on
  web and be missing on mobile.
- Committing the generated clients means a consumer never needs Java, the
  openapi-generator, or a network fetch to build.

### Negative

- Adding one endpoint is a four-step ritual across two commits (spec, then
  codegen artefacts). This is slower than writing a controller, and the slowness
  is the point, but it is real friction.
- The generator's Java jar is fetched from Maven Central, which answers 403
  often enough to red an unrelated PR; it now has to be cached explicitly
  (`ci.yml`, `Cache the openapi-generator jar`).
- A 272 KB single-file spec is unwieldy to review. It stays one file because
  `$ref` splitting buys directory structure at the cost of a bundling step
  before anything can read it.

### Neutral

- Binary-serving routes are deliberately **outside** the spec: the video, subtitle
  and material endpoints in `streaming.controller.ts` return byte streams with
  custom status codes and `Range` semantics that OpenAPI describes poorly. They
  are exempt from the validator and covered by controller tests instead. The same
  applies to `/api/v1/auth/*`, which Better Auth governs (see
  [ADR-0004](0004-better-auth-bearer-tokens.md)).

## Alternatives considered

### Option A — generate the spec from NestJS decorators

Rejected. The spec becomes a report of what the code does, so it can never fail
the code, and both clients inherit whatever the backend emitted.

### Option B — hand-written clients

Rejected. Two hand-written clients over ~100 operations is the drift problem
with extra steps.

### Option C — gRPC or tRPC

Rejected on the client side: the Flutter app and the browser both want plain
HTTP+JSON, and tRPC has no first-class Dart story.

## Related

- [ADR-0001](0001-monorepo-pnpm-turborepo.md) — the layout that lets spec and
  clients land atomically.
- [ADR-0009](0009-progressive-streaming-no-hls.md) — why the streaming routes
  sit outside the spec.
