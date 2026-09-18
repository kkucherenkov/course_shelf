## T-2026-09-16-layout-headings — main landmark overflow, admin/lesson headings, landmark labels

- Created: 2026-09-16
- Owner: claude
- Goal: audit round 3 (25/40) fixes — #616 regression (main landmark 4px
  wider than viewport at 375px, from #590's landmark work) + #623 heading
  structure (missing h1 on 8/9 admin pages, no heading at all on
  `permissions/[userId].vue` and the lesson player) + #623 landmark-label
  plumbing (`AppNavigationShell` must accept `sidebar-label`/
  `right-rail-label` and not silently fall back to an English literal).
- Sub-steps:
  - [x] #616 — root cause: `.app-navigation-shell__right` is a grid item
        with no `overflow`/`min-width` override, so its automatic minimum
        width (the topbar's un-shrunk content) blew the single-column
        mobile grid track past the viewport by however much that content
        overflowed — 375px audited on the live stand measured +10px on
        `/` (report's own +4px was presumably a different page/persona,
        same mechanism). Fixed with one `min-width: 0` on `&__right`,
        letting the track clamp to the real available width and `&__search`
        actually shrink into it. Verified red before fix, green after, on a
        local dev server (not the audit stand — that runs a baked image);
        regression test added: `tests/e2e/home.spec.ts` "375x800 › document
        never scrolls horizontally". Checked 320px per the ticket's ask —
        clean at the grid-track level (`&__right`/`&__topbar` both now
        report a genuine 320px box), but the topbar's own children still
        don't fit in 320px (a pre-existing, un-audited content-floor issue,
        not this regression) — flagged to maintainer, not fixed here.
  - [x] #623 (headings) — h1 on all 9 admin pages (`users`,
        `permissions/index`, `permissions/[userId]` — had zero headings,
        now an h1 on the loaded-user name — `libraries/index`,
        `libraries/[id]`, `identify-tasks/index`, `backups`, `admin/index`;
        `identify-tasks/[id]` already had an h1) — sibling `h3`s directly
        under a promoted `h1` bumped to `h2` so no level gets skipped
        (`libraries/[id]` ×2, `admin/index`, `backups`). Lesson player
        (`courses/[id]/lessons/[lessonId].vue`) had no heading and no
        data-driven `<title>` (app.vue explicitly deferred both as a
        follow-up) — added a visually-hidden `h1` + page-local `useHead()`,
        both driven by `lessonData.title`, falling back to a generic
        translated "Lesson"/"Урок" only before the lesson loads. New i18n
        key `pages.lessonPlayer.title` (en/ru). Regression test:
        `tests/e2e/lesson-player.spec.ts` "document heading" (tab title +
        hidden h1), verified red (showed the bare app name) before the fix.
  - [x] #623 (landmark labels) — `sidebarLabel`/`rightRailLabel` changed
        from optional-with-English-default to required, no default: a
        missing/forgotten label is now a type error and a Vue prop-
        validation warning instead of a silent English fallback (exactly
        the gap that let this live through two prior audits). Updated the
        colocated spec/story to pass real values. `layouts/default.vue`
        unblocked mid-task (nav-and-keys merged and closed) — wired
        `:sidebar-label`/`:right-rail-label` from two new `ui.nav.*` keys
        (en/ru) myself.
  - [x] Storybook visual regression checked by hand against the 7 committed
        `AppNavigationShell` baselines (own chromium binary, same
        `#storybook-root` capture method as the test-runner, pixelmatch
        diff) — 0.25–0.62% drift on every story including ones the CSS
        change cannot reach (`light-mode`, `menu-open`), all pure font
        anti-aliasing noise from a non-Docker Chromium (the config's own
        documented caveat), no structural shift. Confirmed both `Narrow`
        stories still render at desktop width regardless of the
        `mobile1` viewport parameter (a pre-existing test-runner gap, not
        touched) — the single-column branch the fix targets never actually
        gets exercised by these snapshots. Baselines left untouched.
  - [x] gates: lint, stylelint, format, `check:i18n`,
        `turbo run lint test typecheck --filter=@app/web --filter=@app/ui`
        — all green (`@app/web` 524/524, `@app/ui` typecheck clean)
- Status: ready for PR
- Blockers: — (320px topbar content-floor and the pre-existing
  desktop-width Storybook viewport gap flagged above, not fixed — out of
  this ticket's stated criterion)
- PR: https://github.com/kkucherenkov/course_shelf/pull/629 (merged)
