---
target: Search (apps/web/app/pages/search.vue)
total_score: 26
p0_count: 0
p1_count: 2
timestamp: 2026-05-24T16-24-42Z
slug: apps-web-app-pages-search-vue
---
## Design Health Score — Search

| # | Heuristic | Score | Key issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Inline skeleton + counts good; count line only on `success`, no "Searching for 'q'" anchor while loading |
| 2 | Match System / Real World | 3 | Courses/Lessons grouping matches brief; initials-box thumb is a faithful stand-in |
| 3 | User Control and Freedom | 2 | No clear-query affordance; error-state "Try again" is dead (navigates to identical URL) |
| 4 | Consistency and Standards | 3 | Strong BEM/tokens; error + clear-link are bespoke `NuxtLink`s where AppButton/AppEmptyState patterns exist |
| 5 | Error Prevention | 3 | `highlight.ts:16` escapes regex metachars; `<2`-char query gated before fetch |
| 6 | Recognition Rather Than Recall | 2 | No recent searches (brief + mockup require them) |
| 7 | Flexibility and Efficiency | 2 | Results are real links (good); no xs full-screen overlay |
| 8 | Aesthetic and Minimalist Design | 4 | Calm, grouped, dark-first; no decorative noise |
| 9 | Error Recovery | 1 | "Search failed" gives no cause/next step; the only action is broken |
| 10 | Help and Documentation | 3 | Empty states teach minimally |
| **Total** | | **26/40** | **Competent / ship-with-fixes** |

## Anti-Patterns Verdict
Not AI slop — proper `@app/ui` vocab, token-only, i18n everywhere, XSS-safe highlight. No ban hits: the mockup's `.sr-snippet { border-left: 2px }` side-stripe was NOT ported (the "where matched" snippet field doesn't exist in `SearchResultDto`, so the block was dropped). `detect.mjs` missing; no browser automation → contrast/overlay degraded.

## Strengths
- Loading = inline skeleton pixel-matched to the mockup, not a spinner (`search.vue:57-84`).
- XSS closed by construction: `highlight.ts` returns `{text,match}[]` segments rendered via `{{ }}`/`<mark>`, regex escaped (`:16`) — unlike the mockup's `dangerouslySetInnerHTML`.
- Results are real navigable `<NuxtLink>` (openable in new tab) with a focus ring (`search.vue:117,156-157,276-280`).

## Priority Issues
- **[P1] Error-state "Try again" is a dead control** — navigates to `/search?q=<same q>` = current URL; Router no-ops same-location, `watch(trimmedQ)` never re-fires, `doSearch` never re-runs. Fix: expose `retry()` from `useSearch`, bind to an `AppButton`. `search.vue:89-91`, `useSearch.ts:55-83`. → clarify/harden
- **[P1] Error copy fails "what + what next"** — `errorTitle: 'Search failed'` (`en.ts:212`) names neither cause nor step; `useSearch` captures `errorStatus` but the page ignores it (429/500/offline read identically). Branch copy on `errorStatus`. → clarify
- **[P2] Missing recent searches + xs full-screen overlay** (brief §6.4 + mockup) — no-query state is a bare "Type something". Add localStorage recents + xs overlay from the shell. `search.vue:47`, `AppNavigationShell.vue:258-268`. → onboard/adapt
- **[P3] No-results empty state under-delivers + incoherent action** — reuses `emptyTypeSomething` ("Type something…") as the action while the user already typed (`search.vue:101-103`). Add a body line, relabel/drop the action. → clarify
- **[P2] Latent: no debounce** — `watch(trimmedQ, immediate)` is safe only because the shell navigates on Enter; any future type-ahead would hammer the API. Document the submit-only contract or add debounce. `useSearch.ts:71-83`.

## Persona Red Flags
- **Owner-Admin**: hits the dead retry exactly when the backend hiccups; "Search failed" discards the captured `errorStatus`.
- **Household learner**: no recent searches (the persona who re-searches the same course); cramped xs topbar input, no overlay.
- **Guest**: searching an inaccessible course gets generic "No matches" + a "Type something" link, no access hint (contract-dependent).

## Minor Observations
- `&__list-item { display: contents }` (`search.vue:256`) — historical a11y-tree bugs in old Safari/FF; low risk evergreen.
- `&__item-initials { color: white }` raw keyword on `--surface-overlay` (lesson thumb) → likely light-mode contrast risk; systemic pattern (also shell brand-mark).
- Skeleton reserves a trailing `auto` column the real results don't use (grid `64px 1fr` vs mockup `64px 1fr auto`) — cosmetic skeleton↔result mismatch.
- Server's canonical `query` in `SearchResultDto` is unused; page echoes the client `q`.
