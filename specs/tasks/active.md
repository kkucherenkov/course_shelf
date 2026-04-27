# Active tasks

## T-2026-04-27-034 — Wire api-client-ts + auth store (E11-F01-S02)

- Created: 2026-04-27
- Owner: claude
- Spec: `docs/roadmap/tasks/E11-F01-S02.md`. The Nuxt SPA currently makes HTTP calls via an ad-hoc `useApi` composable using raw `$fetch` (zero generated-client coverage) and wraps Better Auth in a `useAuth` composable using cookie-based auth. The card requires: every HTTP call goes through the generated `@app/api-client-ts`, bearer-token-based auth, a Pinia auth store, and a global middleware redirect for unauthenticated users.
- Goal: bearer-auth-end-to-end on the web. Generated client is the only HTTP path. Auth state lives in Pinia.
- Acceptance:
  - Pinia installed and wired (`@pinia/nuxt` module).
  - New `app/stores/auth.ts` Pinia store wraps `better-auth/vue` (with the `bearerClient()` plugin so the bearer token is captured from the `Set-Auth-Token` response header on sign-in and persisted in `localStorage` / `flutter_secure_storage`-equivalent web storage). Exposes `signIn(email, password)`, `signOut()`, `session` (Vue `Ref<SessionState>`), `token` (Vue `Ref<string | null>`).
  - New `app/plugins/api.client.ts` (Nuxt SPA plugin) wires the singleton `client` from `@app/api-client-ts`:
    1. `client.setConfig({ baseUrl: runtimeConfig.public.apiBaseUrl })`.
    2. `client.interceptors.request.use((req) => req.headers.set('Authorization', \`Bearer \${authStore.token.value}\`))` — only when a token exists.
    3. `client.interceptors.response.use(async (res, req) => { ... })` — on 401: attempt one Better Auth `getSession()` (refresh equivalent for the bearer plugin); if still 401, `authStore.clear()` + `navigateTo('/login')`.
  - New `app/middleware/auth.global.ts` — global Nuxt middleware that redirects unauthenticated users to `/login` (deviation: card says `/sign-in`, codebase route is `/login`; documented). Skips the redirect for the login page itself, the `__tokens` page, and `/healthz` if it ever appears in the SPA route tree.
  - `app/pages/login.vue` and `app/layouts/default.vue` migrated to use the Pinia store (`useAuthStore()`) instead of the `useAuth` composable.
  - `app/composables/useApi.ts`, `app/composables/useAuth.ts`, and `app/composables/useApiShape.ts` **deleted** — the card's last bullet says "No `useApi`, `useAuth`, or `useAuthToken` composables".
  - Existing 6 vitest cases (the `__tokens` page tests) still pass plus 4–6 new cases for the auth store (signIn happy/error paths, signOut clears token, the bearer interceptor adds the header).
- Spec diff: none.
- Codegen impact: no.
- Design impact: none.
- Tests:
  - `stores/auth.spec.ts` — mocked Better Auth client; signIn populates `session` + `token`, signOut clears both, error path keeps state untouched.
  - `plugins/api.client.spec.ts` — interceptor adds `Authorization` header when token present, omits when null.
- Sub-steps:
  - [ ] T-034-A: install `@pinia/nuxt` + `pinia`; add to nuxt modules
  - [ ] T-034-B: `stores/auth.ts` (Pinia store + Better Auth bearer client) + tests
  - [ ] T-034-C: `plugins/api.client.ts` (client config + bearer interceptor + 401 retry) + tests
  - [ ] T-034-D: `middleware/auth.global.ts` redirect + skip-list
  - [ ] T-034-E: migrate `login.vue` + `layouts/default.vue` to the store
  - [ ] T-034-F: delete `composables/useApi.ts`, `composables/useAuth.ts`, `composables/useApiShape.ts`
  - [ ] T-034-G: lint, typecheck, test, prettier; smoke if web container is up; flip card; archive T-034
- Status: in-progress
- Blockers: —
