# Active tasks

## T-2026-05-24-012 — Critique fixes: Lesson player (i18n + nav)

- Created: 2026-05-24
- Owner: claude
- Spec: `.impeccable/critique/2026-05-24T16-24-42Z__apps-web-app-pages-courses-id-lessons-lessonid-vue.md` (26)
- Goal: the player's visible copy is localized and its prev/next controls respect course bounds.
- Acceptance:
  - `AppPlayerChrome` visible strings (retry / locked / up-next / stay / play-next) come from props; the page passes localized values
  - `lessonSubtitle` + the bookmark "add" button are localized
  - prev/next are disabled at the first/last lesson
- Spec diff: none
- Codegen impact: no
- Design impact: `@app/ui` — `AppPlayerChrome` gains visible-label props + `hasPrev`/`hasNext` (defaults preserve behaviour)
- Tests: `@app/ui` 851 (new AppPlayerChrome prop tests); i18n parity (en/ru)
- Deferred to own follow-up PRs:
  - `AppPlayerChrome` aria-label i18n sweep (~14 SR-only strings) — a focused a11y-i18n pass
  - chrome auto-fade after 3s idle (animate); bottom context-bar with title/instructor/"progress synced" (adapt) — need visual iteration
- Sub-steps:
  - [x] `AppPlayerChrome`: visible-label props (retry/locked/upNext/stay/playNext) + `hasPrev`/`hasNext`; spec + story
  - [x] page passes localized labels (reusing existing `lessonPlayer.*` keys) + `hasPrev`/`hasNext`
  - [x] localize `lessonSubtitle` (`sectionLabel`) + `PlayerBookmarksTab` add button (`bookmarkAdd`, drilled via PlayerSidebar)
  - [x] i18n (en/ru); lint/format/tests
- Status: in-progress (awaiting commit/PR)
- Blockers: —
