---
target: Lesson player (apps/web/app/pages/courses/[id]/lessons/[lessonId].vue)
total_score: 32
p0_count: 0
p1_count: 1
timestamp: 2026-05-24T17-41-24Z
slug: apps-web-app-pages-courses-id-lessons-lessonid-vue
---
## Design Health Score — Lesson player (re-critique after #220 + #221)

| # | Heuristic | Score | Was | Key issue |
|---|-----------|-------|-----|-----------|
| 1 | Visibility of System Status | 3 | 3 | Real states; still no "progress synced" indicator the mockup shows |
| 2 | Match System / Real World | 4 | 3 | `lessonSubtitle` is localized now ("Section NN · …" via `sectionLabel`) |
| 3 | User Control and Freedom | 3 | 2 | Prev/next now disable at course bounds (no more silent no-op) |
| 4 | Consistency and Standards | 4 | 2 | No hardcoded English left in the chrome — visible + aria strings are props |
| 5 | Error Prevention | 3 | 3 | n/a mostly |
| 6 | Recognition Rather Than Recall | 3 | 3 | Keyboard shortcuts still undiscoverable (no legend) |
| 7 | Flexibility and Efficiency | 3 | 2 | Nav is clearer; speed is still a cycle-button, not the briefed popover |
| 8 | Aesthetic and Minimalist Design | 3 | 3 | Calm; on-media debt is repo-wide, not charged here |
| 9 | Error Recovery | 4 | 3 | Inline error + retry, now fully localized |
| 10 | Help and Documentation | 2 | 2 | No context bar (title/instructor/position), no shortcut legend |
| **Total** | | **32/40** | **26** | **Solid; the remaining gaps are motion + IA, not correctness** |

## Resolved Since 26/40 (#220 + #221)

- **i18n (P1×2)**: `AppPlayerChrome` no longer bakes English — visible strings (retry/locked/up-next/stay/play-next) and all 13 aria-labels are props with English defaults; the page passes localized values (`lessonPlayer.*` + `lessonPlayer.aria.*`). `lessonSubtitle` and the bookmark "add" button are localized (`sectionLabel`, `bookmarkAdd`).
- **nav (P2)**: `hasPrev`/`hasNext` disable prev/next at the first/last lesson instead of clicking into nothing (`[lessonId].vue:359`, `AppPlayerChrome.vue`).

## Anti-Patterns Verdict

Not AI slop; no ban hits. The one prior AI tell (English copy in an i18n-wired component) is gone. Deterministic scan (`detect.mjs`) unavailable; no browser automation, so the (still-missing) chrome fade and overlay timing are unverified — source-only, degraded.

## Overall Impression

The fixes closed the correctness/i18n gaps cleanly; the player now reads as fully localized and its navigation is honest. What remains is exactly what was deferred for visual iteration: the brief's auto-fading chrome and the bottom context bar, plus the speed-picker affordance.

## Priority Issues

**[P1] Chrome auto-fade still missing (brief §6.6)** — carried forward. No idle timer / `pointermove` listener / opacity toggle exists; the overlay is static and `minimal` mode is rendered only by a never-driven `v-show` (`AppPlayerChrome.vue:519`). The brief requires "visible on entry; fades after 3s of no input; reappears on mouse move / tap." Needs an idle composable, reduced-motion respected. → animate

**[P2] No bottom context bar (title/instructor/position/sync)** — the page still renders only chrome + sidebar; the mockup's "Lesson 3 of 6 · with {instructor}" + `<h1>` + "Progress synced" line are absent, which is why Visibility (#1) and Help (#10) stay low. → adapt

**[P2] Speed is a cycle-button, not a popover** — `@click="emit('speed', props.speed)"` (`AppPlayerChrome.vue:492`) cycles rate; a power user can't jump to 1.75× directly. The brief specifies a speed popover. → harden / shape

**[P3] Keyboard shortcuts undiscoverable** — rich j/k/l/,/. support with no legend or help affordance.

## Persona Red Flags

- **Owner-Admin (power)**: still a blind speed cycle-button; shortcut map undiscoverable.
- **Household learner (watching)**: now fully localized (the big win) and prev/next behave at bounds; but no "Lesson 3 of 6 · with {instructor}" orientation and no "progress synced" reassurance, and the chrome never fades so it sits over the video.
- **Guest (scoped)**: no-permission + in-player locked text are localized now; path works.

## Minor Observations

- The chrome's Settings button still has no handler (dead control, `AppPlayerChrome.vue:392`).
- Scrubber is click + keyboard but not pointer-drag.
- Skeleton sidebar uses a `calc(100% - 52px)` magic number that slips the named-var convention.

## Questions to Consider

- Is the auto-fade worth doing now (needs a browser to tune the 3s + easing), or batched with the context-bar into one "player polish" pass?
- Should the speed control become a popover (a small menu) or stay a cycle-button with a tooltip?
