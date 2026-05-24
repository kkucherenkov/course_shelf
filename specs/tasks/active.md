# Active tasks

## T-2026-05-24-006 — Course detail: critique fixes (CTA link-mode, completed CTA, side-stripe, error, minors)

- Created: 2026-05-24
- Owner: claude
- Spec: `.impeccable/critique/2026-05-24T14-15-15Z__apps-web-app-pages-courses-id-vue.md` (31/40)
- Goal: the course-detail primary action is a real link with no nested button, works in every state, and the page matches the system's component + token conventions.
- Acceptance:
  - primary CTA navigates as a single anchor (no `<button>` inside `<a>`)
  - a fully completed course offers a working "Rewatch" CTA, not a dead "Start → #"
  - the current lesson row no longer paints a side-stripe accent
  - the load-error retry uses `AppButton`, not a bespoke button
- Spec diff: none
- Codegen impact: no
- Design impact: `@app/ui` — `AppButton` gains an optional `to` (renders as `NuxtLink`); `COVER` re-exported at the package root
- Tests: unit — AppButton link mode; AppLessonRow current row has no `::before` stripe
- Deferred (with reasons): breadcrumb needs the library _name_ (DTO carries only `librarySlug` → spec-first + backend); lessons-as-links is an `AppLessonRow` contract change (keyboard model + all consumers) — own task.
- Sub-steps:
  - [x] `AppButton`: optional `to` → render as `NuxtLink`; spec + story
  - [x] `CourseActions`: primary CTA via `AppButton :to` (drop wrapping link)
  - [x] `courses/[id].vue`: completed → "Rewatch" + first-lesson href; i18n `ctaRewatch`
  - [x] `AppLessonRow`: remove current-row `::before` side-stripe (also tokenised pre-existing `width: 24px`)
  - [x] `courses/[id].vue`: load-error retry via `AppButton`
  - [x] minors: re-export `COVER`, dedup `ACCENT_BG`; drop dead cover bg line; hero duration meta; fix `resumeLesson` comment
  - [x] lint/format/tests (eslint clean; @app/ui 845 green; stylelint clean on all touched .vue; i18n parity en/ru)
- Status: in-progress (awaiting commit/PR)
- Blockers: —
