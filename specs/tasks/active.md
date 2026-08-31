# Active tasks

## T-2026-08-31-003 — backend e2e layer + authenticated contract test

- Created: 2026-08-31
- Owner: claude (lane L1 — backend-e2e-auth-contract)
- Spec: GitHub #266, #321 — PR https://github.com/kkucherenkov/course_shelf/pull/433
- Goal: the backend gains a real supertest-driven e2e layer, and
  `pnpm spec:contract-test` finally exercises the 62 authenticated
  operations it has always skipped.
- Spec diff: none (openapi.yaml is owned by another lane)
- Codegen impact: no
- Sub-steps:
  - [x] extract the bootstrap wiring out of `main.ts` so tests boot the same app
  - [x] `apps/backend/test/**` e2e suite: Better Auth round-trip, SessionGuard
        401, openapi-validator 400 problem+json, secure headers
  - [x] make `*.e2e-spec.ts` actually run (vitest excluded the one glob the
        handbook names)
  - [x] fix the two `AuthModule` middlewares the new suite caught: both were
        mounted at `/api/api/v1/auth/…` and had never run, so sign-in was
        unlimited and `AUTH_SELF_REGISTRATION=false` was cosmetic (#283's hole)
  - [x] `contract-test.ts` forwards a bearer token to schemathesis, and
        `turbo.json` lets the variable actually reach it
  - [x] `e2e.yml` mints that token against the running stack, before anything
        else can claim the first-user-is-ADMIN slot
  - [x] triage the first authenticated run — 13/75 → 69/75 operations
        authenticated; three real 500s fixed (bigint `OFFSET` overflow, a
        missing optional body, NUL bytes anywhere in a payload or URL)
- Status: in-progress — the code is complete; the `E2E smoke` gate stays red on
  spec drift this lane may not touch.
- Blockers: the remaining contract-test findings all need
  `packages/specs/openapi/openapi.yaml` (`minProperties: 1` on three PATCH
  bodies, `dependentRequired` on the rating pair, `maximum` on `offset`,
  `minLength: 1` on the course grant target, documenting 422 and 404 on four
  operations, and a decision on how the spec expresses "no NUL bytes").
  Tracked as `tuxedo` 26–29; details in the PR body.

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
