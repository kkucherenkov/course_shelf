# Active tasks

## T-2026-04-27-042 — Auth setup wizard + sign-in flow (E11-F01-S03)

- Created: 2026-04-27
- Owner: claude
- Spec: `docs/roadmap/tasks/E11-F01-S03.md`. The Pinia auth store + bearer wiring landed in T-034. `pages/login.vue` exists; `pages/setup.vue` does not. The backend has no first-run detection endpoint and no automatic admin-role promotion for the first user.
- Goal: a working first-run wizard that creates the platform's admin user, plus a renamed `/sign-in` page that honours the card's URL contract. Middleware gates routes correctly: `/setup` only when no users; `/sign-in` only when no session.
- Acceptance:
  - Backend: new `GET /api/v1/admin/has-users` endpoint returning `{ hasUsers: boolean }`. **Anonymous** (no bearer required) since it gates the very first request from a fresh browser. Lives under `/admin/*` for path consistency but uses `@AllowAnonymous()`. Documented inline.
  - Backend: Better Auth `databaseHooks.user.create.before` hook detects "first user" (`prisma.user.count() === 0`) and assigns `role: 'ADMIN'`. Subsequent users get the default `'USER'` role. The hook is idempotent and side-effect-free apart from the role mutation.
  - Spec change: `GET /api/v1/admin/has-users` returns `{ hasUsers: boolean }`. `bearerAuth` is **not** required (no `security:` block on the operation). Tagged `admin`.
  - Codegen: TS + Dart clients regenerate; new `getAdminHasUsers` operation + response type.
  - Frontend: `pages/login.vue` renamed to `pages/sign-in.vue`. Middleware skip-list updated `/login` → `/sign-in`; the `api.client.ts` 401-redirect target updated. The card's `cs-web-auth` real design is Stage B (E14-F02-S01) — this slice is the minimal-but-functional auth shell.
  - Frontend: new `pages/setup.vue` — first-run form with email + password + display-name inputs (using `AppTextField` + `AppButton`). On submit: calls `authStore.signUp(...)` (new method on the store wrapping `auth.signUp.email({...})`); on success the backend hook ensures the user is admin; client redirects to `/`.
  - Frontend: `auth.global.ts` middleware extended:
    1. On every navigation, fetch `hasUsers` (cached for the session) before routing decisions on `/setup` and `/sign-in`.
    2. If `hasUsers === false` and target is anything other than `/setup` → redirect to `/setup`.
    3. If `hasUsers === true` and target is `/setup` → redirect to `/sign-in` (setup is locked once an admin exists).
    4. Otherwise: existing behaviour (redirect unauthenticated → `/sign-in`).
  - `useAuthStore` gains `signUp(email, password, displayName?): Promise<{ ok, error? }>` that wraps `betterAuth.signUp.email(...)` and captures the bearer token from the same `set-auth-token` response-header hook used for sign-in.
  - Tests: backend handler (anonymous reachable; counts via prisma.user); store `signUp` (happy + error); middleware decision matrix (4 states).
- Spec diff: yes — `GET /api/v1/admin/has-users`. Codegen impact: yes. Design impact: no (real design defers to E14-F02-S01).
- Sub-steps:
  - [ ] T-042-A: spec — `GET /admin/has-users` (anonymous)
  - [ ] T-042-B: codegen
  - [ ] T-042-C: backend — `GetHasUsersHandler` + Better Auth `databaseHooks.user.create.before` admin-promotion + `@AllowAnonymous()` route
  - [ ] T-042-D: frontend — `signUp` store method + `pages/setup.vue` + rename `login.vue` → `sign-in.vue` + update middleware + 401 redirect target
  - [ ] T-042-E: lint, typecheck, test, prettier across backend + web; flip card; archive T-042
- Status: in-progress
- Blockers: —
