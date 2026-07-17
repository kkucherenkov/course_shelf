# Active tasks

## T-2026-07-17-003 — port the last two E17-F02 mobile composites (wave 2)

- Created: 2026-07-17
- Owner: claude
- Spec: [E17-F02-S10](../../docs/roadmap/tasks/E17-F02-S10.md), [E17-F02-S11](../../docs/roadmap/tasks/E17-F02-S11.md)
- Goal: close E17-F02 (and epic E17) by giving `app_ui` the two coverage-gap
  composites whose `@app/ui` twins shipped without a mobile card.
- Acceptance:
  - Widgetbook shows `AppBookmarkList` (empty / populated / add-row / read-only)
    and `AppSectionHeader` (open / closed / long title / singular count).
  - Both mirror their `@app/ui` twins' contract and states in light and dark themes.
- Spec diff: none
- Codegen impact: no
- Design impact: two new `ui_flutter` components — no new tokens
- Tests: widget + golden per component, colocated; Widgetbook wiring guarded by
  `apps/mobile/test/widgetbook/directories_test.dart`
- Sub-steps:
  - [ ] S10 `AppBookmarkList` — list + inline add row + empty state
  - [ ] S11 `AppSectionHeader` — collapsible header (count + duration)
  - [ ] wire both into the Widgetbook catalog
  - [ ] roadmap/TODO bookkeeping + close issues 82–89
- Status: in-progress
- Blockers: —
