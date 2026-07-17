# Active tasks

## T-2026-07-18-003 — E18-F01-S02 · Mobile Browse tab (Flutter)

- Created: 2026-07-18
- Owner: claude
- Spec: [E18-F01-S02](../../docs/roadmap/tasks/E18-F01-S02.md) · design `docs/design/cs-mobile-browse/`
- Goal: Browse tab — poster grid (2-col / 3-col tablet), filter+sort bottom sheet
  (status · library · sort — API-backed only), empty/loading/error states.
- Spec diff: none · Codegen impact: no (consumes existing `GET /courses` + `GET /libraries`)
- Sub-steps:
  - [x] design pre-step: hand-authored `cs-mobile-browse/app.jsx`, verified render (OD MCP down)
  - [x] BrowseCubit + repo (GET /courses filter/sort + GET /libraries) ✅
  - [x] BrowseTabBody: grid + filter bottom sheet + states; posters → course route ✅
  - [x] i18n + tests · flutter analyze + test green ✅ (analyze clean; full suite 247/247; i18n 4×242)
- Status: ✅ implemented, awaiting batch commit
- Blockers: — (filters single-select per single-value API; posters navigate to E18-F01-S03 course route)

## T-2026-07-18-002 — E18-F01-S03 · Mobile Course detail (spec-first)

- Created: 2026-07-18
- Owner: claude
- Spec: [E18-F01-S03](../../docs/roadmap/tasks/E18-F01-S03.md) · design `docs/design/cs-mobile-course-detail/`
- Goal: Flutter course-detail screen — collapsing hero, Resume/Start + Download-course
  CTA (size estimate), curriculum with per-lesson watch + download state, tap-to-download.
- Spec diff: **yes** — add `GET /courses/{id}/download-estimate` → `CourseDownloadEstimateDto`
  `{courseId, totalBytes, lessonCount}` (sums `Lesson.sizeBytes` over the accessible course).
  Outline endpoint already covers hero/progress/curriculum/lesson-state.
- Codegen impact: **yes** (regen ts + dart types; mobile still hand-writes Dio)
- Sub-steps:
  - [x] spec: add download-estimate route + DTO (spec-writer) → validate/bundle/codegen ✅ (v0.18.0; ts+dart regen; fixed root-owned specs/dist via container chown)
  - [x] backend: GetCourseDownloadEstimate query/handler/controller + spec (backend-engineer) ✅ 4/4 tests, typecheck clean
  - [x] mobile: CourseDetailCubit + screen consuming outline + estimate ✅ (loading/loaded/noAccess/failed; collapsing hero; CTA derivation; Search course-rows wired to the new route)
  - [x] tap-to-download wires to DownloadsBloc if present, else documented seam ✅ → E19 seam (DownloadsBloc absent): download CTA shows real size, taps to comingSoon+TODO(E19); per-lesson downloadState null+TODO(E19)
  - [x] backend test green · flutter analyze + test green ✅ (backend 4/4; mobile analyze clean, 227/227; i18n parity 4×219)
- Status: ✅ implemented, awaiting batch commit — ⚠️ download ACTIONS deferred to E19 (screen + spec + estimate all real)
- Blockers: — (download-action half gated on E19 DownloadsBloc; rendered as labelled seams, not fabricated states)

## T-2026-07-18-001 — E18-F03-S02 · Mobile Search + Settings tabs (Flutter) — ✅ implemented, awaiting batch commit

- Created: 2026-07-18
- Owner: claude
- Spec: [E18-F03-S02](../../docs/roadmap/tasks/E18-F03-S02.md) · design `docs/design/cs-mobile-search-settings/`
- Goal: Flutter Search tab (recent / grouped Courses+Lessons results / no-results) +
  Settings tab (Profile, Appearance, Playback, Account + destructive sign-out).
- Spec diff: none · Codegen impact: no (API green: `/search`, `/me`, `/me/sign-out-others`)
- Sub-steps:
  - [x] study existing mobile feature patterns + design bundle + API contract
  - [x] SearchCubit + SettingsCubit
  - [x] Search + Settings screens (wired into the 5-tab shell)
  - [x] i18n keys + widget/bloc tests
  - [x] flutter analyze + test green
- Status: in-progress
- Blockers: — (mobile scaffold debt: hand-written Dio, prefix-less paths — see memory)
- Next in queue: E18-F01-S03 (course detail, spec-first) → E18-F01-S02 (browse)
