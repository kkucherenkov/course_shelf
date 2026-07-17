# Active tasks

## T-2026-07-17-004 — clear the three E17 follow-ups surfaced during the widget waves

- Created: 2026-07-17
- Owner: claude
- Spec: none — follow-ups recorded on [T-2026-07-17-003](./done.md)
- Goal: close out the three defects/gaps the E17 fan-out agents surfaced but
  were out of scope to fix in their own cards.
- Acceptance:
  - A screen-reader user can reach and activate `AppBookmark`'s edit/delete
    controls inside an `AppRow` (or: evidence that they already can, and the
    original report was wrong).
  - The bookmark add row can be cancelled on a device with no keyboard.
  - The bottom-tab bar's active tab renders a filled glyph, and the web and
    Flutter icon families still hold byte-identical paths.
- Spec diff: none
- Codegen impact: no
- Design impact: 5 new filled glyphs in both `@app/ui` and `ui_flutter` — no new tokens
- Tests: semantics widget test (AppRow); widget + golden (AppBookmarkAdd);
  Flutter goldens + web Storybook story/spec/snapshots (icons)
- Sub-steps:
  - [ ] `AppRow` — verify the semantics-merge claim, fix only if reproducible
  - [ ] `AppBookmarkAdd` — visible cancel affordance, keep the Escape binding
  - [ ] 5 filled nav glyphs drawn once, applied to both stacks, wired to `filledIcon`
- Status: in-progress
- Blockers: —

## Notes

`AppNavigationTab.filledIcon` is deliberately kept and populated, not replaced —
the slot is part of the approved E17-F02-S03/S06/S07 design brief. Filled glyphs
are additive `IconName` entries; the `fill:` / `kFillableIcons` mechanism
(play + bookmark) is untouched.
