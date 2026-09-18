## T-2026-09-18-fix-speed-menu — playback-speed menu keyboard behaviour + lock/error close

- Created: 2026-09-18
- Owner: claude
- Goal: the speed menu (`AppPlayerChrome`) behaves like the `role="menu"` it
  advertises — arrow-key/Home/End roving focus, focus moves in on open, closes
  on outside click (tuxedo 235) — and auto-closes (plus stops accepting picks)
  when the player goes `locked`/`error` mid-session (tuxedo 236).
- Spec diff: none — visual-only component, no contract change
- Codegen impact: no
- Sub-steps:
  - [x] focus moves onto the checked (or first) row when the menu opens
  - [x] ArrowUp/ArrowDown/Home/End roving focus among menu rows
  - [x] outside click closes the menu (reuses the existing focus-return path)
  - [x] `isInert` watcher closes an already-open menu on lock/error
  - [x] `chooseSpeed` guards on `isInert`, rows get `:disabled="isInert"`
  - [x] spec coverage + Storybook story pass
- Status: done
- Blockers: —
- Completed: 2026-09-18
- Result: https://github.com/kkucherenkov/course_shelf/pull/718
