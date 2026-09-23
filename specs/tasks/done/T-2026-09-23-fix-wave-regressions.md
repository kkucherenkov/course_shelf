## T-2026-09-23-fix-wave-regressions — Fix three regressions from yesterday's fix wave plus two misleading error messages

- Created: 2026-09-23
- Owner: claude
- Spec: `~/audit-courseshelf/run22/assessment-a.md` (Nielsen audit, run22)
- Goal: close the gap between "fix landed" and "fix works" for three defects
  yesterday's wave introduced, and stop two error messages from sending the
  user the wrong way.
- Acceptance:
  - `learner` hitting `/courses/:id/edit` is redirected/blocked, not shown a
    working editor that 403s on save (#795)
  - Grading the last due flashcard shows "done for today", not "create your
    first card" (#796)
  - `error.vue` (404) renders exactly one `<main>` (#797)
  - 429 on flashcard review queue reads as a rate limit, not a connection
    problem; unconfirmed-session banner names the hidden sections (#799,
    partial — transcript tab is the other lane's)
- Spec diff: none
- Codegen impact: no
- Design impact: none (behavioural fixes + copy, no new components)
- Tests: unit specs for admin gate routing, useFlashcards done-for-today
  signal, error.vue landmark count; existing suite must stay green
- Sub-steps:
  - [x] Reproduce #795, #796, #797 on the live instance before fixing
  - [x] Fix #795 — bind admin gate to the page, fix lying comment
  - [x] Fix #796 — shared "ever had due cards" signal off shared fetch key
  - [x] Fix #797 — drop the inner `<main>` in error.vue
  - [x] Fix #799 partial — 429 copy + banner section naming
  - [x] lint/format, unit tests, check:i18n green
  - [x] PR against main, Closes #795 #796 #797
- Status: done
- Blockers: —
- Completed: 2026-09-23
- Result: (PR link added after opening)
