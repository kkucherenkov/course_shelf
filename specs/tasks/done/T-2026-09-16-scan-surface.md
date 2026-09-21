## T-2026-09-16-scan-surface — errors survive scan completion, honest toast, visible start failure

- Created: 2026-09-16
- Owner: claude
- Goal: `#620` the real per-file `ScanError[]` (fetched by `useScanProgress` via
  `GET /libraries/{id}/scans/latest`, which returns the latest scan's full
  detail regardless of terminal status) is only ever rendered inside
  `v-if="showScanProgress"` — the moment a scan finishes, `showScanProgress`
  goes false and the 106-error list becomes unreachable even though the data
  is still in memory. `#621` the completion toast is wrong three ways:
  `toastFailedSummary` is called with `{ errors: n }` but vue-i18n only reads
  a plural index off `named.n`/`named.count`, so it always renders the first
  form; `toastDoneSummary` is one non-pluralizable string
  (`'{courses} courses · {lessons} lessons'`), not two pipe-messages like the
  `statLibrariesMeta*` split; and the "lessons" number is actually
  `card.filesAdded` (TODO(E13) — no lesson count on the wire), so it lies
  after any rescan. `#624` (partial — only the one line in this lane's file;
  rest belongs to `silent-failures`): `admin/libraries/[id].vue:161` calls
  `runLibraryScan({ throwOnError: false })` and never checks `res.error`, so
  a 403/500 start failure is silent, and the dead `catch` path's toast title
  is the CTA label (`scanNowCta`), not an error message.
- Sub-steps:
  - [x] #620 — moved the error list out from under `showScanProgress`, gated
        only on `scanErrorsOpen && hasScanErrors`; `AdminScansTable`'s
        `errorsCount` cell becomes a button (new `expandableScanId`/
        `expandedScanId` props + `toggle-errors` emit) for the one row that
        actually has detail data — the library's latest scan, same id
        `useScanProgress` already holds. Historical rows have no per-scan
        detail endpoint on the wire (`AdminScanListItem` only carries
        `errorsCount`), so their cells stay static, unchanged from before.
  - [x] #621 — `toastFailedSummary` call switched to the 3-arg
        `t(key, count, { named: { n: count } })` form already used by
        `errorsButton` in the same file; `toastDoneSummary` split into
        `toastDoneSummaryCourses`/`toastDoneSummaryFiles` (renamed from
        "lessons" — honest about what `filesAdded` counts — closes the
        TODO(E13) by relabeling rather than a spec change), joined with `·`
  - [x] #624 (this lane's line only) — `triggerScan` checks `res.error`,
        shows a real error toast (`scanStartError`, mirrors
        `toastRescanError`'s wording) on both the checked-error and thrown
        paths; rest of #624 stays with `silent-failures`
  - [x] i18n: `pages.admin.libraryDetail.scanStartError`,
        `notifiers.scan.toastDoneSummaryCourses`,
        `notifiers.scan.toastDoneSummaryFiles`; `toastFailedSummary`
        placeholder renamed `{errors}` → `{n}`; both locales
  - [x] regression tests: scan-progress page spec (error list survives the
        running→terminal transition), notifier spec (plural index + split
        toast), page spec (silent start failure), AdminScansTable spec
        (button only on the matching row). Confirmed red before fix.
  - [x] gates: lint, stylelint, format, `check:i18n`,
        `turbo run lint test typecheck` — all green
- Status: done
- PR: https://github.com/kkucherenkov/course_shelf/pull/626 (merged)
