# Active tasks

## T-2026-04-27-029 — Realtime token + channels (E24-F01-S01)

- Created: 2026-04-27
- Owner: claude
- Spec: `docs/roadmap/tasks/E24-F01-S01.md`. Centrifugo container is running, `POST /api/v1/realtime/token` already mints a 5-minute HMAC JWT, but the AsyncAPI catalogue is one-channel thin (only `system:health`), the JWT has no `channels` claim despite the AsyncAPI doc claiming it does, and the controller still uses pre-E04-alignment `@Req()` + `auth.getSession(req)` plumbing.
- Goal: realtime spine that matches the card — AsyncAPI lists the two channels the card names (`library:scan:{libraryId}` and `notes:lesson:{lessonId}`) plus `progress:user:{userId}`, JWT carries a `channels` claim restricting subscribe scope, controller uses `@Session()`, Centrifugo namespace config declares the new prefixes, throttle on token endpoint.
- Acceptance:
  - `packages/specs/asyncapi/centrifugo.yaml` describes `library:scan:{libraryId}`, `notes:lesson:{lessonId}`, `progress:user:{userId}` (in addition to existing `system:health`). Each has a payload schema, `receive` operation, and a parameter declaration for the templated path segment.
  - `RealtimeService.issueToken` JWT payload includes `sub` (existing), `exp` (existing), and a new `channels: string[]` array containing the user-scoped channels the bearer may subscribe to without a per-channel token: `system:health`, `progress:user:<sub>`, `notifications:user:<sub>`. The two namespaced wildcards (`notes:lesson:*`, `library:scan:*`) are **not** in the token list — they will require subscribe-time authorization in a later story (out of scope here).
  - `RealtimeController` refactored to use `@Session() session: SessionContext` instead of `@Req() req` + `auth.getSession`. Throttle: `@Throttle({ default: { limit: 30, ttl: 60_000 } })` (clients reconnect frequently).
  - `RealtimeAuthError` is no longer thrown by the controller path (global `SessionGuard` returns 401 first). Keep the class file in case other callers need it, but document the controller no longer needs it.
  - `docker/centrifugo/config.json` declares new namespaces `library`, `notes`, `progress`, `notifications` (history off, presence off — safe defaults).
  - Tests: `realtime.service.spec.ts` covers token shape (`sub === user.id`, `exp ≈ now + ttl`, `channels` includes the three user-scoped entries, JWT verifies against the configured HMAC secret).
- Spec diff: yes — AsyncAPI; no OpenAPI changes (the `RealtimeToken` schema is already correct).
- Codegen impact: no — AsyncAPI doesn't have a client generator in this repo.
- Design impact: none.
- Tests: 1 new spec file (~5 cases).
- Sub-steps:
  - [ ] T-029-A: AsyncAPI — add `library:scan:{libraryId}`, `notes:lesson:{lessonId}`, `progress:user:{userId}` channels with schemas + receive operations
  - [ ] T-029-B: backend — refactor controller to `@Session()` + Throttle; enrich JWT with `channels` claim; tests
  - [ ] T-029-C: ops — update `docker/centrifugo/config.json` namespaces
  - [ ] T-029-D: lint, typecheck, test, prettier; flip card; archive T-029
- Status: in-progress
- Blockers: —
