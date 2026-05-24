---
target: Home (apps/web/app/pages/index.vue)
total_score: 35
p0_count: 0
p1_count: 1
timestamp: 2026-05-24T15-16-54Z
slug: apps-web-app-pages-index-vue
---
## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 4 | Every row handles loading / error / empty |
| 2 | Match System / Real World | 3 | Continue-watching cards read "Resume 0:00" (no resume data exists) |
| 3 | User Control and Freedom | 4 | Collapsible completed row, per-row retry |
| 4 | Consistency and Standards | 3 | `CourseWideCard` never got the `interactive`/empty-instructor fixes `CoursePosterCard` did; hardcoded "Resume" |
| 5 | Error Prevention | 4 | n/a mostly; retry everywhere |
| 6 | Recognition Rather Than Recall | 4 | Clear greeting + labelled rows |
| 7 | Flexibility and Efficiency | 3 | Wide cards are a double tab stop (button nested in link) |
| 8 | Aesthetic and Minimalist Design | 3 | "Resume 0:00" and an empty instructor line on every wide card |
| 9 | Error Recovery | 4 | Per-row retry with clear errors |
| 10 | Help and Documentation | 3 | Greeting is a `<p>`, so the page has no `<h1>` over its `<h2>` rows |
| **Total** | | **35/40** | **Well-built page; the issues sit in one shared card** |

## Anti-Patterns Verdict

**LLM assessment**: Not AI slop. The page is cleanly decomposed (`HomeGreeting` / `HomeRow` / `HomeYourWeek`), the row component handles all async states, sizing uses named SCSS vars, and the right rail follows the brief (sticky at lg+, hidden at md and below). The weak spot is a single shared component, `CourseWideCard`, that didn't receive the fixes its sibling `CoursePosterCard` got earlier.

**Deterministic scan**: Unavailable. `detect.mjs` reports `bundled detector not found`. Allowed exception.

**Visual overlays**: Skipped. No browser automation in this session; the SPA serves an empty shell to a fetch.

## Overall Impression

The best-built page reviewed so far: real state handling per row, a sensible two-column layout, disciplined tokens. The problems cluster in `CourseWideCard` (continue-watching), which is the un-migrated sibling of `CoursePosterCard`: it still nests a button inside the wrapping link, still renders an empty instructor line, and the page feeds it `resume-at="0"` for data that doesn't exist, so every card says "Resume 0:00".

## What's Working

- **`HomeRow` state coverage.** One generic row handles loading (skeleton slot), error (retry), empty (action slot), and a collapsible mode — used consistently by all three sections (`HomeRow.vue`, `index.vue:148-233`).
- **Responsive rail per brief.** "Your week" is a sticky right rail at `>1024px` and hidden below, exactly as specified (`index.vue:300-312`).
- **Token + sizing discipline.** Card widths and the rail use named SCSS vars with an explicit raw-px exemption comment; card links carry a real `:focus-visible` ring (`index.vue:255-358`).

## Priority Issues

**[P1] `CourseWideCard` nests a button inside the link**
- *Why it matters*: `CourseWideCard` is `role="button"` + `tabindex="0"` (`CourseWideCard.vue:45-53`) and is wrapped in `NuxtLink` (`index.vue:160-171`) with no `:interactive="false"` — because, unlike `CoursePosterCard`, it never gained the `interactive` prop. So continue-watching cards are a duplicate tab stop with invalid nesting, the exact issue already fixed on the poster card.
- *Fix*: Add an `interactive` prop to `CourseWideCard` (mirror `CoursePosterCard`) and pass `:interactive="false"` from `index.vue`.
- *Suggested command*: `harden`

**[P2] Every continue-watching card says "Resume 0:00"**
- *Why it matters*: `ContinueWatchingItem` has no resume-position field (only `percent`, lesson counts, `lastSeenLessonId`), but `index.vue:168` passes `:resume-at="0"`. `CourseWideCard` then renders `Resume 0:00` instead of the meaningful progress it would show for `undefined` (`CourseWideCard.vue:34-36`).
- *Fix*: Drop `resume-at` (or pass `undefined`) so the card shows `${pct}%` from the real `percent`.
- *Suggested command*: `clarify` / `harden`

**[P2] `CourseWideCard` renders a dead empty instructor line**
- *Why it matters*: `<p class="course-wide-card__instructor">{{ course.instructor }}</p>` is unconditional (`CourseWideCard.vue:68-70`); the Home DTOs carry no instructor, so it's always an empty reserved line. `CoursePosterCard` got a `v-if` for exactly this; `CourseWideCard` didn't.
- *Fix*: `v-if="course.instructor"` on the instructor paragraph.
- *Suggested command*: `harden`

**[P2] Hardcoded English "Resume" in a shared component**
- *Why it matters*: `CourseWideCard.vue:35` bakes `Resume ${fmtTime(...)}` — a user-visible English string inside `@app/ui`, which the repo bans (no untranslated strings). Other `@app/ui` components take labels as props.
- *Fix*: Accept the resume label as a prop (the page passes a translated string), or drop the branch with `resume-at`.
- *Suggested command*: `clarify`

**[P2] The page has no `<h1>`**
- *Why it matters*: `HomeGreeting` renders the greeting as a `<p>` (`HomeGreeting.vue:28`), so the three row `<h2>`s have no `<h1>` ancestor. The document outline starts at h2; the mockup made the greeting the `h1` (display).
- *Fix*: Promote the greeting to `<h1>` (or add a visually-hidden page `<h1>`).
- *Suggested command*: `harden`

## Persona Red Flags

**Owner-Admin (power self-hoster)**: Continue-watching cards are a double tab stop (button-in-anchor), so keyboard traversal hits each card twice.

**Household learner (returning, the primary Home user)**: The first thing they see, "Continue watching", labels every card "Resume 0:00" — wrong and undermines the one-click-resume promise. Each card also carries an empty instructor line.

**First-timer**: Empty states are handled (the continue-watching empty slot nudges to browse), and the greeting orients them. The missing `<h1>` is invisible to them but hurts screen-reader outline.

## Minor Observations

- `fmtDate` (`index.vue:101-103`) calls `toLocaleDateString(undefined, …)`, so the "Your week" range uses the browser locale, not the app's active i18n locale.
- `yourWeekMinutesLabel` uses `t(key, { n })` with no plural form, while `lessonsCompleted` uses pluralization, so minutes won't pluralize.
- All three mappers hardcode `instructor: ''` — correct today (no DTO field), but worth wiring once the Home DTOs grow an instructor.

## Questions to Consider

- Should `CourseWideCard` and `CoursePosterCard` share one base so a fix to one can't miss the other again?
- For continue-watching with no resume timestamp, is "47% · 8/17" clearer than a fabricated "Resume 0:00"?
- Should the greeting carry the page's `h1`, or is a separate visually-hidden title cleaner?
