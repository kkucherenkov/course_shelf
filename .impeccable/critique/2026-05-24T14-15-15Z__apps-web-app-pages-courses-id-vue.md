---
target: Course detail (apps/web/app/pages/courses/[id].vue)
total_score: 31
p0_count: 0
p1_count: 2
timestamp: 2026-05-24T14-15-15Z
slug: apps-web-app-pages-courses-id-vue
---
## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Strong state set; completed course shows a misleading "Start"; skeleton doesn't mirror the final layout |
| 2 | Match System / Real World | 4 | Domain language is excellent ("Resume — Section 3 · L3", "62% watched") |
| 3 | User Control and Freedom | 3 | Reset is confirmed; but no breadcrumb back to the library and lessons can't open in a new tab |
| 4 | Consistency and Standards | 2 | Bespoke load-error `<button>` vs AppButton; error UI differs from Browse's AppBanner; `ACCENT_BG` duplicates `@app/ui` `COVER` |
| 5 | Error Prevention | 4 | Destructive reset gated behind AppDialog; mark-complete/reset disabled by state |
| 6 | Recognition Rather Than Recall | 3 | Sections labelled, current lesson highlighted; no breadcrumb wayfinding |
| 7 | Flexibility and Efficiency | 3 | Resume CTA is precise; lessons aren't links (no cmd/middle-click), no view toggle |
| 8 | Aesthetic and Minimalist Design | 3 | Clean, but the current-row side-stripe hits an absolute ban; cover block is empty; hero title under-scaled |
| 9 | Error Recovery | 3 | Load-error retries; no-access lacks a "contact admin" action; completed CTA is dead |
| 10 | Help and Documentation | 3 | No-access explains; materials present |
| **Total** | | **31/40** | **Mature page, a few real gaps** |

## Anti-Patterns Verdict

**LLM assessment**: Not AI slop. The page is well-decomposed (5 focused sub-components), state derivation is clean, and the copy is domain-specific. One absolute-ban hit: the current lesson row paints a 3px colored left stripe via `::before` (`AppLessonRow.vue:173-182`) — a side-stripe accent on a list item, redundant with the `--brand-accent-soft` background + play icon + `aria-current` already marking it.

**Deterministic scan**: Unavailable. `detect.mjs` reports `bundled detector not found` (engine missing from the skill install). Allowed exception, not a skipped run. Findings are from source + design-spec comparison.

**Visual overlays**: Skipped. No browser automation in this session; the app is a Nuxt SPA (`ssr: false`) so a fetch yields an empty shell. No user-visible overlay produced.

## Overall Impression

A notably more mature surface than Browse: complete state handling (skeleton / load-error / no-access / in-progress / completed), a destructive action correctly gated behind a confirm dialog, and disciplined token + named-SCSS-var usage (it even comments the raw-px exemptions). The gaps are at the seams: a primary CTA that nests a button inside a link, a completed-course CTA that points nowhere, and missing wayfinding the DTO already supports.

## What's Working

- **State coverage and derivation.** `courseState` / `resumeLesson` / `resumePosition` are derived cleanly; loading, load-error, 403-no-access, in-progress, and completed are all handled (`courses/[id].vue:45-121`).
- **AppLessonRow a11y.** `role="button"`, Enter/Space with `preventDefault`, `aria-current` for the active lesson, locked rows get `tabindex=-1` + `aria-disabled`, and progress is announced as text ("62% watched"), not colour alone (`AppLessonRow.vue:67-126`).
- **Destructive-action safety + quiet completion.** Reset progress is gated behind `AppDialog` with a destructive confirm (`CourseActions.vue:72-94`); the completion banner is a single quiet `aria-live` line with a full border, matching the brief's "quiet celebration" (`CourseCompletedBanner.vue`).

## Priority Issues

**[P1] Primary CTA nests a button inside a link**
- *Why it matters*: `CourseActions.vue:41-49` wraps `<AppButton>` (renders a `<button>`) in `<NuxtLink>` (an `<a>`). That is an interactive control inside an anchor: a duplicate tab stop and invalid nesting, the same class of issue just fixed on `CoursePosterCard`. `AppButton` has no link mode, so every "button that navigates" repeats this.
- *Fix*: Give `AppButton` an optional `to`/`href` that makes it render as `NuxtLink`/`<a>` (the reusable DS fix), then drop the wrapping link here.
- *Suggested command*: `harden`

