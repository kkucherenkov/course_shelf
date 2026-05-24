---
target: Browse / каталог (apps/web/app/pages/browse.vue)
total_score: 36
p0_count: 0
p1_count: 0
timestamp: 2026-05-24T15-41-07Z
slug: apps-web-app-pages-browse-vue
---
## Design Health Score (re-critique after #212)

| # | Heuristic | Score | Was | Key Issue |
|---|-----------|-------|-----|-----------|
| 1 | Visibility of System Status | 4 | 3 | Loading-aware subtitle + skeleton + error + empty all handled |
| 2 | Match System / Real World | 4 | 4 | Domain language solid |
| 3 | User Control and Freedom | 4 | 3 | Filtered-empty now offers "Show all courses" |
| 4 | Consistency and Standards | 4 | 2 | Retry uses `AppButton`; chips use `selected` |
| 5 | Error Prevention | 3 | 3 | n/a mostly |
| 6 | Recognition Rather Than Recall | 4 | 3 | Active chip now exposes `aria-pressed` + a border cue |
| 7 | Flexibility and Efficiency | 3 | 2 | Spec'd library/duration/instructor facets still absent |
| 8 | Aesthetic and Minimalist Design | 3 | 3 | Clean, but the muted text references an undefined token |
| 9 | Error Recovery | 4 | 2 | Actionable error copy + a working Retry |
| 10 | Help and Documentation | 3 | 2 | Empty states teach the next action |
| **Total** | | **36/40** | **27** | **Strong; one new token bug + the deferred facets** |

## Resolved Since 27/40 (#212)

All three P1s and both P2s from the first run are fixed in the merged code:
- **a11y**: active chip now sets `:selected` → `aria-pressed` + accent border, not colour alone (`browse.vue:104`).
- **nested interactive**: card passes `:interactive="false"`; one tab stop per card (`browse.vue:163`).
- **instructor**: mapped from `item.instructors[].displayName`, hidden when empty (`browse.vue:71`).
- **error/empty**: `errorBody` + `AppButton` retry via the new `AppBanner` actions slot; filtered-empty has its own title + a "Show all courses" reset (`browse.vue:124-153`).
- **hit-target**: status chips bumped to ≥32px (`browse.vue:209-212`).
- **count flash + stale comment + palette**: all addressed.

## Anti-Patterns Verdict

**LLM assessment**: Not AI slop. Restrained, on-brand, all four async states handled, consistent `@app/ui` vocabulary. No absolute-ban hits.

**Deterministic scan**: Unavailable (`detect.mjs` → `bundled detector not found`). Allowed exception.

**Visual overlays**: Skipped (no browser automation; SPA serves an empty shell to a fetch).

## Overall Impression

The fixes landed cleanly and the page is now a strong, conventional catalog surface. Two things remain: a newly-spotted undefined-token bug that makes the "muted" text not actually muted, and the faceted filtering that was always a backend-dependent feature-track.

## Priority Issues

**[P2] `--text-fg-muted` is an undefined token (new)**
- *Why it matters*: `browse.vue:189,223` set `color: var(--text-fg-muted)` on the subtitle and sort label, but no token by that name is defined (the scale ships `--text-fg`, `--text-secondary`, and `--text-muted` = alias of secondary). With no fallback, the declaration is invalid and the text inherits the full-strength `--text-fg` instead of the muted tone. It's systemic: the same undefined token is referenced in `sign-up.vue`, `forgot.vue`, `setup.vue`, and `AppField.vue` (~8 usages).
- *Fix*: app-wide — either define `--text-fg-muted` as an alias of `--text-secondary` in the token source, or sweep-replace the usages with `--text-secondary`. (Browse alone is the symptom, not the right scope.)
- *Suggested command*: `polish` (or a dedicated token-cleanup pass)

**[P2] Faceted filters still missing (carried forward)**
- *Why it matters*: Browse still exposes only a status chip row + sort; the mockup's library / duration / instructor facets (sidebar at md+, bottom sheet at xs) aren't here, so a large shelf can't be narrowed as designed.
- *Fix*: Feature-track — `spec-writer` adds the query params, then backend filtering, then the frontend rail/sheet. Not a design-only change.
- *Suggested command*: `shape` (UX), then spec-first → backend → frontend

## Minor Observations

- Sort lacks the "duration" option the mockup lists (`recently-watched` / `newest` / `alphabetical` only).
- No xs bottom-sheet filter UX yet (the chips just wrap); flagged in the code comment at `browse.vue:88-89`.
- Skeleton count is fixed at 8 regardless of breakpoint.
- The status chips are single-select but use `role="group"` + `aria-pressed` (toggle buttons); a `radiogroup` would model single-select more precisely.

## Questions to Consider

- Is `--text-fg-muted` worth a one-line token alias now, given ~8 call sites already depend on it?
- Are the faceted filters scheduled, or is the single status row the intended scope for v1?
