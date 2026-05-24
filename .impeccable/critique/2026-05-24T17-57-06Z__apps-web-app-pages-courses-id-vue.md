---
target: Course detail (apps/web/app/pages/courses/[id].vue)
total_score: 35
p0_count: 0
p1_count: 0
timestamp: 2026-05-24T17-57-06Z
slug: apps-web-app-pages-courses-id-vue
---
## Re-critique — Course detail (after #214)

| # | Heuristic | Score | Was | Key issue |
|---|-----------|-------|-----|-----------|
| 1 | Visibility | 4 | 3 | Completed course shows truthful "Rewatch from start"; skeleton still a generic stack (CLS) |
| 2 | Match real world | 4 | 4 | "Resume — Section 3 · L3", "62% watched", duration "9h 45m" |
| 3 | User control | 3 | 3 | Reset confirmed; no breadcrumb (DTO has only `librarySlug`, no name); lessons still `role=button` |
| 4 | Consistency | 4 | 2 | Retry uses AppButton; primary CTA single anchor; `COVER` imported from @app/ui. Error wrapper still bespoke `<div>` (not AppBanner) |
| 5 | Error prevention | 4 | 4 | Reset gated behind AppDialog; mark-complete/reset state-disabled |
| 6 | Recognition | 3 | 3 | Sections labelled, current highlighted; no breadcrumb |
| 7 | Flexibility | 3 | 3 | Resume precise; lessons not links; no list/grid toggle |
| 8 | Aesthetic | 4 | 3 | **Side-stripe `::before` removed**; dead cover bg line gone; cover still empty (no initials); hero title still `--text-2xl` |
| 9 | Error recovery | 3 | 3 | Load-error retries; completed CTA works; no-access lacks "Contact admin" |
| 10 | Help | 3 | 3 | No-access explains gap; no "Contact admin" next step |
| **Total** | | **35/40** | **31** | **Four up; seam bugs fixed, deferred wayfinding remains** |

## Resolved since 31/40
- **[P1] Button-in-anchor → RESOLVED**: `AppButton` gained `to` (renders NuxtLink; falls back to button when disabled/loading); `CourseActions` primary CTA is one anchor (`CourseActions.vue:40-48`). Story + spec cover it.
- **[P1] Completed "Start → #" → RESOLVED**: `firstLessonId` fallback + `ctaRewatch` "Rewatch from start" → first lesson; `'#'` only when zero lessons (`[id].vue:74-108`).
- **[P2] Side-stripe ban → RESOLVED**: `::before` gone; current row = bg tint + play icon + aria-current (`AppLessonRow.vue:173-177`).
- **[P2] Bespoke retry button → PARTIAL**: retry is `AppButton` now; wrapper still a custom div (not `AppBanner`).
- **[P2] `ACCENT_BG` dup → RESOLVED**: `CourseHero` imports `COVER` from @app/ui.
- **[minor] hero duration → RESOLVED** ("9h 45m"); dead cover bg line → removed; `resumeLesson` comment clarified.

## Anti-Patterns Verdict
Not AI slop. Well-decomposed; the prior side-stripe ban-hit is fixed; the `AppButton.to` fix is the reusable DS-level fix with story+spec. Detector + browser unavailable (degraded).

## Remaining / new priority issues
- **[P2] No-access lacks "Contact admin" action** (brief §6.5) — `AppNoPermission` has an `#action` slot, unused; guest hits a dead end (`[id].vue:183-187`). → harden
- **[P2] Error container still bespoke `<div>`, not `AppBanner`** — retry is AppButton, but the shell diverges from Browse's AppBanner parity (`[id].vue:188-196`). → clarify
- **[P2 deferred] Breadcrumb** — DTO carries `librarySlug` but no library *name* (`types.gen.ts:1066-1068`); needs a spec extension. → harden (after spec)
- **[P3] Skeleton doesn't mirror hero+two-column** (CLS). → polish
- **[P3] Materials download btn 28px < 32px** (`CourseMaterialsRail.vue:116`). → harden
- **[P3] Hero drops "Sections" meta** the mockup shows (no `sectionsTotal`; `data.sections.length` available in parent). → polish
- **[P3 deferred] lessons as links** (AppLessonRow `role=button`).

## Persona Red Flags
- **Owner-Admin**: no breadcrumb back to library (DTO gap); lessons can't open in new tab; the mockup's "Library" rail card (path + chips) is absent. Improved: completed → "Rewatch from start".
- **Household learner**: strong — precise resume, working rewatch when done, duration shown. No flags.
- **Guest**: 403 names the gap but no "Contact admin" next step (slot unused); locked lessons handled well.

## Minor
- Cover still an empty accent block (no initials glyph; `COVER`/`initials` are one line away).
- Hero title `--text-2xl` (same as list h1); a detail hero could carry display scale.
- `AppLessonRow` prop doc still says "3px leading bar" — stale after the stripe removal.
