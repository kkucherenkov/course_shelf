## T-2026-09-22-errors-are-not-empty — Stop rendering a failed request as an empty result

- Created: 2026-09-22
- Owner: claude
- Spec: pre-release audit run20 (`assessment-a.md` findings 1, 7, 8; `synthesis.md`
  "where A and B agree"). No card yet — coordinator files one from this PR.
- Goal: CourseShelf currently draws the same screen for "the backend failed"
  and "there is genuinely nothing here", on four independent surfaces. A user
  can't tell a broken instance from an empty one, so a broken instance never
  gets reported. Every fix below reuses the one correct pattern already in the
  codebase (`/courses/{id}`'s `AppErrorState` + retry) instead of inventing a
  new shape.
- Acceptance:
  - Lesson transcript panel shows three distinct states — has a transcript,
    genuinely has none, failed to load — sourced from `lesson.subtitles`
    (server-known) rather than from whether the browser parsed a VTT.
  - `/` and `/browse`, on a failed courses/libraries probe, show a retryable
    error instead of "no access granted".
  - Admin dashboard's "errors · 24h" tile distinguishes "no scans ran in the
    window" from a true zero, and a scan with `errorsCount > 0` no longer
    badges green "Succeeded".
  - Lesson player distinguishes "the video file is missing" from "the lesson
    failed to load", names the failing path for an admin, and never offers
    play on it.
- Spec diff: none — `LessonDto.subtitles` and `AdminScanListItem.errorsCount`
  already carry every signal needed; no wire contract changes.
- Codegen impact: no.
- Design impact: none — reuses `AppErrorState`/`AppNoPermission`/`AppButton`,
  already in `@app/ui`.
- Tests: component specs for `PlayerTranscriptTab` (3-state), `useTranscriptCues`
  (error-vs-empty), `AdminScansTable` (completed-with-errors pill), plus
  page-level assertions for `index.vue`/`browse.vue` catalog-access states and
  the lesson page's media-vs-lesson error message.
- Sub-steps:
  - [x] Transcript: `useTranscriptCues` derives `hasError` from the selected
        track's `readyState`; `PlayerTranscriptTab` takes `hasTranscript`
        (server signal) + `loadError` as props, not `cues.length`.
  - [x] `/` and `/browse`: `catalogAccessState` (`pending|granted|denied|error`)
        replaces the boolean that coerced "probe failed" into "denied".
  - [x] Admin dashboard: "no scans in window" vs "0 errors"; scan pill gets a
        client-derived "completed with errors" state.
  - [x] Lesson player: `errorMessage` distinguishes native video error from
        stream-issuance error; admin sees the failing path.
  - [x] Locale keys added under `errors.*`, `transcript.*`, `admin.dashboard.*`
        only (en+ru).
  - [x] Lint/stylelint/format, `pnpm --filter @app/web test`, `pnpm check:i18n`.
  - [x] PR opened against `main`, CI green on all five required contexts.
- Status: in-progress
- Blockers: waiting on review/merge
