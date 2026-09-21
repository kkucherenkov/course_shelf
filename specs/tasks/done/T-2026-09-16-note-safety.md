## T-2026-09-16-note-safety — flush pending note save on unmount instead of dropping it

- Created: 2026-09-16
- Owner: claude
- Goal: #632 — `AppNoteEditor`'s debounced `save` emit was cancelled outright
  in `onBeforeUnmount`, silently discarding the last ~600ms of typing on tab
  switch, autoplay-next, or navigation — while the sync indicator kept
  showing the stale "Saved" label from the previous save.
- Sub-steps:
  - [x] `onBeforeUnmount` now flushes the pending debounce
        (`emit('save', modelValue)`) instead of just clearing the timer —
        covers all three loss paths (tab switch, autoplay-next, route
        navigation) in one place, since all three unmount the component the
        same way.
  - [x] `AppNoteEditor.spec.ts`: replaced the test that asserted the old
        (wrong) behaviour ("does not fire save after unmount") with one that
        asserts the flush. Verified red against the pre-fix component, green
        after.
  - [x] live-stand check: built this worktree's own `docker/compose.yml`
        stack on isolated ports (`csh-notesafety-*`, torn down after) since
        the shared `:8090` audit stand runs a frozen pre-fix image. Headless
        Playwright against a real signed-in session: typed a note, switched
        to Sections and back inside the 600ms debounce window — text
        survived, sync indicator read "Saved · just now" confirming the
        flush actually reached the backend, not just local state. Reverted
        the component fix in place (container picks up host edits via bind
        mount) and reran the same script — text lost, matching the reported
        defect exactly. Restored the fix, reran — green again.
  - [x] gates: `@app/ui` lint/test — 23/23 `AppNoteEditor` tests green.
- Status: done
- Blockers: —
- Completed: 2026-09-16
- Result: https://github.com/kkucherenkov/course_shelf/pull/634
- Not fixed (flagged, not in scope): `PlayerNotesTab.vue` duplicates the
  "N time ago" formatter a third time in the project (admin has its own,
  fixed by another lane this wave) — no shared helper exists yet; told the
  maintainer rather than introducing one unasked.
- PR: https://github.com/kkucherenkov/course_shelf/pull/634 (merged)
