# Active tasks

## T-2026-05-24-005 — Browse: polish pass (count flash, stale comment, palette check)

- Created: 2026-05-24
- Owner: claude
- Spec: `.impeccable/critique/2026-05-24T13-08-07Z__apps-web-app-pages-browse-vue.md` (Minor Observations)
- Goal: remove the small rough edges flagged in the critique's minor list.
- Acceptance:
  - the count subtitle no longer flashes "0 courses" during load (shows a loading line instead)
  - the chip comment matches actual behaviour
- Spec diff: none
- Codegen impact: no
- Design impact: none (page-local + i18n)
- Tests: none (presentational); i18n parity (en/ru)
- Notes: poster palette verified muted/on-brand (`cover-map.ts`: desaturated teal/amber/indigo/warm/coral/slate) — no change. Bottom-sheet TODO comment left for the facets feature-track.
- Sub-steps:
  - [x] `browse.vue`: loading-aware `subtitle` computed; fix stale chip comment
  - [x] i18n `subtitleLoading` in en + ru
  - [x] lint/format
- Status: in-progress (awaiting commit/PR)
- Blockers: —

## T-2026-05-24-004 — Browse: filter chips meet the web hit-target minimum

- Created: 2026-05-24
- Owner: claude
- Spec: `.impeccable/critique/2026-05-24T13-08-07Z__apps-web-app-pages-browse-vue.md` (P2 — 22px chips < 32px web target)
- Goal: the status filter chips are comfortably tappable, meeting the web ≥32×32 hit-area minimum.
- Acceptance:
  - each status chip has a ≥32px interactive height
  - the compact AppChip default elsewhere is unchanged (no global regression)
- Spec diff: none
- Codegen impact: no
- Design impact: scoped CSS in `browse.vue` only (no `@app/ui` change)
- Tests: none (presentational; no behavioural change)
- Sub-steps:
  - [x] `browse.vue`: scoped `:deep(.app-chip)` min-height 32px + padding
  - [x] lint/format/stylelint
- Status: in-progress (awaiting commit/PR)
- Blockers: —

## T-2026-05-24-003 — Browse: actionable error + empty states

- Created: 2026-05-24
- Owner: claude
- Spec: `.impeccable/critique/2026-05-24T13-08-07Z__apps-web-app-pages-browse-vue.md` (P2 — states not actionable)
- Goal: error and filtered-empty states tell the user what to do and give a one-click way to do it.
- Acceptance:
  - error state shows actionable copy (not the raw thrown message) plus a working Retry button
  - filtered-empty state has its own title and a "Show all courses" button that clears the filter
- Spec diff: none
- Codegen impact: no
- Design impact: `@app/ui` — `AppBanner` gains an `actions` slot (browse already coded against it; it was never implemented → Retry rendered nothing)
- Tests: unit — AppBanner actions slot; i18n parity (en/ru)
- Sub-steps:
  - [x] `AppBanner`: add `actions` slot + style + spec/story
  - [x] `browse.vue`: actionable `errorBody`, Retry via `AppButton`, filtered-empty title + reset action
  - [x] i18n keys in en + ru (`emptyFilteredTitle`, `emptyShowAll`, `errorBody`)
  - [x] lint/format (eslint clean; @app/ui 842 green; i18n parity verified by grep — `check:i18n` script needs Node ≥22, env has 20)
- Status: in-progress (awaiting commit/PR)
- Blockers: —

## T-2026-05-24-002 — Browse: restore course instructor on poster cards

- Created: 2026-05-24
- Owner: claude
- Spec: `.impeccable/critique/2026-05-24T13-08-07Z__apps-web-app-pages-browse-vue.md` (P1 — toCourse drops data)
- Goal: course cards show the instructor that the API already returns, instead of a blank line.
- Acceptance:
  - a course with instructors shows their names under the title
  - a course with no instructor shows no empty instructor line
- Spec diff: none (`CourseDto.instructors` already exists)
- Codegen impact: no
- Design impact: `@app/ui` — `CoursePosterCard` hides the instructor line when empty
- Tests: unit — empty instructor renders no `__instructor` element
- Notes: course-level `locked` is NOT in `CourseDto` (lesson-level only, `types.gen.ts:1117`); inaccessible courses are filtered server-side, so no `state` mapping is possible/needed here. `posterUrl` exists — deferred (needs url-escaping / `<img>` handling).
- Sub-steps:
  - [x] `browse.vue` `toCourse`: map `instructor` from `item.instructors[].displayName`
  - [x] `CoursePosterCard`: `v-if` the instructor line when empty
  - [x] spec + story for the no-instructor variant
  - [x] lint/format (eslint clean; @app/ui suite 840 green)
- Status: in-progress (awaiting commit/PR)
- Blockers: —

## T-2026-05-24-001 — Browse a11y: announce active filter + un-nest card interactivity

- Created: 2026-05-24
- Owner: claude
- Spec: `.impeccable/critique/2026-05-24T13-08-07Z__apps-web-app-pages-browse-vue.md` (P1×2)
- Goal: keyboard + screen-reader users can perceive the active Browse filter and tab through the course grid without duplicate stops.
- Acceptance:
  - active status chip exposes `aria-pressed="true"` and a non-color (border) cue, not color alone
  - each course card is a single tab stop (the wrapping link), with no `role="button"` nested inside the anchor
- Spec diff: none
- Codegen impact: no
- Design impact: `@app/ui` — `CoursePosterCard` gains an `interactive` prop (default preserves behaviour)
- Tests: unit — CoursePosterCard `interactive=false` (no role/tabindex/aria-label, no click emit); AppChip selected→aria-pressed already covered
- Sub-steps:
  - [x] `CoursePosterCard`: add `interactive` prop, render presentational when false
  - [x] `browse.vue`: chips `:selected`, card `:interactive="false"`
  - [x] `index.vue`: poster cards `:interactive="false"`
  - [x] spec + story for the static card
  - [x] lint/format (eslint clean; @app/ui suite 839 green)
- Status: in-progress (awaiting commit/PR)
- Blockers: —
