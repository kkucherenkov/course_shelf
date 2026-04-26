# Active tasks

## T-2026-04-27-028 — E04 alignment (E04-F01-S01..E04-F02-S03)

- Created: 2026-04-27
- Owner: claude
- Spec: `docs/roadmap/tasks/E04-F01-S01.md`, `E04-F01-S02.md`, `E04-F02-S01.md`, `E04-F02-S02.md`, `E04-F02-S03.md`. The bounded-context backend has been built on top of these but with several deviations from the cards. This task closes the deltas so each E04 card can be flipped to ✅ Done with truthful sub-step ticks instead of "deviation: …" notes.
- Goal: align the actually-shipped backend to the E04 acceptance set without regressing the 638 existing tests.
- Acceptance (per card):
  - **E04-F01-S01**: rename / add the `OpsModule` so the bounded-context list in the card matches reality (catalog, access, learning, streaming, **ops**). `Branded<T>`, `DomainError` + subclasses, and the domain-error→HTTP-status filter are already in place — keep `HttpExceptionFilter`'s name (it's the same thing, doing the right thing) and document the deviation.
  - **E04-F01-S02**: add `GET /healthz` (always 200) and `GET /readyz` (200 only when the Prisma DB ping succeeds) **outside** the OpenAPI spec — i.e. without the `/api/v1` prefix. Both must be exempted from the OpenAPI validator (already true since validator mounts on `/api`) and from the global session guard (via `@AllowAnonymous`). Keep the existing richer `GET /api/v1/health` snapshot endpoint — `/healthz` and `/readyz` are the no-frills probes orchestrators want.
  - **E04-F02-S01**: enable Better Auth `admin` plugin; declare `additionalFields { role: string default 'USER', displayName: string optional }`; add `pnpm auth:schema` script that runs Better Auth's CLI to regenerate the auth Prisma section. **Skip** adopting `@thallesp/nestjs-better-auth` — the existing native integration is solid (51 tests cover it); a third-party wrapper is gratuitous risk. Document the deviation in the commit + card.
  - **E04-F02-S02**: introduce `@AllowAnonymous()` and `@Session()` decorators; register `SessionGuard` globally (via `APP_GUARD`); refactor every existing controller to drop `@UseGuards(SessionGuard)` + `resolveActor(req)` boilerplate in favour of `@Session() session: SessionUser`; add a `PingController` at `/api/v1/ping` (returns `{ id, role, displayName }` for the resolved session) — spec, codegen, impl.
  - **E04-F02-S03**: add an explicit `ignorePaths: /^\/(api\/v1\/auth|healthz|readyz)/` regex to the OpenAPI validator middleware so the auth catch-all is not subject to schema enforcement.
- Spec diff: yes — add `GET /api/v1/ping` operation. Remove nothing.
- Codegen impact: yes — TS + Dart clients regenerate.
- Design impact: none.
- Tests: existing 638 keep passing; new tests cover (a) `SessionGuard` honouring the AllowAnonymous metadata, (b) `/healthz` always 200 + `/readyz` reflecting DB ping, (c) `/ping` 401 without bearer / 200 with bearer (via supertest).
- Sub-steps:
  - [ ] T-028-A: `@AllowAnonymous` + `@Session` decorators; global `SessionGuard` via `APP_GUARD`; refactor 9 controllers; tests.
  - [ ] T-028-B: `OpsModule` with `/healthz` + `/readyz`; `setGlobalPrefix('api', { exclude })`; AllowAnonymous on both; supertest.
  - [ ] T-028-C: Better Auth — admin plugin + additionalFields; `pnpm auth:schema` script.
  - [ ] T-028-D: `/api/v1/ping` spec → codegen → `PingController`.
  - [ ] T-028-E: explicit `ignorePaths` in validator middleware.
  - [ ] T-028-F: lint, typecheck, test, prettier; flip all five cards; archive T-028; merge.
- Status: in-progress
- Blockers: —
