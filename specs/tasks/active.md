# Active tasks

## T-2026-09-13-e30-metadata-editor

**Card:** [E30-F03-S01](../../docs/roadmap/tasks/E30-F03-S01.md) — Course metadata editor (web)
**Branch:** `kkucherenkov/e30-metadata-editor`

Admin-only edit surface for a course's 14 `UpdateCourseRequest` fields, plus a
per-field "fill from source" panel over `scrapeCoursePreview`. No spec change
— both endpoints already exist and are unused by `apps/web`.

- [x] Commit the two new roadmap cards (this one + the Coursera scraper card)
      and the TODO.md/ROADMAP.md bookkeeping, on their own
- [ ] `useCourseEdit` composable over `getCourse` + `updateCourse`
      (partial-update payload construction)
- [ ] `useEntitySearch` + entity option fetchers (instructors/studios/tags)
- [ ] `useCourseScrapePreview` composable over `scrapeCoursePreview` +
      `listScrapers`
- [ ] `/courses/[id]/edit` page, admin middleware, entry point from the course
      detail page
- [ ] Form component covering all 14 fields, partial-update semantics
- [ ] Fill-from-source panel, per-field apply
- [ ] Locale keys (en + ru)
- [ ] Specs: composable + component
- [ ] Gates: lint, stylelint, format, test, typecheck, check:i18n
- [ ] Bookkeeping: card → Done, TODO.md tick (own row only), done.md, dnote
      changelog, GitHub issue
