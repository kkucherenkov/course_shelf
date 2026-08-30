# Active tasks

## T-2026-08-30-001 — close AUTH_SELF_REGISTRATION gap + bookmark create idempotency

- Created: 2026-08-30
- Owner: claude (backend-engineer, lane L6)
- Spec: GitHub #283, #285
- Goal:
  - #283: `AUTH_SELF_REGISTRATION=false` must reject `POST /sign-up/*`
    server-side (403 problem+json), not just hide the SPA's CTA.
  - #285: `POST /lessons/{id}/bookmarks` must be safe to retry — a crash
    after the server accepts a create must not create a second bookmark on
    retry.
- Spec diff: openapi.yaml — `CreateBookmarkRequest.idempotencyKey`, 200
  replay response on `createBookmark`. No spec change for #283 (`/api/v1/auth/*`
  is deliberately outside the OpenAPI contract).
- Codegen impact: yes (CreateBookmarkRequest gains a field)
- Sub-steps:
  - [x] #283: SelfRegistrationGuardMiddleware on `api/v1/auth/sign-up/*splat`
  - [x] #283: unit test
  - [x] #285: spec — idempotencyKey field + 200/201 semantics
  - [x] #285: spec:validate / bundle / codegen (own commit)
  - [x] #285: backend — dedupe by (lessonId, userId, idempotencyKey)
  - [x] #285: mobile — pass idempotencyKey from localId in `_drainBookmarks`
  - [x] gates: spec:validate, backend test, backend lint, typecheck, mobile test
- Status: in-progress (PR open, awaiting review/merge)
- Blockers: —
