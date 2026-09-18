## T-2026-09-16-nav-shell-mobile-admin-access — mobile nav overflow + AppNavigationShell fixes

- Created: 2026-09-16
- Owner: claude
- Spec: —
- Goal: `/admin` (and any nav beyond the bottom-tab's first slots) reachable
  below 600px; fix hardcoded English strings, raw role enum, wrong active-route
  highlight on `/settings`, and the topbar theme toggle silently destroying the
  "System" preference — all inside `AppNavigationShell` / `layouts/default.vue`.
- Sub-steps:
  - [x] AppNavigationShell: overflow "More" bottom-tab + AppDialog nav drawer (admin nav reachable on mobile) — closes #568
  - [x] AppNavigationShell: translate avatar-menu items (Profile/Settings/theme/Sign out) via props
  - [x] AppNavigationShell: `user.roleLabel` prop instead of raw `user.role` enum text
  - [x] AppNavigationShell: 3-way theme cycle (light → dark → system) so topbar toggle no longer destroys "System"
  - [x] layouts/default.vue: `activeRoute` branch for `/settings`
  - [x] i18n keys (en+ru) for all of the above
  - [x] Storybook stories + spec coverage for the new behaviour
  - [x] lint/stylelint/format + typecheck/test gates
- Status: done
- Completed: 2026-09-16
- Result: [PR #583](https://github.com/kkucherenkov/course_shelf/pull/583)
