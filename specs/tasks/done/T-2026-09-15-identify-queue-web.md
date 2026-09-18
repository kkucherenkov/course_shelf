## T-2026-09-15-identify-queue-web — identify-task queue surface in apps/web

- Created: 2026-09-15
- Completed: 2026-09-15
- Owner: claude
- Spec: none — `runIdentifyTask`/`listIdentifyTasks`/`getIdentifyTask`/
  `applyIdentifyResult`/`discardIdentifyTask` already in `openapi.yaml` and
  the generated client; card `E30-F03-S02` (landed via #548).
- Goal: an admin queue over identify tasks — list, open one into a per-field
  `MergePolicyDto` comparison (current course value vs scraped fragment),
  apply or discard. The only path that resolves scraped instructor/studio/tag
  names into entities (`apply-identify-result.handler.ts` upserts them); the
  existing scrape-preview panel can't (E30-F03-S01 shipped it read-only on
  purpose). Closes #546.
- Design: `useIdentifyTasks.ts` — `useIdentifyTasksList`, `useIdentifyTask`
  (bundles task + its course in one `useAsyncData` since the course id is
  only known after the task loads), `queueIdentifyTask` (plain mutation,
  mirrors `useCourseScrapePreview.run`), and `buildMergePolicy` — the one
  function that fills all 12 `MergePolicyDto` keys explicitly so an
  omitted field never silently defaults to `merge` server-side.
- Sub-steps:
  - [x] `useIdentifyTasks` composable + `buildMergePolicy` spec
  - [x] `pages/admin/identify-tasks/index.vue` queue list + `AdminIdentifyTaskRow`
  - [x] `pages/admin/identify-tasks/[id].vue` review page + `AdminIdentifyTaskReview`
  - [x] "queue for review" action in `CourseScrapePreviewPanel.vue`
  - [x] nav entry in `layouts/default.vue`
  - [x] i18n keys (en + ru), `pnpm check:i18n` green
  - [x] component/composable specs (401 web tests green)
  - [x] lint/stylelint/format/typecheck gates green
  - [x] PR `Closes #546` merged — [#552](https://github.com/kkucherenkov/course_shelf/pull/552)
  - [x] `docs/roadmap/tasks/E30-F03-S02.md` sub-steps ticked; `Status` still
        needs a follow-up flip to Done and the `docs/roadmap/TODO.md` row
        checked (tracked in `tuxedo`, not done in this pass)
- Result: [#552](https://github.com/kkucherenkov/course_shelf/pull/552)
- Blockers: — (not verified against a running Docker stack this session —
  this host's `course_shelf` compose stack was not up and default ports
  3000/5432/8080 collide with two unrelated stacks already running on it;
  verified via `pnpm --filter @app/web test`, `typecheck`, `check:i18n` and
  full CI on #552 instead)
