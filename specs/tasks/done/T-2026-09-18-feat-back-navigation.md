## T-2026-09-18-feat-back-navigation — back affordance: lesson → course → browse

- Created: 2026-09-18
- Owner: claude
- Goal: tuxedo 217 — no way back from a lesson to its course, or from a course
  to browse. Add a compact back link on both pages.
- Sub-steps:
  - [x] audit `@app/ui` exports — no breadcrumb component exists; reuse
        `AppButton` (ghost, sm, `icon-leading="arrow-left"`) as on the course
        page's existing edit-metadata CTA
  - [x] `courses/[id].vue`: back-to-browse link (`/browse`), unconstrained
        height — plain flex child
  - [x] `courses/[id]/lessons/[lessonId].vue`: back-to-course link, labelled
        with the course title; player page is dvh-bounded so the link row
        converts from a hardcoded `height: 100%` to `flex: 1; min-height: 0`
        on `&__layout`/`&__skeleton` to make room without breaking the
        transcript/sidebar height chain (tuxedo 114/253 history)
  - [x] locale keys (en/ru) for both back labels
  - [x] lint/stylelint/format/i18n check, relevant vitest suites — 587/587
        (`@app/web`) + 982/982 (`@app/ui`) green
- Status: done
- Blockers: —
- Completed: 2026-09-18
- Result: https://github.com/kkucherenkov/course_shelf/pull/717
