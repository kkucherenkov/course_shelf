# Active tasks

## T-2026-04-28-054 — Auth surface · spec + backend half (E14-F02-S01 part 1 of 2)

- Created: 2026-04-28
- Owner: claude
- Spec: `docs/roadmap/tasks/E14-F02-S01.md`
- Goal: ship the API + backend half of the Stage A auth surface so the web pages (sign-in / sign-up / forgot / reset) can land in a separate PR. Adds `GET /admin/instance` exposing the three feature flags the auth pages need, and the matching backend handler.
- Acceptance:
  - `GET /api/v1/admin/instance` (anonymous, no auth — same posture as `GET /admin/has-users`) returns `{ selfRegistration: bool, emailVerificationRequired: bool, ssoProviders: Array<{ id, label, iconName }> }`.
  - `selfRegistration` defaults to `true` — admin opts out via env `AUTH_SELF_REGISTRATION=false`.
  - `emailVerificationRequired` defaults to `false` — admin opts in via env `AUTH_EMAIL_VERIFICATION=true` (mirrors the Better Auth plugin toggle).
  - `ssoProviders` defaults to `[]` — Better Auth's `genericOAuth` lands in v2; the schema is in place so the SsoBlock renders the moment providers are configured.
  - Spec validates, regenerates clean, generated client + DTO surfaces include the new endpoint.
  - Backend handler reads from `AppConfig` (no `process.env` direct access) and returns the trio. No DB I/O — pure config projection.
- Spec diff: yes — `GET /admin/instance` + `InstanceConfigDto` (and a small `SsoProviderConfig` item shape).
- Codegen impact: yes — re-emit `@app/api-client-ts`, `@app/api-client-dart`, server DTO surface.
- Design impact: none.
- Tests: vitest unit spec for the handler covering each toggle path.
- Sub-steps:
  - [ ] Push active.md entry
  - [ ] Edit `packages/specs/openapi/openapi.yaml` — add endpoint + schemas
  - [ ] Run `pnpm spec:validate && pnpm spec:bundle && pnpm spec:codegen`
  - [ ] Stage codegen as its own commit
  - [ ] Implement `GetInstanceConfigHandler` + controller route in the existing admin module (alongside `getAdminHasUsers`)
  - [ ] Wire `AppConfig` keys (`AUTH_SELF_REGISTRATION`, `AUTH_EMAIL_VERIFICATION`)
  - [ ] Backend unit tests (each toggle path)
  - [ ] Lint + typecheck + tests
  - [ ] Commit + push + open PR (`Refs #62`; the second PR carries `Closes #62`)
- Status: in-progress
- Blockers: —
