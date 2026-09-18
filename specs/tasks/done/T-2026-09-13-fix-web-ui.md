## T-2026-09-13-fix-web-ui — four live-use web defects (tuxedo 111-114)

- Created: 2026-09-13
- Completed: 2026-09-13
- Result: https://github.com/kkucherenkov/course_shelf/pull/464
- Owner: claude
- Spec: none — tuxedo items, no roadmap card
- Goal: fix four small, unrelated apps/web defects found in 20 minutes of
  live NAS use — none was visible to existing tests.
- Sub-steps:
  - [x] tuxedo 111 — sign-up.vue:253 disabled-state v-if missing `hasUsers`,
        blocking first-run bootstrap when AUTH_SELF_REGISTRATION=false
  - [x] tuxedo 114 — lesson player 32px viewport overflow (double-counted
        shell topbar + `__main-body` padding); fixed page-side
        (`height: 100%`, no shell change — only page doing the
        `100vh - topbar` trick); added e2e regression since component specs
        can't see this class of bug
  - [x] tuxedo 113 — Profile menu item dead stub → point at
        `/settings#section-profile`, drop `profileComingSoon` locale keys
  - [x] tuxedo 112 — density picker: verified NOT dead (01.density.client.ts + `[data-density=compact]` in AppInput/AppSelect predate this
        report); corrected the tuxedo item, opened tuxedo 120 for the real
        residual gap (cozy ≡ comfortable); no code change
- Status: done
