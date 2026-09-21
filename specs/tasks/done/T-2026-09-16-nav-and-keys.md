## T-2026-09-16-nav-and-keys — dead-end nav link, raw locale key on admin dashboard

- Created: 2026-09-16
- Owner: claude
- Goal: #618 non-admins see "Libraries" in primary nav and get silently
  bounced by `middleware/admin.ts`; #617 `/admin` prints the literal key
  `pages.admin.dashboard.statLibrariesMeta` (deleted from both locales when
  a prior wave split it into two plural-safe keys, call site never updated).
  Structural: add a literal-`t()`-key-resolves-in-locale-tree check so this
  class of regression fails CI instead of shipping.
- Sub-steps:
  - [x] #618 — drop `libraries` from `layouts/default.vue`'s primary `nav`
        (decision: not gated-for-admin-only like `adminNav`, but removed
        outright — it duplicated `admin-libraries`; `/libraries` has been
        admin-only since #595 and that page's own comment already calls
        `/admin/libraries` "the equivalent surface"). Removed the now-false
        "member-facing /libraries link" comment and the two now-dead
        `navLibraries` locale keys (en+ru, both namespaces).
  - [x] #617 — `admin/index.vue`'s `statLibrariesMeta` now composes the two
        split keys (`statLibrariesMetaCourses`/`...Lessons`) with the
        existing `·` separator convention instead of calling the deleted
        combined key. Also fixed `formatRelative`'s hardcoded English
        `"Xs ago"` literals (an i18n-mandatory violation) to reuse
        `ui.noteEditor.ago*`, and deleted the dead `statusLabel` function +
        its false "referenced indirectly" comment + now-unused `ScanStatus`
        import.
  - [x] add `apps/web/app/pages/__tests__/admin-dashboard.spec.ts` (page had
        none)
  - [x] `scripts/check-i18n-parity.ts`: walks `apps/web/app` for literal
        `t('…')` calls and flags any that resolve in neither locale; proved
        it against the pre-fix `admin/index.vue` (caught the exact #617
        key), skips `t(someVar)` (one real case, `app.vue:60`, untouched)
  - [x] gates: lint, stylelint, format, `turbo run lint test typecheck` — all
        green (530 web tests, 929 ui tests, 18/18 turbo tasks)
  - [x] live-stand check: built this worktree's own docker/compose.yml stack
        on isolated ports (`csh-navkeys-verify-*`, torn down after) since the
        shared :8090 audit stand runs a frozen pre-fix image. Confirmed both
        fixes by eye: non-admin sidebar shows only Home/Browse (no
        Libraries trap), admin dashboard's Libraries card reads
        "0 courses · 0 lessons" (not the raw key), admin sidebar has exactly
        one library-management entry
- Status: done
- Blockers: —
- Completed: 2026-09-16
- Result: https://github.com/kkucherenkov/course_shelf/pull/625

Reported to maintainer, not fixed here (owned by other lanes / not mine):
`nuxt.config.ts:30` claims locale messages live in `.json` (they're `.ts`);
three more `formatRelative` English-literal copies at
`admin/libraries/[id].vue:143`, `AdminScansTable.vue:44`,
`AdminLibraryRow.vue:35` (scan-surface lane) — same `ui.noteEditor.ago*` fix
applied here to `admin/index.vue`'s copy.

- PR: https://github.com/kkucherenkov/course_shelf/pull/625 (merged)
