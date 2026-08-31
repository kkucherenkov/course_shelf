# Active tasks

## T-2026-08-31-001 — backend e2e layer + authenticated contract test

- Created: 2026-08-31
- Owner: claude (lane L1 — backend-e2e-auth-contract)
- Spec: GitHub #266, #321
- Goal: the backend gains a real supertest-driven e2e layer, and
  `pnpm spec:contract-test` finally exercises the 62 authenticated
  operations it has always skipped.
- Spec diff: none (openapi.yaml is owned by another lane)
- Codegen impact: no
- Sub-steps:
  - [x] extract the bootstrap wiring out of `main.ts` so tests boot the same app
  - [x] `apps/backend/test/**` e2e suite: Better Auth round-trip, SessionGuard
        401, openapi-validator 400 problem+json, secure headers
  - [x] make `*.e2e-spec.ts` actually run (vitest currently excludes it)
  - [x] fix the two `AuthModule` middlewares the new suite caught: both were
        mounted at `/api/api/v1/auth/…` and had never run
  - [x] `contract-test.ts` forwards a bearer token to schemathesis
  - [x] `e2e.yml` mints that token against the running stack
  - [ ] triage whatever the first authenticated run reports
- Status: in-progress
- Blockers: —
