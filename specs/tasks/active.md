# Active tasks

## T-2026-09-16-a11y-document — document-level a11y: lang/title, landmarks, role=row, focus/labels, degraded-auth state, accelerators

- Created: 2026-09-16
- Owner: claude
- Goal: heuristics 7 (flexibility) + 10 (help/docs) + document-class a11y
  defects — raise Nielsen audit score, not just close tickets.
- Sub-steps:
  - [x] #589 — `html[lang]` bound to active locale (app.vue + static baseline
        in nuxt.config.ts), per-route `<title>` via existing page-title keys
        (route→key map lives in app.vue; zero new i18n keys, zero other-lane
        page files touched)
  - [x] #590 — `<main>` landmark for the 6 `layout:false` pages (shared
        `AuthLayout.vue` + `setup.vue`/`__tokens.vue`/`reset.vue` own markup);
        confirmed the 1174 `region` violations were the same root cause as
        `landmark-one-main`, not a separate fix
  - [x] #591 — drop orphaned `role="row"` from `AdminUserRow.vue` (neither
        `/admin/users` nor `/admin/permissions` wraps it in a table/grid)
  - [x] #597 — search input `type=search` + reused-placeholder aria-label +
        `:focus-within` ring; `AppAvatar` gained a `role-label` prop wired
        from every caller (killed the hardcoded English, reuses each
        caller's already-translated roleLabel); theme-toggle aria-label
        states current state via string composition of existing keys;
        bottom-tab active state gets `font-weight` beyond the color change.
        AppTabs/PlayerSidebar mislabeling — confirmed caller-side, handed to
        `audit-regressions` (owns `PlayerSidebar.vue`) per maintainer; not in
        this lane's PR.
  - [x] #602 — `layouts/default.vue` renders the shell on bearer-token
        presence, not hydrated-profile presence (maintainer's preferred
        fix; no new copy, `shellUser` already degrades gracefully to blank)
  - [x] #607 — mounted `AppCommandPalette` + Cmd/Ctrl+K in the layout,
        commands built from the existing nav/action labels; language toggle
        next to the theme toggle (self-referential locale names via
        `useI18n().locales`, `setLocale()` on click — no translation needed)
  - [x] admin nav: `/admin/libraries` sidebar entry renamed to "Manage
        libraries" (`ru`: "Управление библиотеками"), distinct from the
        member-facing `/libraries` "Libraries"
  - [x] i18n: 4 new keys added directly to `apps/web/i18n/locales/{en,ru}.ts`
        (maintainer OK'd — new keys are additive, union-mergeable, distinct
        from `i18n-plurals`'s job of editing existing plural strings):
        `ui.commandPalette.{title,placeholder,empty}`,
        `pages.admin.navLibrariesManage`
  - [x] tests: `apps/web/app/__tests__/app.spec.ts` (new), layout/UI specs
        extended for every prop/behaviour above; `AdminUserRow` snapshot
        regenerated (role=row removal); web 476/476, ui 925/925 green
  - [x] gates: lint, stylelint, format, `check:i18n`,
        `turbo run lint test typecheck --filter=@app/web --filter=@app/ui`
        all green
  - [ ] Storybook visual baselines: `Default`/`Narrow`/`NarrowAdminOverflow`
        AppNavigationShell PNGs now stale (locale toggle + bold active tab)
        — dispatch `regen-snapshots.yml` (`suite: storybook`) on this branch
        before merge
- Status: in-progress
- Blockers: —

## T-2026-09-16-edit-guard — fix three "UI lies about state" defects

- Created: 2026-09-16
- Owner: claude
- Goal: three issues where the interface asserts something false about
  current state — unguarded metadata-edit exit, two disagreeing "resume"
  algorithms, and a catalog empty-state that blames the wrong actor.
- Sub-steps:
  - [x] #570 — guard unsaved `CourseMetadataForm` edits: `onBeforeRouteLeave` + `beforeunload`, collapse header "Back" / footer "Cancel" to one
        control
  - [x] #573 — course page's `resumeLesson` now reads the same
        `lastSeenLessonId` the home page's continue-watching row uses
        (`useContinueWatching`), falling back to the position heuristic only
        when the course isn't in that list yet
  - [x] #579 — `browse.vue` empty state distinguishes no-grants (AppNoPermission)
        from empty-library (existing copy, admin only) from
        granted-but-empty (new copy, no dead-end CTA); `sign-up.vue` skips
        the library-registration step entirely for a non-first-admin account
        (the backend 403s that call anyway); `index.vue`'s recently-added row
        gets a role-aware empty body to match
  - [x] gates: lint, stylelint, format, `turbo run lint test typecheck`
- Status: in-progress
- Blockers: —
