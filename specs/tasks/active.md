# Active tasks

## T-2026-08-29-012 — Audit items 13 & 14 · wire what was built and never connected

- Created: 2026-08-29
- Owner: claude
- Branch: `feat/wire-sso-and-catalog-cache`
- Cards: none (audit remediation — `docs/audit/2026-08-29-plan-vs-code.md` §9)
- Goal: two components that were built, tested, exported and then never called.
- Spec diff: none
- Codegen impact: no
- Design impact: no

### Both are "wire or delete", and both resolve to wire

**13 — `AppSsoBlock` (web).** Deleting is wrong: the Flutter twin _is_ used
(`sign_in_screen`, `sign_up_screen`), `InstanceConfigDto.ssoProviders` is in
`openapi.yaml`, and the design bundle carries the component on both platforms
(E13-F02-S10 / E17-F02-S09). Only the web half was never connected. Wiring it
makes web match mobile.

The audit's §9 misplaced the hard-code: `useInstanceConfig.ts:17` is the
_fallback_ used when `GET /admin/instance` is unreachable, not a hard-coded
value. The real one is `apps/backend/src/common/config/app-config.ts:334`,
which returns `ssoProviders: []` unconditionally and says so — v1 ships no
providers, v2 populates them once Better Auth's `genericOAuth` plugin lands.

So this renders nothing today, exactly as mobile renders nothing today. That is
the point: when the backend starts advertising a provider, both clients light
up with no further work, instead of one of them staying dark.

**14 — `CachedCatalogDao` (mobile).** Deleting it would throw away the
offline-_read_ half immediately after E20 shipped the offline-_write_ half. A
downloaded lesson plays offline today, but the course-detail screen that lists
it cannot render without a network round trip. The DAO was built for exactly
this — `replaceOutline` mirrors `GET /courses/{id}/outline` — and has never had
a caller.

- Sub-steps:
  - [ ] `useSsoProviders` composable, mirroring mobile's `ssoProvidersFor`
  - [ ] render `AppSsoBlock` on sign-in and sign-up
  - [ ] web locale keys for the provider labels, en + ru
  - [ ] `CourseDetailRepositoryImpl`: write through to the cache on fetch
  - [ ] read from the cache when the network fails
  - [ ] tests for both paths
- Status: in-progress
