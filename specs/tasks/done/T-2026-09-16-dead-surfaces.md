## T-2026-09-16-dead-surfaces — remove unreachable /setup, duplicate /libraries page, orphaned adminPageTitle provide

- Created: 2026-09-16
- Owner: claude
- Spec: — (issue #665)
- Goal: delete the routes and plumbing nobody can reach — `/setup` (every
  branch of `auth.global.ts` redirects around it), the standalone
  `/libraries` page (`/admin/libraries` is the live surface, `/libraries` has
  no nav link since #618), and the 9 `provide('adminPageTitle', …)` calls
  whose consumer (`layouts/admin.vue`) is already gone. Fix the one stale
  comment in `layouts/default.vue:258` while in the file.
- Acceptance:
  - `/setup` and `/libraries` 404 or redirect on a live visit, no white screen
  - `/admin/libraries`, library registration, and rescan still work on the
    live stand
  - no dangling `provide('adminPageTitle', …)`; the one real breadcrumb
    (`admin/libraries/[id].vue`) is untouched
  - `docs/user-guide.md`, `README.md`/`README.ru.md`, `docs/architecture.md`
    no longer describe `/setup` as a reachable route
- Spec diff: none
- Codegen impact: no
- Design impact: none
- Tests: unit specs updated for deleted pages (`AdminLibraryRow` snapshot
  refreshed for the new `data-testid`); `tests/e2e/libraries.spec.ts` ported
  to `tests/e2e/admin-libraries.spec.ts` — same register+rescan flow, same
  accessible-name locators, now against a route that actually renders
- Sub-steps:
  - [x] Delete `pages/setup.vue` + its `pages.setup.*` locale namespace
        (en+ru) — kept `title`/`subtitle`, live via `sign-up.vue`'s
        `isFirstAdmin` branch, not dead; its `PUBLIC_ROUTES`/`/setup`-lock
        entries in `auth.global.ts`, its `TITLE_ROUTES` entry in `app.vue`
  - [x] Update `README.md`, `README.ru.md`, `docs/user-guide.md`,
        `docs/architecture.md` — they described `/setup` as the live
        first-run route, which was already false pre-this-change (first-run
        goes through `/sign-up`'s wizard per #E14-F02-S01)
  - [x] Delete `pages/libraries.vue` + spec, `components/libraries/LibraryRow.vue` + spec (used nowhere else), the dead `libraries` branch in
        `layouts/default.vue`'s `activeRoute` resolver, the `TITLE_ROUTES`
        entry in `app.vue`, and the page-only slice of `pages.libraries.*` —
        kept only `status{Running,Succeeded,Failed,Cancelled}` (re-measured:
        `rescanButton`/`scanningButton`/`noScansYet`/`scanInFlight`/
        `scanSummary` were `LibraryRow`-only too, not shared as first assumed)
  - [x] Ported `tests/e2e/libraries.spec.ts` → `admin-libraries.spec.ts`:
        same accessible names resolve on `/admin/libraries` unchanged: two
        added `data-testid`s (`page-admin-libraries`, `library-row` on
        `AdminLibraryRow`) for the two locators the old test had that were
        testid-based, one locator fix the old test didn't need (`Scan`
        button scoped to the row — the row itself is `role="button"` too and
        its computed accessible name absorbs all descendant text, so an
        unscoped `getByRole('button', {name:'Scan'})` strict-mode-violates)
  - [x] Strip all 9 `provide('adminPageTitle', pageTitle)` calls + their now
        pointless `pageTitle` computed + the `provide` import; left
        `admin/libraries/[id].vue`'s hand-rolled breadcrumb as-is
  - [x] Fix stale comment `layouts/default.vue:258`
  - [x] `pnpm --filter @app/web lint --fix && pnpm stylelint:fix && pnpm format`
  - [x] `pnpm --filter @app/web typecheck` (0 errors), `pnpm --filter @app/web test`
        (566/566), `pnpm check:i18n` (758/758 en=ru); the monorepo-wide
        `turbo` gate flaked under parallel load in this fresh worktree
        (unrelated packages + a timeout in an unrelated web spec) — every
        task re-run standalone, all green
  - [x] Live check, real `nuxt dev` + real Chromium (not the shared
        `csh-audit` stand — this change has zero dependency on real data
        shape, unlike prior waves' content-length/course-count checks, so a
        local instance is the proportionate check): `/setup` and
        `/libraries` unauthenticated → `/sign-in`; authenticated → real Nuxt
        404 ("Page not found" / "Go back home"), not a blank screen. Ported
        Playwright spec run headed against the same server: empty state →
        sheet → register → row appears → Scan → POST fires → status pill
        flips to "Running" — all green
- Status: done
- Blockers: —
- Completed: 2026-09-16
- Result: [PR #674](https://github.com/kkucherenkov/course_shelf/pull/674)