**[P1] Completed course shows a "Start" CTA that links to `#`**
- *Why it matters*: When every lesson is complete, `resumeLesson` is `null`, so `primaryCTAHref` falls back to `'#'` and `primaryCTALabel` is `ctaStart` "Start" (`courses/[id].vue:62-102`). A finished course presents a primary button labelled "Start" that navigates nowhere (jumps to top). The primary action is both mislabelled and dead in a real state.
- *Fix*: For the completed state, relabel (e.g. "Rewatch from start" / "Review") and link to the first lesson, or drop the primary CTA and let "Reset progress" lead.
- *Suggested command*: `clarify` / `harden`

**[P2] Current-row side-stripe (absolute ban)**
- *Why it matters*: `AppLessonRow.vue:173-182` draws a 3px accent bar on the left edge of the current row. The skill's absolute bans call out side-stripe borders on list items; it's redundant here with the accent-soft background, the play icon, and `aria-current`.
- *Fix*: Remove the `::before` stripe; the background tint + icon already mark "current".
- *Suggested command*: `polish`

**[P2] Inconsistent, bespoke error treatment**
- *Why it matters*: The load-error path uses a hand-rolled `<button class="page-course-detail__retry-btn">` (`courses/[id].vue:173-178`) instead of `AppButton`, and a custom div instead of the `AppBanner` Browse now uses. Two pages, two error vocabularies.
- *Fix*: Use `AppButton` for retry; align on `AppBanner(variant="error")` with the new `actions` slot for parity with Browse.
- *Suggested command*: `clarify` / `polish`

**[P2] No breadcrumb, though the DTO carries `librarySlug`**
- *Why it matters*: `CourseOutlineSummary.librarySlug` exists "for breadcrumbs" (`types.gen.ts:1066`) and the mockup shows Browse › Library › Course, but the page renders none. On a deep `/courses/:id` route the user has no in-page path back.
- *Fix*: Add a breadcrumb from `librarySlug`.
- *Suggested command*: `harden`

## Persona Red Flags

**Owner-Admin (power self-hoster)**: Lessons are `role="button"` (programmatic `navigateTo`), so cmd/middle-click "open in new tab" doesn't work on a list built for scanning. No breadcrumb to jump back to the library. A completed course offers a dead "Start" button.

**Household learner (resuming)**: The resume CTA is the highlight — "Resume — Section 3 · L3" linking to the exact lesson. But after finishing, the page offers a misleading "Start", and total course duration isn't shown upfront to plan a session (the DTO has it; the hero drops it).

**Guest (scoped access)**: 403 renders `AppNoPermission` with "You do not have permission to view this course." It names the gap but offers no "contact admin" next step the brief asked for. Locked lessons inside an accessible course are handled well (lock icon, disabled row).

## Minor Observations

- Hero drops the mockup's Duration and Sections meta even though `totalDurationSeconds` is in the DTO; it shows only lessons + progress.
- Hero cover is an empty accent block (no initials glyph the mockup shows); `course-hero__cover-inner` has a dead `background: var(--surface-raised)` line overridden by the inline `:style`.
- `ACCENT_BG` in `CourseHero.vue:18-25` duplicates `COVER` from `@app/ui` (exported from `CourseCard/index.ts` but not the top-level `@app/ui` index). Export it once and import.
- Hero title is `--text-2xl`, the same step as a list-page h1; a detail hero can carry more scale for focal hierarchy.
- Loading skeleton is a generic stack, not a hero + two-column shape, so content shifts on arrival.
- Materials download button is 28px, just under the 32px web hit-target.
- `resumeLesson` comment is muddled ("pick the first one … take the last in-progress").

## Questions to Consider

- Should `AppButton` gain a link mode so "navigate" CTAs stop nesting a button in an anchor across the app?
- What should a finished course's primary action be: rewatch, review notes, or nothing?
- Should lessons be real links so they open in new tabs, given how much scanning this page invites?
