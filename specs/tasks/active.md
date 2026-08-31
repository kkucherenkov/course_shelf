# Active tasks

## T-2026-08-31-001 — backend e2e layer + authenticated contract test

- Created: 2026-08-31
- Owner: claude (lane L1 — backend-e2e-auth-contract)
- Spec: GitHub #266, #321 — PR https://github.com/kkucherenkov/course_shelf/pull/433
- Goal: the backend gains a real supertest-driven e2e layer, and
  `pnpm spec:contract-test` finally exercises the 62 authenticated
  operations it has always skipped.
- Spec diff: none (openapi.yaml is owned by another lane)
- Codegen impact: no
- Sub-steps:
  - [x] extract the bootstrap wiring out of `main.ts` so tests boot the same app
  - [x] `apps/backend/test/**` e2e suite: Better Auth round-trip, SessionGuard
        401, openapi-validator 400 problem+json, secure headers
  - [x] make `*.e2e-spec.ts` actually run (vitest excluded the one glob the
        handbook names)
  - [x] fix the two `AuthModule` middlewares the new suite caught: both were
        mounted at `/api/api/v1/auth/…` and had never run, so sign-in was
        unlimited and `AUTH_SELF_REGISTRATION=false` was cosmetic (#283's hole)
  - [x] `contract-test.ts` forwards a bearer token to schemathesis, and
        `turbo.json` lets the variable actually reach it
  - [x] `e2e.yml` mints that token against the running stack, before anything
        else can claim the first-user-is-ADMIN slot
  - [x] triage the first authenticated run — 13/75 → 69/75 operations
        authenticated; three real 500s fixed (bigint `OFFSET` overflow, a
        missing optional body, NUL bytes anywhere in a payload or URL)
- Status: in-progress — the code is complete; the `E2E smoke` gate stays red on
  spec drift this lane may not touch.
- Blockers: the remaining contract-test findings all need
  `packages/specs/openapi/openapi.yaml` (`minProperties: 1` on three PATCH
  bodies, `dependentRequired` on the rating pair, `maximum` on `offset`,
  `minLength: 1` on the course grant target, documenting 422 and 404 on four
  operations, and a decision on how the spec expresses "no NUL bytes").
  Tracked as `tuxedo` 26–29; details in the PR body.
