## T-2026-09-16-library-authz — close the library-registration authz hole

- Created: 2026-09-16
- Owner: claude
- Goal: `POST /libraries` had no role check — any authenticated user could
  walk the server's filesystem and grant themselves READ on whatever it
  found. Close that, and the three UI defects downstream of it.
- Sub-steps:
  - [x] #592 — `@UseGuards(AdminGuard)` on `registerLibrary`; root
        allowlist (`AppConfig.catalog.rootAllowlist` /
        `LIBRARY_ROOT_ALLOWLIST`, defaulted to `/data/courses` in
        `compose.prod.yml`/`compose.release.yml`) so an admin fat-fingering
        `/` 422s instead of walking the whole disk; spec updated
        (403/422 documented, codegen landed); red-before-fix confirmed on
        both the guard and the allowlist check
  - [x] #595 — `/libraries` gated `middleware: 'admin'` (kills all three
        named defects for a non-admin at once: wrong empty state, latest-scan
        403 misread as "never scanned", silent rescan 403);
        `useLatestScan.triggerScan` now sets `error.value` on failure and
        `LibraryRow` surfaces it via the same toast `/admin/libraries`
        already uses, instead of an empty `catch` whose comment claimed the
        ref was rendered somewhere
  - [x] #605 — `sign-up.vue`'s stale "POST /libraries 403s a non-admin"
        comment rewritten to state the pre-#592 vs post-#592 fact
        correctly; library step stays hidden from non-first-admin accounts
        (right call, now for the right reason — no revert needed)
  - [x] #598 — removed the sign-up wizard's "cover-art strategy" select;
        `RegisterLibraryRequest` never carried the field
        (`additionalProperties: false`), so every choice was silently
        discarded
  - [x] gates: lint, stylelint, format, `turbo run lint test typecheck`
        (backend 2159/2160, web 472/472); `spec:contract-test` not run — the
        harness's `host.docker.internal:3000` hit an unrelated local
        service (`df-nginx`) squatting on host port 3000, not this repo's
        backend
- Status: done
- Completed: 2026-09-16
- Result: [PR #614](https://github.com/kkucherenkov/course_shelf/pull/614)
- Coordination flagged to maintainer, not touched (outside this lane's owned
  files):
  - `layouts/default.vue` (a11y-document): admin sidebar now shows two
    "Libraries"-labelled entries pointing at admin-gated pages
    (`/libraries` and `/admin/libraries`) — needs a rename and the
    always-visible `nav` array's `/libraries` entry needs to stop showing
    for non-admins now that the route redirects them. Tracked as tuxedo
    #188.
  - `settings.vue:12` (audit-regressions): "density (3-up picker)" comment
    is stale now that only two options remain. Tracked as tuxedo #189.
