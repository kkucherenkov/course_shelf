# Active tasks

## T-2026-08-31-002 — override props for the hard-coded `@app/ui` strings (web half)

- Created: 2026-08-31
- Owner: claude (frontend-engineer, lane L2)
- Spec: GitHub issue #268 — web/Vue half only (Flutter `AppProgressBadge` is a separate lane)
- Goal: no `@app/ui` component renders an untranslatable literal; every web call
  site feeds it through `t()`.
- Spec diff: none (no wire contract touched)
- Codegen impact: no
- Sub-steps:
  - [x] `AppNoteEditor` — `retryLabel`
  - [x] `AppLessonRow` — `formatWatched`
  - [x] `AppSectionHeader` — `sectionLabel`, `formatLessons`, `formatDuration`
  - [x] `AppBookmark` — `formatAriaLabel`; `AppBookmarkAdd` — `saveLabel`;
        `AppBookmarkList` forwards both
  - [x] `AppPasswordField` — `strengthLabels`, `meterHint`
  - [x] stories + specs for every new prop
  - [x] locale keys in `en.ts` + `ru.ts`, call sites pass them
  - [x] lint / stylelint / format / test / typecheck / `pnpm check:i18n`
- Status: in-review
- Blockers: —

## T-2026-08-31-001 — distinguish the two unique constraints behind P2002 in PrismaCourseRepository.save

- Created: 2026-08-31
- Owner: claude
- Spec: [GH #326](https://github.com/kkucherenkov/course_shelf/issues/326)
- Goal: a section position collision surfaces as its own 409 instead of masquerading
  as a slug clash, which `run-scan.handler` skips silently.
- Spec diff: none
- Codegen impact: no
- Sub-steps:
  - [x] match `P2002.meta.target` against the two constraints the save tx writes under
  - [x] rethrow unrecognised P2002 unchanged
  - [x] cover all three branches in `prisma-course.repository.spec.ts`
- Status: in-review
- Blockers: —
