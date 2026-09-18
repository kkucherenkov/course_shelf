## T-2026-09-18-fix-admin-scans-a11y — admin scans cascade bug + expandable errors + 4 a11y defects

- Created: 2026-09-18
- Owner: claude
- Spec: tuxedo 250, tuxedo 251
- Goal: nonzero scan-error counts render visibly again, the one expandable
  scan row actually expands on the dashboard, and the four a11y defects
  measured unchanged across the 1.8.0/1.8.1 audits (empty-table-header,
  nested-interactive, heading-order, landmark-one-main+region) are gone.
- Spec diff: none (no API/contract change)
- Codegen impact: no
- Sub-steps:
  - [x] AdminScansTable.vue: fix `__errors--nonzero` losing the cascade to `tbody td`
  - [x] admin/index.vue: wire `expandableScanId`/`expandedScanId`/`toggle-errors` for the dashboard's one live-detail row
  - [x] AdminScansTable.vue: give the two empty `<th>` cells a real accessible name (empty-table-header, /admin)
  - [x] AdminLibraryRow.vue: stop nesting real buttons inside `role="button"` (nested-interactive, /admin/libraries)
  - [x] CourseScrapePreviewPanel.vue: h3 → h2, fixes the h1→h3 skip on /courses/{id}/edit (heading-order)
  - [x] apps/web/app/error.vue: give Nuxt's default error page a `<main>` landmark (landmark-one-main + region — the audit's `/libraries` target is a stale route killed by #674, this is what actually renders there now)
  - [x] lint/stylelint/format + vitest suites touched
  - [x] PR opened, CI green
- Status: done
- Blockers: —
- Completed: 2026-09-18
- Result: https://github.com/kkucherenkov/course_shelf/pull/720
