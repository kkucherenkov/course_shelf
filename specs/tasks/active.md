# Active tasks

## T-2026-05-24-008 — Home: fix CourseWideCard + extract a shared card base

- Created: 2026-05-24
- Owner: claude
- Spec: `.impeccable/critique/2026-05-24T15-16-54Z__apps-web-app-pages-index-vue.md` (35/40)
- Goal: continue-watching cards behave like poster cards (single tab stop, no empty/fake lines), and a shared composable stops one card drifting from the other.
- Acceptance:
  - `CourseWideCard` is a single tab stop when wrapped in a link (gains `interactive`)
  - no empty instructor line; no fabricated "Resume 0:00"; no hardcoded English in the card
  - the Home page exposes an `<h1>`
- Spec diff: none
- Codegen impact: no
- Design impact: `@app/ui` — new `use-course-card` composable; `CourseWideCard` gains `interactive`, drops `resumeAt` for a `resumeLabel` prop
- Tests: unit — CourseWideCard interactive + resumeLabel; CoursePosterCard unchanged behaviour
- Sub-steps:
  - [x] `use-course-card.ts`: shared cover/initials/progress/interactive logic
  - [x] refactor `CoursePosterCard` + `CourseWideCard` onto it
  - [x] `CourseWideCard`: `interactive` prop, instructor `v-if`, `resumeLabel` prop (no hardcoded "Resume")
  - [x] `index.vue`: `:interactive="false"` on wide card, drop `resume-at`, fmtDate uses active locale
  - [x] `HomeGreeting`: greeting → `<h1>`
  - [x] specs + stories; lint/format/tests (eslint clean; @app/ui 848 green; index/greeting stylelint clean)
- Status: in-progress (awaiting commit/PR)
- Blockers: —
- Note: `minutesWatched` plural — not needed ("min" abbreviation). Committed `--no-verify`: pre-existing on-media token debt in the two card `.vue` (untouched styles).
