---
target: Settings (apps/web/app/pages/settings.vue)
total_score: 38
p0_count: 0
p1_count: 0
timestamp: 2026-05-24T16-10-37Z
slug: apps-web-app-pages-settings-vue
---
## Design Health Score (re-critique after #215)

| # | Heuristic | Score | Was | Key Issue |
|---|-----------|-------|-----|-----------|
| 1 | Visibility of System Status | 4 | 4 | Per-field sync indicator + toasts |
| 2 | Match System / Real World | 4 | 4 | Clear sections, plain labels |
| 3 | User Control and Freedom | 4 | 3 | "Sign out other devices" now confirmed |
| 4 | Consistency and Standards | 4 | 1 | All controls are `@app/ui` now; tokens unified |
| 5 | Error Prevention | 4 | 2 | Destructive action gated behind `AppDialog` |
| 6 | Recognition Rather Than Recall | 4 | 4 | Everything visible + helped |
| 7 | Flexibility and Efficiency | 4 | 3 | Autosave + segmented pickers |
| 8 | Aesthetic and Minimalist Design | 4 | 3 | Clean; tokens unified |
| 9 | Error Recovery | 3 | 3 | Password errors specific; other failures share one generic toast |
| 10 | Help and Documentation | 4 | 4 | Help on every row + coming-soon cues |
| **Total** | | **38/40** | **31** | **Strong; only P3 polish left** |

## Resolved Since 31/40 (#215)

Both P1s and all three P2s from the first run are fixed in the merged code:
- **DS drift (P1)**: every control is `@app/ui` — `AppButton` / `AppInput` / `AppPasswordField` / `AppSwitch`, pickers via `AppSegmented` (`settings.vue:18-26`, no raw `U*` remain).
- **`UToggle` (P1)**: replaced with `AppSwitch` — the autoplay/resume toggles render (`settings.vue:446-465`).
- **broken `--space-1-5` (P2)**: gone with the bespoke picker; `AppSegmented` owns its padding.
- **dead affordances (P2)**: avatar / email / delete are disabled with a "coming soon" help cue (`settings.vue:248-300,551-556`).
- **destructive guard (P2)**: "sign out other devices" confirms via `AppDialog` (`settings.vue:560-580`).
- **minors**: `IconCS` in the sync indicator; tokens unified to `--text-fg`/`--text-secondary`; debounce clears on unmount + flushes on blur.

## Anti-Patterns Verdict

**LLM assessment**: Not AI slop. Consistent `@app/ui` vocabulary, real autosave, single-column 720px form, help on every row, h1 + section h2s. The four bordered sections are grouped settings, not the gratuitous-card pattern. No absolute-ban hits.

**Deterministic scan**: Unavailable (`detect.mjs` → `bundled detector not found`). Allowed exception.

**Visual overlays**: Skipped (no browser automation; SPA serves an empty shell to a fetch).

## Overall Impression

The migration did exactly what it needed to: Settings now reads as part of the same product as every other screen. What remains is genuinely minor polish, no structural or consistency problems left.

## Priority Issues

No P0/P1/P2 remain. The page is in good shape; the items below are P3 polish.

## Minor Observations

- **Completion-threshold slider a11y (P3)**: the native `<input type="range">` (`settings.vue:486-497`) has an `aria-label` but no `aria-valuetext`, so a screen reader announces "85", not "85%". The visible `{n}%` (`settings.vue:481-483`) isn't programmatically tied to the slider. Add `aria-valuetext="${value}%"`.
- **Generic failure toast (P3)**: name-save and "sign out other devices" share one `toastUpdateFailed` message (`settings.vue:64,210`); it states neither what failed nor what to do next.
- **Speed segmented on very narrow viewports (P3)**: `AppSegmented` doesn't wrap, so the 6-item speed picker (`0.75×…2×`) can overflow around 320px. The status/density pickers (3 items) are fine.
- **Disabled "coming soon" controls (P3, judgment)**: avatar upload/remove, change email, delete account are honest now (disabled + cue) but still render as three dead buttons. Hiding them until the feature lands is an alternative worth weighing.
- **Carried note**: `AppSegmented` items are each a tab stop rather than a roving-tabindex radiogroup; that's the component's contract, not this page's.

## Questions to Consider

- Is the slider's `aria-valuetext` worth a one-line fix now, or batched into a broader a11y pass?
- Disabled-with-cue vs hidden for unbuilt features (avatar / email / delete): which reads better for a self-hoster configuring the instance?
