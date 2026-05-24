# Active tasks

## T-2026-05-24-013 — AppPlayerChrome aria-label i18n sweep

- Created: 2026-05-24
- Owner: claude
- Spec: lesson-player critique follow-up (the ~14 screen-reader-only labels left after #220)
- Goal: the player's control `aria-label`s are localized, not English-only for SR users.
- Acceptance:
  - every `AppPlayerChrome` `aria-label` resolves from an `ariaLabels` prop (English defaults preserved)
  - the page passes a localized `ariaLabels` object
- Spec diff: none
- Codegen impact: no
- Design impact: `@app/ui` — `AppPlayerChrome` gains an `ariaLabels` object prop (defaults preserve behaviour)
- Tests: `@app/ui` (custom aria label renders); i18n parity (en/ru)
- Sub-steps:
  - [x] `AppPlayerChrome`: `ariaLabels` object prop + defaults; wired all 13 aria-label sites (incl. `bookmarkAt` `{time}`)
  - [x] page passes a localized `ariaLabels` object (`pages.lessonPlayer.aria.*`)
  - [x] i18n keys (en/ru, 17 keys, parity verified); spec (+1); lint/format/tests (@app/ui 852)
- Status: in-progress (awaiting commit/PR)
- Blockers: —
