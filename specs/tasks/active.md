# Active tasks

## T-2026-04-27-057 — Course detail page · web half (E14-F01-S03 Stage A)

- Created: 2026-04-27
- Owner: claude
- Spec: `docs/roadmap/tasks/E14-F01-S03.md`
- Goal: implement the web page for the Course detail (E14-F01-S03 Stage A). Backend is complete; SDK has `getCourseOutline`, `markCourseComplete`, `resetCourseProgress`.
- Sub-steps:
  - [x] Push active.md entry
  - [x] `apps/web/app/utils/course-accent.ts` — extract `accentFromId` from index.vue
  - [x] `apps/web/app/composables/useCourseOutline.ts`
  - [x] `apps/web/app/components/course-detail/CourseHero.vue`
  - [x] `apps/web/app/components/course-detail/CourseActions.vue`
  - [x] `apps/web/app/components/course-detail/CourseSectionsList.vue`
  - [x] `apps/web/app/components/course-detail/CourseMaterialsRail.vue`
  - [x] `apps/web/app/components/course-detail/CourseCompletedBanner.vue`
  - [x] `apps/web/app/pages/courses/[id].vue`
  - [x] i18n keys in en.ts + ru.ts
  - [x] `tests/e2e/course-detail.spec.ts`
  - [x] Lint + typecheck + test
- Status: done (awaiting commit + PR)
- Blockers: —

## T-2026-04-28-056 — Course detail · spec + backend half (E14-F01-S03 part 1 of 2)

- Created: 2026-04-28
- Owner: claude
- Spec: `docs/roadmap/tasks/E14-F01-S03.md`
- Goal: ship the API and backend halves of the Course detail card so the web page can land in a separate PR. The existing `GET /courses/{id}` returns sections without lessons; the page needs the outline (sections + lessons + per-lesson progress) and two action endpoints.
- Acceptance:
  - `GET /api/v1/courses/{id}/outline` — full outline for the page. Response: course summary (id, title, description, instructor?, accent, totalDurationSeconds, lessonCount, progress) + sections (each with id, position, title, lessons, totalDurationSeconds) + lessons (lightweight: id, position, title, durationSeconds, hasMaterials, current?, progress: { percent, completed }) + course-level `materials[]` aggregated across lessons. `librarySlug` included for breadcrumbs. Reads `Course` + `Section` + `Lesson` + `Material` + `LessonProgress` (filtered to the requester) + `CourseProgressReadModel` for the aggregate progress percent.
  - `POST /api/v1/courses/{id}/mark-complete` — marks every lesson in the course as `completed: true` for the requester. Idempotent. Returns the updated `CourseOutlineDto` for cheap UI refresh.
  - `POST /api/v1/courses/{id}/reset-progress` — clears every `LessonProgress` row for (requester, course). Idempotent. Returns the updated `CourseOutlineDto`.
  - All three: `bearerAuth`, RFC 9457 problem responses on 401/403/404, `AuthorizationService.canSee` filter.
  - Backend: queries + handlers wired into the existing catalog module, ports/adapters extended (or new ones added) reading from existing repos via injected ports. No `PrismaService` import in application/domain.
  - Spec validates, regenerates clean, generated client + DTO surfaces include the new methods.
- Spec diff: yes — `GET /courses/{id}/outline` + `POST /courses/{id}/{mark-complete,reset-progress}` + new `CourseOutlineDto`, `SectionOutline`, `LessonOutlineItem`, `CourseMaterialItem` schemas.
- Codegen impact: yes — re-emit `@app/api-client-ts`, `@app/api-client-dart`, server DTO surface.
- Design impact: none.
- Tests: vitest unit specs for each handler covering happy path, empty outline, mark-complete idempotency, reset-progress idempotency, 403 on missing grant. Plus adapter specs for any new repo methods.
- Sub-steps:
  - [x] Push active.md entry
  - [x] Edit `packages/specs/openapi/openapi.yaml` — add 3 endpoints + schemas
  - [x] Run `pnpm spec:validate && pnpm spec:bundle && pnpm spec:codegen`
  - [x] Stage codegen as its own commit
  - [x] Implement `GetCourseOutlineHandler`, `MarkCourseCompleteHandler`, `ResetCourseProgressHandler` + controller routes
  - [x] Repo extensions where needed (LessonRepository for course-wide lookups; LessonProgressRepository for bulk upsert + delete-by-course)
  - [x] Backend unit tests
  - [x] Lint + typecheck + tests
  - [ ] Commit + push + open PR (`Refs #61`; the second PR carries `Closes #61`)
- Status: in-progress
- Blockers: —
