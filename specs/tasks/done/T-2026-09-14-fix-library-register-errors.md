## T-2026-09-14-fix-library-register-errors — library-register form must stop lying about why it failed

- Created: 2026-09-14
- Completed: 2026-09-14
- Result: https://github.com/kkucherenkov/course_shelf/pull/469
- Owner: claude (frontend-engineer)
- Spec: `packages/specs/openapi/openapi.yaml` → `RegisterLibraryRequest.rootPath` (unchanged; mirrored client-side)
- Goal: a non-absolute library path is rejected before the request, naming the
  real rule; any server failure shows the server's own RFC 9457 `detail`
  instead of a canned sentence claiming a filesystem check that no code performs.
- Spec diff: none — the client mirrors the existing `rootPath` pattern.
- Codegen impact: no
- Sub-steps:
  - [x] `app/utils/library-register.ts` — mirror of the spec's `rootPath`
        pattern + zero-width-safe normalisation + problem-detail reader
  - [x] `useLibraries.register` surfaces the problem document (`registerErrorDetail`)
  - [x] four call sites stop discarding it: `pages/libraries.vue`,
        `components/admin/AdminAddLibrarySheet.vue`, `pages/sign-up.vue`
  - [x] locale keys (`en` + `ru`): drop the "path exists on the server" claim,
        add the absolute-path message
  - [x] specs: util, `useLibraries`, `AdminAddLibrarySheet`, `sign-up`
- Status: done
- Blockers: —
