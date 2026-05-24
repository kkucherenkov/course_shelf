---
target: Home (apps/web/app/pages/index.vue)
total_score: 40
p0_count: 0
p1_count: 0
timestamp: 2026-05-24T17-57-06Z
slug: apps-web-app-pages-index-vue
---
## Re-critique — Home (after #216)

| # | Heuristic | Score | Was | Key issue |
|---|-----------|-------|-----|-----------|
| 1 | Visibility | 4 | 4 | Every row + rail handles loading/error/empty |
| 2 | Match real world | 4 | 3 | "Resume 0:00" gone — continue-watching shows real `${pct}%` |
| 3 | User control | 4 | 4 | Collapsible completed row, per-row retry |
| 4 | Consistency | 4 | 3 | `CourseWideCard` + `CoursePosterCard` share `use-course-card`; sibling drift closed |
| 5 | Error prevention | 4 | 4 | Retry everywhere; no destructive actions |
| 6 | Recognition | 4 | 4 | Labelled rows, clear greeting |
| 7 | Flexibility | 4 | 3 | Double tab-stop resolved (`:interactive="false"` on all rows) |
| 8 | Aesthetic | 4 | 3 | No "Resume 0:00", no empty instructor line |
| 9 | Error recovery | 4 | 4 | Per-row + rail retry with clear titles |
| 10 | Help | 4 | 3 | Greeting is now `<h1>` → clean outline |
| **Total** | | **40/40** | **35** | **Strongest surface; all prior issues resolved** |

## Resolved since 35/40
- **[P1] Double tab-stop / button-in-anchor → RESOLVED**: `CourseWideCard` gained `interactive` (via shared `useCourseCard`); Home passes `:interactive="false"` on all three rows (`index.vue:168,196,229`); spec'd.
- **[P2] "Resume 0:00" → RESOLVED**: fabricated `resume-at="0"` dropped; `metaLabel` falls back to `${pct}%` (`CourseWideCard.vue:34`); spec asserts `33%`.
- **[P2] Empty instructor line → RESOLVED**: `v-if="course.instructor"` (`CourseWideCard.vue:63`); spec'd.
- **[P2] Hardcoded "Resume" in @app/ui → RESOLVED**: `resumeLabel` prop (parent supplies translated string).
- **[P2] No `<h1>` → RESOLVED**: greeting is `<h1>` (`HomeGreeting.vue:28`).
- **[minor] locale-aware dates → RESOLVED** (`fmtDate(locale.value)`).
- **[architecture] shared base → RESOLVED**: both cards consume `use-course-card`; can't drift again.

## Anti-Patterns Verdict
Not AI slop — strongest surface reviewed; the shared composable is genuine de-dup with a documented contract; spec + story back every new prop. Detector + browser unavailable (degraded).

## Remaining / new priority issues
No P0/P1/P2 remain.
- **[P3 deferred] Continue-watching "next-lesson CTA"** — brief §6.3 wants an explicit CTA; the card shows progress% + count + links to the last-seen lesson, but `ContinueWatchingItem` has no next-lesson title/timestamp to fill `resumeLabel`. Data-shape limitation, not a code defect; pass a translated `resumeLabel` once the DTO grows the field.
- **[P3 by design] `minutesWatched` not pluralized** — "min" is invariant in en/ru (intentional); switch to a plural message only if a future locale needs it.

## Persona Red Flags
- **Owner-Admin**: keyboard traversal hits each card once (the link), real focus ring; no nested control. No flags.
- **Household learner**: "Continue watching" shows truthful `47%` not "Resume 0:00", instructor line gone; resumes at last-seen lesson on click. No flags.
- **Guest**: role label "Guest" + guest badge; empty states nudge to browse; no leaked admin affordances. No flags.

## Minor
- Mappers still hardcode `instructor: ''` (correct today; `v-if` hides it) — wire when Home DTOs grow instructor.
- Known systemic card-component on-media `rgba`/raw-px debt (out of Home's scope).
- `HomeYourWeek` shows minutes/lessons/range but not the mockup's weekly sparkline/streak — mockup-extra, not a brief miss (brief mandates only minutes + lessons).
