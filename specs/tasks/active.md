# Active tasks

_No active tasks._
## T-2026-09-13-e32-course-rescan — rescan a single course

- Created: 2026-09-13
- Owner: claude
- Spec: [docs/roadmap/tasks/E32-F01-S02.md](../../docs/roadmap/tasks/E32-F01-S02.md)
- Goal: `POST /api/v1/courses/{id}/rescan` — re-import one course without a full library walk; orphan cleanup scoped so it never touches other courses.
- Spec diff: openapi.yaml — new route
- Codegen impact: yes
- Sub-steps:
  - [ ] OpenAPI + codegen (own commit)
  - [ ] Scope on `RunScanCommand` + handler
  - [ ] Scope-aware orphan cleanup
  - [ ] Rescan button on the course page
  - [ ] Tests, including "other courses untouched"
- Status: in-progress
- Blockers: — (card 1 landed as [PR #463](https://github.com/kkucherenkov/course_shelf/pull/463), branching off it now)

## T-2026-09-13-fix-web-ui — four live-use web defects (tuxedo 111-114)

- Created: 2026-09-13
- Owner: claude
- Spec: none — tuxedo items, no roadmap card
- Goal: fix four small, unrelated apps/web defects found in 20 minutes of
  live NAS use — none was visible to existing tests.
- Sub-steps:
  - [x] tuxedo 111 — sign-up.vue:253 disabled-state v-if missing `hasUsers`,
        blocking first-run bootstrap when AUTH_SELF_REGISTRATION=false
  - [x] tuxedo 114 — lesson player 32px viewport overflow (double-counted
        shell topbar + `__main-body` padding)
  - [x] tuxedo 113 — Profile menu item dead stub → point at
        `/settings#section-profile`, drop `profileComingSoon` locale keys
  - [x] tuxedo 112 — density picker: verified NOT dead (01.density.client.ts + `[data-density=compact]` in AppInput/AppSelect predate this
        report); corrected the tuxedo item, opened tuxedo 120 for the real
        residual gap (cozy ≡ comfortable); no code change
- Status: in-progress
- Blockers: —
  _No active tasks._
