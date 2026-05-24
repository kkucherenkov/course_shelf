---
target: Lesson player (apps/web/app/pages/courses/[id]/lessons/[lessonId].vue)
total_score: 26
p0_count: 0
p1_count: 3
timestamp: 2026-05-24T16-24-42Z
slug: apps-web-app-pages-courses-id-lessons-lessonid-vue
---
## Design Health Score — Lesson player

| # | Heuristic | Score | Key issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | States real, but no "progress synced" indicator the mockup shows |
| 2 | Match System / Real World | 3 | `lessonSubtitle` builds "Section 03 · …" in English code (`[lessonId].vue:267`) |
| 3 | User Control and Freedom | 2 | Prev button silently no-ops at lesson 1; next always enabled on last |
| 4 | Consistency and Standards | 2 | `AppPlayerChrome` hardcodes ~8 English strings while matching locale keys sit unused |
| 5 | Error Prevention | 3 | 401 stream retry-after-refresh is solid |
| 6 | Recognition Rather Than Recall | 3 | Keyboard shortcuts undiscoverable; no legend |
| 7 | Flexibility and Efficiency | 2 | Speed is a cycle-button, not the briefed popover |
| 8 | Aesthetic and Minimalist Design | 3 | Calm chrome; on-media debt is known repo-wide, not charged here |
| 9 | Error Recovery | 3 | Inline error + retry in the player; but text is hardcoded English |
| 10 | Help and Documentation | 2 | No shortcut legend; no instructor / "Lesson 3 of 6" context bar |
| **Total** | | **26/40** | **Competent but incomplete** |

## Anti-Patterns Verdict
Not AI slop. No ban hits (no side-stripe / gradient text / glass / hero-metric / modal-first). One AI tell: hardcoded English UI copy inside an otherwise i18n-wired component. Deterministic scan (`detect.mjs`) missing; no browser automation → motion/overlay/contrast unverified (degraded).

## Strengths
- Real state machine, skeletons not spinners; `ended` correctly out-prioritizes a spurious `error` (`[lessonId].vue:237-245,275-279`).
- Resume seek gated on the `resumeWhereLeftOff` preference (`[lessonId].vue:111-120`).

## Priority Issues
- **[P1] AppPlayerChrome ships hardcoded English UI strings** — "Try again"/"Playback failed"/"Up next in {n}s"/"Stay here"/"Play next"/"You don't have access…" + all `aria-label`s, while locale keys (`retry`/`stayHere`/`playNext`/`upNextIn`) sit unused. RU users get an English player. Fix: add label props to `AppPlayerChrome`, pass via `t()`. `AppPlayerChrome.vue:73,277,287,293,299,305`. → clarify
- **[P1] Brief-mandated chrome auto-fade (3s) + reappear-on-move is missing** — no idle timer / pointermove listener / opacity toggle; overlay is static (`AppPlayerChrome.vue:311`). `minimal` mode exists but is never driven. Fix: idle-timer composable, respect reduced-motion. → animate
- **[P1] Raw English in the page/sidebar** — `lessonSubtitle` literal "Section " (`[lessonId].vue:267`); `PlayerBookmarksTab.vue:96` "+ Bookmark current position". Move to locale. → clarify
- **[P2] Prev/Next have no boundary-disabled state** — clicks at first/last do nothing, look identical (`[lessonId].vue:206`). Pass `hasPrev`/`hasNext`, bind `:disabled`. → harden
- **[P2] Missing the mockup's bottom context bar** — title `<h1>`, "Lesson 3 of 6 · with {instructor}", prev/next, "Progress synced" chip all absent (mockup `app.jsx:29-60`). → adapt

## Persona Red Flags
- **Owner-Admin**: blind speed cycle-button; undiscoverable keyboard map.
- **Household learner**: no orientation ("Lesson 3 of 6 · with {instructor}") and no "Progress synced" reassurance; English auto-advance banner on RU.
- **Guest**: no-permission path works, but in-player `locked` text is hardcoded English (`AppPlayerChrome.vue:287`).

## Minor Observations
- Settings button on the chrome has no handler (dead control, `:331`).
- Scrubber is click+keyboard but not pointer-drag (`:349`).
- Skeleton `height:calc(100% - 52px)` magic number slips the `$topbar-h` named-var convention (`[lessonId].vue:304`).
- `chromeSpeed` "set directly" branch is dead (page always emits current speed).
