---
target: Search (apps/web/app/pages/search.vue)
total_score: 31
p0_count: 0
p1_count: 0
timestamp: 2026-05-24T17-57-06Z
slug: apps-web-app-pages-search-vue
---
## Re-critique — Search (after #219)

| # | Heuristic | Score | Was | Key issue |
|---|-----------|-------|-----|-----------|
| 1 | Visibility | 3 | 3 | No "Searching for 'q'" anchor while pending (count only on success) |
| 2 | Match real world | 3 | 3 | Grouping faithful; no "where matched" snippet (DTO lacks field) |
| 3 | User control | 3 | 2 | **Retry now live** (`retry()` + AppButton); no clear-query affordance |
| 4 | Consistency | 4 | 3 | Error/empty use AppButton/AppEmptyState slots, not bespoke links |
| 5 | Error prevention | 3 | 3 | regex escaped; <2-char gated |
| 6 | Recognition | 2 | 2 | No recent searches (deferred) |
| 7 | Flexibility | 2 | 2 | Real-link results; no xs overlay (deferred) |
| 8 | Aesthetic | 4 | 4 | Calm, grouped |
| 9 | Error recovery | 4 | 1 | **Fixed**: actionable copy, 429-branched body, working retry |
| 10 | Help | 3 | 3 | No-results teaches + "Browse all courses" escape |
| **Total** | | **31/40** | **26** | **Solid; minor polish + deferred features** |

## Resolved since 26/40
- **[P1] Dead retry → FIXED**: `useSearch.retry()` re-runs `doSearch` directly (`useSearch.ts:87-89`); bound to `AppButton` (`search.vue:98-103`). Same-URL no-op gone.
- **[P1] Error copy → FIXED**: `errorTitle` "Couldn't run your search" + `errorStatus`-branched body (429 vs transient) (`search.vue:25-29`).
- **[P3] No-results → FIXED**: `AppEmptyState` body + "Browse all courses" → /browse (`search.vue:107-121`).
- Consistency: error block migrated bespoke NuxtLink → AppButton/AppEmptyState.

## Anti-Patterns Verdict
Not AI slop; no ban hits (mockup's `.sr-snippet` side-stripe correctly dropped — no DTO field). Detector + browser unavailable (degraded).

## Remaining / new
- **[P2] No-query/short-query states have no action** (carried) — bare "Type something"; the most common entry is weaker than the rarer no-match state. Add a "Browse all courses" action (+ body) to the `!q` empty state (`search.vue:54-62`). → onboard/clarify
- **[P2] Recent searches + xs overlay** — deferred net-new (shell-level). Carried.
- **[P3] sm action buttons 28px < 32px web hit-target** — both new CTAs use `size="sm"` (AppButton `$btn-h-sm: 28px`); systemic `@app/ui` floor. Use `size="md"` here or raise the token. → adapt/harden
- **[P3] raw `white` + `display:contents`** (carried systemic; #219 used `--no-verify` for exactly the `white` line at `search.vue:322`).

## Persona Red Flags
- **Owner-Admin**: the prior dead-retry-on-backend-hiccup is fully recovered (actionable + working). No remaining error-path flag.
- **Household learner**: still no recents / xs overlay (deferred) — re-searcher retypes.
- **Guest**: inaccessible-course search still generic "No matches" (contract-dependent), but now has a forward "Browse all courses" path.

## Minor
- Skeleton reserves a trailing 36px column real results don't render (skeleton↔result drift).
- Server's canonical `SearchResultDto.query` unused; page echoes client `q`.
- i18n parity (en/ru) verified for the new keys.
