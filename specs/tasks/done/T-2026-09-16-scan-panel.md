## T-2026-09-16-scan-panel — scan panel covers bottom nav; duplicate finish toast

- Created: 2026-09-16
- Owner: claude
- Spec: —
- Goal: `ScanLifecycleNotifier.vue` fixed panel outranks `AppNavigationShell`'s
  bottom-tab bar on `z-index` below 600px, so an in-flight scan makes nav
  unreachable for its whole duration (an active card can't be dismissed).
  Second, unrelated defect in the same component: the finish toast fires even
  when the panel already renders the same card, doubling the notification in
  the same bottom-right corner (#667).
- Spec diff: none (no API/contract change)
- Codegen impact: no
- Sub-steps:
  - [x] Reproduced both live on the audit stand at 375px (Playwright,
        cookie+bearer auth, admin scan triggered via API): panel bottom edge
        overlapped the nav bar by 48 of its 64px, `elementFromPoint` at the
        nav row hit panel content, not a tab; finish moment showed panel +
        matching toast simultaneously, toast auto-dismissed ~5s later, panel
        stayed
  - [x] Raised panel's `bottom` above the bar at <600px, height sourced from
        the same `--space-8` token the bar itself uses
  - [x] Toast-on-finish now skips any card already present in `visibleCards`
        (only fires for scans pushed past `MAX_VISIBLE` by more concurrent
        activity)
  - [x] Updated component spec: two prior tests asserted the buggy
        always-toast behavior for a single finished scan — rewrote them
        against an overflow scenario (4 concurrent scans) so the plural
        formatting they test still exercises a real toast; added a spec for
        the fix itself
  - [x] `turbo run lint test typecheck` — 18/18 green (570 web + 2159
        backend tests; the 27 pre-existing `foundations.vue` lint errors and
        6 timeout-flaked web specs are unrelated — both reproduce identically
        on an unmodified checkout and pass clean in isolation)
  - [x] Re-verified live: rebuilt the `web` image from this branch,
        hot-swapped onto the shared `csh-audit` stand's `web` container
        (375px viewport, admin session, scan triggered via API) and reverted
        after — panel's bottom edge now clears the nav bar by 16px instead of
        overlapping it by 48, `elementFromPoint`/a real click on the nav row
        reach the tab (navigated to `/browse`) instead of the panel, and the
        finish moment shows the panel with zero toasts for the whole 15s
        window instead of one
- Status: in-progress (gates + live check done; PR next)
- Blockers: —
- PR: https://github.com/kkucherenkov/course_shelf/pull/671 (merged)
