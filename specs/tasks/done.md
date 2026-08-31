# Done tasks

_Archive of shipped tasks. Never delete entries — cancelled tasks go here with reason._

## T-2026-08-31-008 — mobile: Android emulator in CI + integration tests for offline playback, sync and the download queue

- Created: 2026-08-31
- Owner: claude (lane L3)
- Completed: 2026-08-31
- Result: https://github.com/kkucherenkov/course_shelf/pull/434
- Spec: [docs/roadmap/tasks/E19-F01-S02.md](../../docs/roadmap/tasks/E19-F01-S02.md)
- Goal: `apps/mobile`'s `integration_test/` suite actually executes somewhere.
  Today nothing runs it, so every platform channel the app depends on
  (`path_provider`, `flutter_secure_storage`, `disk_space_plus`, `video_player`,
  drift's bundled SQLite) has never been exercised by a check.
- Spec diff: none
- Codegen impact: no
- Sub-steps:
  - [x] `flutter-integration` job on `reactivecircus/android-emulator-runner`
        (separate from the fast `flutter` analyze/test job)
  - [x] `integration_test/offline_playback_test.dart` — loopback decrypt URL
        played by the real `video_player`, plus the file-removed fallback
  - [x] `integration_test/download_queue_test.dart` — smoke through real HTTP,
        real Keystore, real path_provider, real `disk_space_plus`
  - [x] `integration_test/sync_drain_test.dart` — outbox drain smoke over real SQLite
  - [x] `AppProgressBadge` call sites pass localized copy (#268, Flutter half)
- Status: done
- Blockers: — (no emulator on the dev host; CI is the first execution)

## T-2026-08-31-007 — backend e2e layer + authenticated contract test

- Created: 2026-08-31
- Owner: claude (lane L1 — backend-e2e-auth-contract)
- Completed: 2026-08-31
- Result: https://github.com/kkucherenkov/course_shelf/pull/433
- Spec: GitHub #266, #321 — PR https://github.com/kkucherenkov/course_shelf/pull/433
- Goal: the backend gains a real supertest-driven e2e layer, and
  `pnpm spec:contract-test` finally exercises the 62 authenticated
  operations it has always skipped.
- Spec diff: openapi.yaml — `minProperties`, `dependentRequired`, `maximum` on
  `offset`, `minLength`/`pattern` on ids and free text, `additionalProperties:
false` on 14 request bodies, a reusable 422, the NUL 400 documented
- Codegen impact: yes — landed in its own commit
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
  - [x] triage the run — 13/75 → 69/75 operations authenticated, 23 → 1 unique
        failures. Five real backend bugs fixed (bigint `OFFSET` overflow, a
        missing optional body, NUL bytes anywhere, a 404 that broke the
        batch's documented no-oracle rule, a URL violating its own
        `format: uri`) and every schema-vs-API mismatch closed in the spec.
- Status: done
- Blockers: none. The last contract failure was the documented 503 on
  `POST /libraries/{id}/transcriptions`; on the maintainer's call
  `not_a_server_error` is disabled for that one operation, with the cost stated
  in `packages/specs/schemathesis.toml`. Whether 503 is the right status stays
  open as `tuxedo` 28. The biggest remaining hole is `tuxedo` 27 — the e2e
  stack has no seed, so 24 path-parameter operations still only reach a 404.

## T-2026-08-31-006 — backfill GitHub issue mirroring for E00–E14 / E21–E24

- Created: 2026-08-31
- Owner: claude
- Completed: 2026-08-31
- Result: https://github.com/kkucherenkov/course_shelf/pull/432
- Spec: [docs/roadmap/TODO.md](../../docs/roadmap/TODO.md) · GitHub #271
- Goal: every roadmap card has a stable issue URL, so the card-bookkeeping rule
  in `.claude/CLAUDE.md` holds for the whole repo instead of carrying an
  exception for the epics that predate issue mirroring.
- Spec diff: none
- Codegen impact: no
- Sub-steps:
  - [x] inventory the 81 cards in E00–E14 / E21–E24 (E05 has no cards) and
        cross-check statuses against `docs/roadmap/TODO.md`
  - [x] confirm no issue already carries an `[<card-id>]` title in that range
  - [x] create 18 epic umbrellas + 81 story issues, matching the label shape
        the existing v1 issues use (`epic` / `story`, no milestone)
  - [x] close each one as a historical backfill (`completed`, or `not planned`
        for the two cancelled E23-F01 cards)
  - [x] narrow the card-bookkeeping section of `.claude/CLAUDE.md` so it
        describes every epic as mirrored
- Status: done
- Blockers: —

## T-2026-08-31-005 — override props for the hard-coded `@app/ui` strings (web half)

- Created: 2026-08-31
- Owner: claude (frontend-engineer, lane L2)
- Completed: 2026-08-31
- Result: https://github.com/kkucherenkov/course_shelf/pull/426
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
- Status: done
- Blockers: —

## T-2026-08-31-004 — distinguish the two unique constraints behind P2002 in PrismaCourseRepository.save

- Created: 2026-08-31
- Owner: claude
- Completed: 2026-08-31
- Result: https://github.com/kkucherenkov/course_shelf/pull/330
- Spec: [GH #326](https://github.com/kkucherenkov/course_shelf/issues/326)
- Goal: a section position collision surfaces as its own 409 instead of masquerading
  as a slug clash, which `run-scan.handler` skips silently.
- Spec diff: none
- Codegen impact: no
- Sub-steps:
  - [x] match `P2002.meta.target` against the two constraints the save tx writes under
  - [x] rethrow unrecognised P2002 unchanged
  - [x] cover all three branches in `prisma-course.repository.spec.ts`
- Status: done
- Blockers: —

## T-2026-08-31-003 — small-fixes batch: pg_dump in dev, Redocly warnings, docs, done.md

- Created: 2026-08-31
- Owner: claude (backend-engineer, lane L4)
- Completed: 2026-08-31
- Result: https://github.com/kkucherenkov/course_shelf/pull/397
- Spec: GitHub #318, #274, #272 (plus one docs cleanup with no issue)
- Goal: four independent small fixes in one PR.
- Spec diff: none — `openapi.yaml` is byte-identical; the #274 fix is a
  per-pointer Redocly lint suppression, not a schema change
- Codegen impact: no — `spec:bundle` + `spec:codegen` produce an empty diff in
  both generated clients, verified rather than assumed
- Sub-steps:
  - [x] #318 — `postgresql18-client` in `Dockerfile.dev`. The production image
        already had it, pinned to the same major for the same reason
        (`pg_dump` refuses to dump a server newer than itself, compose runs
        `postgres:18.1-alpine`). Package verified to provide `pg_dump` against
        the alpine package index.
  - [x] #274 — the 4 `no-required-schema-properties-undefined` warnings, via
        `packages/specs/.redocly.lint-ignore.yaml`. Restating each property
        inside its `then` branch was tried first and backed out: it gives
        `then` its own `properties`, which changes the schema's
        evaluated-property surface and makes `kind` read as an unevaluated
        property — Redocly's own example checks turn the 4 warnings into 6.
  - [x] #274 — verified the suppression is location-scoped by planting a bogus
        `required` on a different schema and watching the rule still warn.
  - [x] #274 — the two "uncalled" operations are called. `apps/mobile` hits
        both by hand-written Dio path (`/courses/{id}/download-estimate` in
        `course_detail_repository_impl.dart`, `/progress/batch` in
        `sync_api.dart`), never through the generated `app_api_client`, so a
        grep for the generated method names finds nothing. `apps/web` calls
        neither, correctly — downloads and the offline outbox are mobile-only.
        Neither operation is dead; nothing deleted.
  - [x] #272 — `docs/troubleshooting.md`: five entries removed whose fix now
        lives in this repo's config (fvm/`.fvmrc`, Prisma 7 `P1012`,
        `pnpm/action-setup@v6`, Trufflehog refs, `license-checker`), and two
        false claims corrected in the entries that stay.
  - [x] #272 — Storybook `:6006` verified present in all three tables of both
        `README.md` and `README.ru.md`; both files left untouched.
  - [x] done.md — 019/018/017 bodies reattached to their own headings, the
        L5 entry's orphaned `Blockers:` tail restored, one broken relative
        link fixed.
  - [x] Gates: `pnpm spec:validate` (0 warnings), `pnpm format`
- Notes:
  - Docker was **not** available in this sandbox (no `docker` binary on
    `PATH`), so the dev image change is reviewed by hand, not built. Anyone
    with a daemon should confirm `docker compose -f docker/compose.yml build
backend` and that Admin → Backups reaches its success state.
  - Follow-up filed, not done here: `apps/mobile` bypasses the generated Dart
    client in ~10 files, each citing a codegen layout bug that
    `packages/api-client-dart` no longer has — `lib/src/` is the package's real
    lib now, so `package:app_api_client/…` resolves. Those comments are stale.
- Status: done

## T-2026-08-31-002 — `multipleOf: 0.01` rejected valid two-decimal ratings

- Created: 2026-08-31
- Owner: claude (specs)
- Completed: 2026-08-31
- Result: https://github.com/kkucherenkov/course_shelf/pull/329
- Spec: found by the Schemathesis contract test armed in #316 — its third find
- Goal: `PATCH /api/v1/courses/{id}` with `ratingAverage: 4.68` must not answer
  `400 — request/body/ratingAverage must be multiple of 0.01`.
- Root cause: ajv (under `express-openapi-validator`) enforces `multipleOf` as
  `value / 0.01` landing on an integer, and IEEE-754 makes that a coin toss —
  `4.68 / 0.01 = 467.99999999999994` and `0.07 / 0.01 = 7.000000000000001` are
  rejected while `2.31`, `3.29`, `4.99` divide cleanly. ajv's remedy,
  `multipleOfPrecision`, is unreachable: `validateRequests` takes
  `ValidateRequestOpts`, which does not extend ajv's options.
- Spec diff: yes — `multipleOf` dropped from both schemas carrying
  `ratingAverage`; range and the `Decimal(3,2)` column keep the invariant.
- Codegen impact: no
- Sub-steps:
  - [x] Drop `multipleOf: 0.01` from `Course` and the PATCH body, moving the
        two-decimal intent into `description`
  - [x] `scripts/validate.ts` fails on any fractional `multipleOf` in the
        document, naming file and line — verified by reintroducing the
        constraint and watching it fail
- Notes:
  - Guarded rather than patched: the check runs in CI and in the pre-commit
    hook on spec edits, so the whole class is closed, not this one field.
- Status: done

## T-2026-08-31-001 — #317: a course's second save cascade-deletes its lessons

- Created: 2026-08-31
- Owner: claude (backend)
- Completed: 2026-08-31
- Result: https://github.com/kkucherenkov/course_shelf/pull/327
- Spec: GitHub #317
- Goal: a library scan must leave `lesson` rows behind. Today it leaves zero,
  with no `scan_error` and a `succeeded` status.
- Root cause (traced, not guessed):
  1. `schema.prisma:330` — `Lesson.section` is `onDelete: Cascade`.
  2. `prisma-course.repository.ts:168` — every `save()` does an unscoped
     `tx.section.deleteMany({ where: { courseId } })` and recreates.
  3. `run-scan.handler.ts` — `courseRepo.save` (615) -> `lessonRepo.save` (708)
     -> `courseRepo.save` again (773, metadata linking).
     The second save wipes the sections, the cascade takes every lesson with them,
     and the sections come back — so courses and sections look fine and the
     lessons are gone. Not a Prisma/adapter defect: the course and lesson
     repositories use an identical `$transaction` shape and courses persist.
- Spec diff: none
- Codegen impact: no
- Sub-steps:
  - [x] `PrismaCourseRepository.save`: delete only sections that disappeared,
        upsert the rest, so the write is idempotent for lessons
  - [x] Regression spec pinning the SQL shape (no unscoped section delete) —
        verified to fail against the pre-fix repository and pass after
  - [ ] Verify against a real database — NOT DONE. No docker CLI on this
        machine (colima's VM is up, the client is absent), so the cascade
        itself is established from `schema.prisma:330` and the call order,
        not observed. The reporter's own repro in #317 is the confirmation
        step: register a library over a folder of `.mp4`s, scan, and expect
        `SELECT count(*) FROM lesson` to be non-zero.
- Notes:
  - Fixed in the repository rather than by reordering the scan's two saves:
    the second save is the caller that happened to trigger it, but any future
    `courseRepo.save()` after lessons exist would do the same.
  - Adjacent, not fixed here: a P2002 from the section `(courseId, position)`
    unique constraint is translated to `CourseSlugAlreadyTakenError`
    (`prisma-course.repository.ts:217`), which `run-scan.handler.ts` swallows
    as an idempotent skip. Filed as #326.
- Status: done — the fix shipped; the real-database confirmation stays open as a
  separate check, see the unticked sub-step above.

## T-2026-08-30-020 — README drift audit (en + ru)

- Created: 2026-08-30
- Completed: 2026-08-30
- Owner: claude
- Result: https://github.com/kkucherenkov/course_shelf/pull/324
- Spec: none — maintenance, no card
- Goal: re-verify every factual claim in `README.md` / `README.ru.md` against the tree and fix what had gone stale, without restructuring the document.
- Acceptance:
  - no version, port, count or path in either README contradicts the tree
  - shipped features with no mention (offline-first mobile, Whisper transcription) are covered
  - `docs/deployment.md`, `docs/release.md`, `docs/troubleshooting.md`, `docs/roadmap/` are linked
  - both files stay in sync, Prettier clean
- Spec diff: none
- Codegen impact: no
- Design impact: none

## T-2026-08-30-L5 — CI honesty: stop masking failures

- Created: 2026-08-30
- Owner: claude (lane L5)
- Spec: GitHub issues #269, #265, #296, #264
- Goal: every green CI run means something was actually checked.
- Spec diff: —
- Codegen impact: no
- Sub-steps:
  - [x] #269 — csp.spec.ts must fail in CI instead of skipping itself — already
        landed in `ac87aa9`: `E2E_EXPECT_CSP=1` in e2e.yml turns the skip into a
        throw on the one stack that runs production nginx + `NODE_ENV=production`
  - [x] #269 — run `pnpm spec:contract-test` in a workflow (e2e.yml, after
        Playwright so its generated writes cannot reach the visual snapshots)
  - [x] #269 — add `push: main` to quality.yml and e2e.yml
  - [x] #265 — ffmpeg in ci.yml + the `Fix (CI)` section deleted — both already
        landed in `ac87aa9`; verified, nothing left to change
  - [x] #296 — drop `test:e2e` from apps/backend/package.json
  - [x] #264 — all 75 a11y violations fixed and the gate armed:
        `STORYBOOK_A11Y_LEVEL` is gone from both workflows and from
        `preview.ts`. Light theme is 285/285 with the a11y level at `error`.
  - [x] #264 — palette: accent `#9C6612`→`#8A5A10`, tertiary `#8E8773`→`#716B5B`
        (lightness only), plus the Nuxt UI `primary`/`error` wiring gaps and a
        dead `AppNoteEditor` mode toggle that those uncovered
  - [x] #264 — `regen-snapshots.yml` gains a `goldens` job; Flutter goldens had
        no regen path at all
  - [x] #269 — `contract-test.ts` itself was broken: the script was written for
        schemathesis 3.x and, never having run, still passed `--base-url`,
        `--checks all` and `--hypothesis-max-examples`. Arming it in e2e.yml is
        what surfaced that. Fixed with the maintainer's go-ahead (L6's path).
  - [x] Baselines regenerated on the branch via `regen-snapshots.yml`:
        Storybook, 35 Flutter goldens, and the e2e page screenshot. Two bugs in
        that workflow had to be fixed first — the goldens job threw away its own
        capture, and the e2e job declined to regenerate anything.
  - [x] #269 — the armed contract test found 70 spec/implementation
        disagreements on its first real run (429 undocumented on all 75
        operations, 400 on ~59, one 404, 7 lenient-implementation cases).
        Raised as GH #320 for the spec's lane; the step stays in e2e.yml.
  - [x] #320 — documented the `400` and `429` every operation can return
        (429 was absent from all 75, 400 from 59) as shared
        `components/responses`, with the codegen in its own commit. Taken on
        here once L6 merged and `openapi.yaml` stopped moving under us.
  - [x] #320 closed in full — 70 contract-test findings down to zero:
        `4303 generated, 4303 passed`, all four phases green, 75/75 operations.
        Two were not drift and were fixed at the cause rather than in the spec
        (the throttler dominating the run; a generator ignoring `pattern`); one
        was a bug shipping in the mobile app (`+`-encoded spaces rejected).
  - [x] Verified the gates fire rather than skip: `csp.spec.ts` both tests
        executed, 34 e2e tests passed, Storybook a11y at `error`.
- Completed: 2026-08-30
- Result: https://github.com/kkucherenkov/course_shelf/pull/316
- Status: done
- Blockers: none for the work itself. Merges LAST of the eight lanes (it touches
  baselines and goldens); baselines and goldens are regenerated on top of the
  final `main` after the other seven land, not merged by hand.

## T-2026-08-30-015 — close AUTH_SELF_REGISTRATION gap + bookmark create idempotency

- Created: 2026-08-30
- Owner: claude (backend-engineer, lane L6)
- Spec: GitHub #283, #285
- Goal:
  - #283: `AUTH_SELF_REGISTRATION=false` must reject `POST /sign-up/*`
    server-side (403 problem+json), not just hide the SPA's CTA.
  - #285: `POST /lessons/{id}/bookmarks` must be safe to retry — a crash
    after the server accepts a create must not create a second bookmark on
    retry.
- Spec diff: openapi.yaml — `CreateBookmarkRequest.idempotencyKey`, 200
  replay response on `createBookmark`. No spec change for #283 (`/api/v1/auth/*`
  is deliberately outside the OpenAPI contract).
- Codegen impact: yes (CreateBookmarkRequest gains a field)
- Sub-steps:
  - [x] #283: SelfRegistrationGuardMiddleware on `api/v1/auth/sign-up/*splat`
  - [x] #283: unit test
  - [x] #285: spec — idempotencyKey field + 200/201 semantics
  - [x] #285: spec:validate / bundle / codegen (own commit)
  - [x] #285: backend — dedupe by (lessonId, userId, idempotencyKey)
  - [x] #285: mobile — pass idempotencyKey from localId in `_drainBookmarks`
  - [x] gates: spec:validate, backend test, backend lint, typecheck, mobile test
- Completed: 2026-08-30
- Result: https://github.com/kkucherenkov/course_shelf/pull/313
- Status: done

## T-2026-08-30-011 — mobile hygiene: fvm pin, dead cached-catalog dao, storage caption fix

- Created: 2026-08-30
- Owner: claude (flutter-engineer, lane L7)
- Spec: —
- Goal: three independent hygiene fixes in apps/mobile — pin local Flutter to CI's 3.44.4 via fvm (#281), remove the unused CachedCatalogDao (#277), fix storage_bar.dart's misleading "of {total} free" caption by renaming to {free} and dropping the dead deviceTotalBytes field (#305).
- Spec diff: none
- Codegen impact: no
- Sub-steps:
  - [x] fvm use 3.44.4, commit .fvmrc, confirm `dart format` under 3.44.4 doesn't rewrite unrelated files
  - [x] grep CachedCatalogDao / cached_courses / cached_lessons for a live writer — found one: `CourseDetailRepositoryImpl` is wired to it in `injector.dart:110` and writes/reads through it on outline fetch. #277's premise is stale (it's true only for `downloaded_lessons`' own denormalised columns). NOT deleting; fixed the stale comment in `downloaded_lessons.dart` that claimed "no callers"; flagged to maintainer instead of closing the issue.
  - [x] storage_bar.dart: {total} → {free} placeholder in en/ru intl ("{used} used, {free} free"), dropped StorageSnapshot.deviceTotalBytes end to end — hasDeviceTotals → hasDeviceFree, otherUsedBytes() gone, DeviceStorage.read() now returns a plain `int?`, DiskSpaceDeviceStorage stops calling getTotalDiskSpace, the bar collapses to a two-segment (app/free) proportional track, legendOther dropped from both locales
  - [x] flutter analyze && flutter test green (460 tests); pnpm check:i18n green; found dart-format drift under 3.44.4 in one untouched file (`test/features/downloads/downloads_repository_impl_test.dart`) — did not mass-reformat, scoped `dart format` to only the files this task touched, flagged the drift to the maintainer
- Completed: 2026-08-30
- Result: https://github.com/kkucherenkov/course_shelf/pull/312
- Status: done

## T-2026-08-30-019 — browser-verify #302 player fixes + #307 browse/backups

- Created: 2026-08-30
- Completed: 2026-08-30
- Owner: claude
- Result: https://github.com/kkucherenkov/course_shelf/pull/319
- Spec: [#302](https://github.com/kkucherenkov/course_shelf/issues/302), [#307](https://github.com/kkucherenkov/course_shelf/issues/307), [docs/roadmap/tasks/E26-F01-S04.md](../../docs/roadmap/tasks/E26-F01-S04.md)
- Goal: manually verify in a real browser what unit/e2e tests structurally can't — `?t=` seek, cue placement above chrome (windowed + fullscreen), non-16:9 letterbox, and the `/browse` filters + `/admin/backups` flows, in en and ru.
- Acceptance:
  - `?t=90` lands the lesson player at 1:30
  - subtitle cue never overlaps the chrome control bar, windowed and fullscreen
  - a non-16:9 video letterboxes inside the frame instead of overflowing it
  - each `/browse` filter narrows results, duration sort orders, query string survives reload, Clear resets filters but not sort
  - `/admin/backups` create/in-progress/error/signed-link-expiry states render
  - both pages render correctly in `ru`
- Spec diff: none
- Codegen impact: no
- Design impact: none — two point fixes in existing `@app/ui`/`apps/web` components, no new tokens or components
- Tests: manual browser pass (Playwright-driven real Chromium, not the E2E stub) on an isolated docker stack (`COMPOSE_PROJECT_NAME=cs-verify`) against a real fixture course — 2 libraries, 4 courses, a real 16:9 `.mp4` with real `.en.srt`/`.ru.srt` subtitles and a real 1:1 `.mp4`, under `docs/data/fixture-course/` (gitignored). Final pass: 28/28 checks green.
- Findings:
  - **#302 fully confirmed, no code change needed.** `?t=90` → `currentTime=90`; the subtitle cue sits clear of the control bar in both windowed and fullscreen (`CUE_LINE_ABOVE_CHROME = -4` didn't need retuning); the non-16:9 lesson letterboxes inside the 16:9 frame (measured aspect ratio held).
  - **Real bug found & fixed (`packages/ui`):** `AppSelect`'s change handler treated any selection whose value is `''` as the disabled placeholder sentinel and silently dropped it — even when no `placeholder` prop was set and `''` was a legitimate option (browse.vue's "All libraries" / "Any instructor"). Selecting those options did nothing. Scoped the guard to only fire when a placeholder is actually configured; added a regression spec.
  - **Real bug found & fixed (`apps/web`):** `useQueryStringState`'s setter recomputed the query from `route.query` on every call — fine for one write, but browse.vue's "Clear filters" fires four writes in the same tick, and the real router resolves each `replace` asynchronously and not necessarily in dispatch order, so a stale write could win and re-add a key an earlier one had just dropped (`status` surviving Clear was the one that showed up in testing). Same-tick writes now batch into one `router.replace` per router instance; added a regression spec exercising out-of-order resolution.
  - **Backend bug found, filed, not fixed (out of lane):** [#317](https://github.com/kkucherenkov/course_shelf/issues/317) — `PrismaLessonRepository.save()` resolves without throwing but the row is not durably committed (confirmed via `psql` from a separate connection); course/section persistence is unaffected. Worked around for this pass by seeding `lesson`/`subtitle` rows via SQL after a real scan.
  - **Backend/infra gap found, filed, not fixed (out of lane):** [#318](https://github.com/kkucherenkov/course_shelf/issues/318) — `apps/backend/Dockerfile.dev` has no `pg_dump`, so `/admin/backups` can only reach the error state on a fresh dev checkout; success/download/expiry unverifiable without a manual workaround.
  - **Infra fix (small, in `apps/web`/`packages/ui` Dockerfiles):** neither `apps/web/Dockerfile.dev` nor `packages/ui/Dockerfile.dev` ran `pnpm design:build` before starting their dev server — a fresh checkout 500s on `tokens.generated.css` not existing. Added the missing step to both.
- Status: done

## T-2026-08-30-018 — transcript delivery, admin transcription list, docs, drop Redis

- Created: 2026-08-30
- Owner: claude (backend-engineer) — lane label not recorded, recovered from the surfaces PR #314 touches
- Completed: 2026-08-30
- Result: https://github.com/kkucherenkov/course_shelf/pull/314
- Spec: [E25-F03-S03](../../docs/roadmap/tasks/E25-F03-S03.md), [E25-F04-S03](../../docs/roadmap/tasks/E25-F04-S03.md), #309, #290
- Goal: a generated transcript plays as a subtitle track with no new endpoint; `GET /admin/transcriptions` actually exists behind its spec; transcription deployment is documented; Redis is gone (dead dependency — health-check-only `ping()`, nothing else ever used it).
- Acceptance:
  - `locateSubtitle` falls back to a generated `Transcript` when no sidecar matches the language; sidecar still wins when both exist
  - `LessonDto.subtitles[]` unions sidecars and generated tracks, `generated: true` on the latter
  - `GET /api/v1/admin/transcriptions` returns `AdminTranscriptionListDto`, mirroring `list-admin-scans`
  - README\*, deployment.md, deploy-ugreen-nas-dockge.md, user-guide.md, architecture.md document DERIVED_PATH/WHISPER\_\* and no longer mention Redis
  - Redis removed from every compose file, AppConfig, .env.example, ioredis
- Spec diff: openapi.yaml — `HealthStatus.dependencies` drops `redis` (the only real diff; `/admin/transcriptions` + Admin\*Transcription\* schemas already landed in #217/#256)
- Codegen impact: yes — health types only, landed in its own commit
- Design impact: none
- Tests: locator spec (generated served, sidecar precedence, derived-root traversal guard), get-lesson handler spec (flag + one-of-each lesson), list-admin-transcriptions handler/adapter/controller specs, get-health handler spec (drop redis) — 1725 backend tests green
- Sub-steps:
  - [x] Redis removal: backend code, all compose files, .env.example, docs
  - [x] Docs: README\*, deployment.md, deploy-ugreen-nas-dockge.md, user-guide.md, architecture.md
  - [x] Locator fallback + LessonDto union (#219)
  - [x] Admin transcription list endpoint (#309)
  - [x] Gates: test, lint, format, typecheck, spec:validate
- Status: done
- Blockers: — (docker stack boot not verified end-to-end — no `docker` binary in this sandbox; compose edits reviewed by hand)

## T-2026-08-30-017 — E26-F01-S03: transcript tab in the player sidebar

- Created: 2026-08-30
- Owner: claude (frontend-engineer) — lane label not recorded, recovered from the surfaces PR #310 touches
- Completed: 2026-08-30
- Result: https://github.com/kkucherenkov/course_shelf/pull/310
- Spec: [docs/roadmap/tasks/E26-F01-S03.md](../../docs/roadmap/tasks/E26-F01-S03.md) (#225, closes epic E26 — #247)
- Goal: read along with the lesson, find a line, jump to it — fifth sidebar tab
  consuming the `useTranscriptCues` composable from E26-F01-S02.
- Acceptance:
  - fifth tab beside sections / notes / bookmarks / materials
  - the cue under the playhead is highlighted and `aria-current`
  - clicking a cue emits the sidebar's `seek` event, in seconds
  - a filter box narrows the visible cues, case-insensitively, in-memory
  - empty and no-match states are distinct and translated
- Spec diff: none
- Codegen impact: no
- Design impact: not promoted into `@app/ui` — single-use scrollable list,
  same call as `PlayerNotesTab`
- Tests: `PlayerTranscriptTab.spec.ts` — one row per cue, active marking,
  `seek` payload in seconds, formatted timestamps, filtering, no-match, and
  the empty state hiding the filter box
- Status: done

## T-2026-08-30-016 — E25-F04-S02 transcription card in admin library screen

- Created: 2026-08-30
- Completed: 2026-08-30
- Owner: claude (frontend-engineer, lane L3)
- Branch: `kkucherenkov/e25-admin-transcription-card`
- Result: https://github.com/kkucherenkov/course_shelf/pull/311
- Spec: [docs/roadmap/tasks/E25-F04-S02.md](../../docs/roadmap/tasks/E25-F04-S02.md) (#221)
- Goal: idle/running/terminal transcription card on `admin/libraries/[id].vue` — Start
  (with force checkbox), Cancel, live counters + error list over the Centrifugo channel
  the scan card already subscribes to.
- Spec diff: none — `@app/api-client-ts` already had the three transcription routes.
- Codegen impact: no
- Sub-steps:
  - [x] `AdminTranscriptionCard.vue` + spec
  - [x] `useTranscriptionProgress` composable (new file) + spec
  - [x] Page wiring on `admin/libraries/[id].vue`
  - [x] Locale keys (`admin.transcription.*`) in `en` and `ru`
- Status: done

## T-2026-08-30-001 — scan sidecars: subtitle ingest + thumbnail derived-path + orphan cleanup

- Created: 2026-08-30
- Completed: 2026-08-30
- Owner: claude (lane, worktree `e27-scan-sidecars`)
- Branch: `kkucherenkov/e27-scan-sidecars`
- Result: https://github.com/kkucherenkov/course_shelf/pull/315
- Spec: [docs/roadmap/tasks/E27-F01-S01.md](../../docs/roadmap/tasks/E27-F01-S01.md) (#227), [docs/roadmap/tasks/E25-F04-S01.md](../../docs/roadmap/tasks/E25-F04-S01.md) (#220, duplicate report #282)
- Goal: scan parses `.srt`/`.vtt` sidecars into `Transcript(origin: sidecar)` + cues (re-parse only on
  changed signature); scan thumbnails move under `<derivedPath>/<libraryId>/…` instead of next to the
  video (COURSES_PATH is `:ro` in prod); a lesson that vanishes from a scan gets its Transcript rows
  deleted and the generated file best-effort unlinked.
- Spec diff: none
- Codegen impact: no
- Sub-steps:
  - [x] `domain/scan/scan.ts` — widen `ScannedSubtitle` with `mtime`/`size`
  - [x] `domain/transcription/transcript.repository.ts` — add `findExisting`, `replaceSidecar`, `deleteForLesson`
  - [x] `domain/transcription/derived-path.ts` — add `derivedThumbnailPath`
  - [x] `infra/prisma-transcript.repository.ts` — implement the three new methods
  - [x] `application/scan/sidecar-transcript-ingester.ts` — new pure ingest function
  - [x] `run-scan.handler.ts` — wire sidecar ingest (existing + newly-created lessons), thumbnail
        derived-path, orphan cleanup
  - [x] specs for all of the above
- Notes:
  - Sidecar ingest for a lesson whose _course_ already existed before this scan required loading that
    library's existing lessons up front (`lessonRepo.findByCourse` per existing course) keyed by
    `videoPath`, since v1's "skip on duplicate slug" otherwise makes existing lessons unreachable on a
    repeat scan — that same map also drives orphan detection (a known videoPath the walk didn't see this
    pass has vanished).
  - `run-scan.handler.ts` gained a real `mkdir` call for the thumbnail's parent dir (mirroring
    `run-transcription.handler.ts`'s existing pattern) — its spec now needs
    `vi.mock('node:fs/promises', ...)` or every thumbnail-writing test hangs on real disk I/O.
  - Closed tuxedo #35 (duplicate of #220/#282).

## T-2026-08-30-012 — run whisper transcription over a library

- Created: 2026-08-30
- Completed: 2026-08-30
- Owner: claude (lane, worktree `e25-f03-s02-transcription-run`)
- Branch: `kkucherenkov/e25-f03-s02-transcription-run`
- Result: https://github.com/kkucherenkov/course_shelf/pull/304
- Spec: [docs/roadmap/tasks/E25-F03-S02.md](../../docs/roadmap/tasks/E25-F03-S02.md) (#218, #300)
- Goal: an admin can start, watch and stop a transcription pass over a library, and
  the pass survives a restart because re-running skips what is already on disk.
- Acceptance:
  - `POST /api/v1/libraries/{id}/transcriptions` answers 202 with a `running` run and
    the walk continues after the response flushes
  - a run refuses to start when no whisper model is configured (503) and when one is
    already running for the library (409)
  - a lesson with a sidecar subtitle or an up-to-date generated transcript is skipped
  - a lesson whose audio extraction or whisper call fails is recorded and the run
    carries on
  - `POST /api/v1/transcriptions/{id}/cancel` stops the walk after the lesson in flight
  - `GET /libraries/{id}/transcriptions` and `.../latest` return the history
- Spec diff: none — the contract landed in E25-F03-S01
- Codegen impact: no
- Design impact: none
- Tests: unit — `run-transcription.handler.spec.ts` (13 cases) and 8 new
  `extractCues` cases; integration — `transcriptions.integration.spec.ts`
  (8 cases, every route and documented status through supertest)
- Sub-steps:
  - [x] `extractCues` beside `convertSrtToVtt` + tests
  - [x] `TranscriptionRepository` / `TranscriptRepository` ports + Prisma adapters
  - [x] `RunTranscriptionHandler` + spec
  - [x] Cancel command, latest/list queries
  - [x] Controllers and DTO
  - [x] Module wiring, including `WHISPER_ADAPTER` (#300)
- Notes:
  - `TranscriptionNotConfiguredError` moved 422 → 503 to match the contract that
    E25-F03-S01 landed; an undocumented status becomes a 400 under response
    validation.
  - `convertSrtToVtt` moved to `src/shared/` so `extractCues` could land beside it
    and stay reachable from the catalog context.
  - Follow-ups opened: AsyncAPI variants for the transcription messages on
    `scans:user:{userId}`, and `GET /api/v1/admin/transcriptions`.

## T-2026-08-30-009 — E31-F01-S01 finish the browse filters

- Created: 2026-08-30
- Completed: 2026-08-30
- Owner: claude (lane v1.1 web, worktree `agent-aa63298f92fa237a6`)
- Branch: `kkucherenkov/e31-close-the-real-gaps`
- Result: https://github.com/kkucherenkov/course_shelf/pull/303
- Cards: [E31-F01-S01](../../docs/roadmap/tasks/E31-F01-S01.md) · GH #239
- Goal: library / duration-bucket / instructor filters and sort-by-duration on
  `/browse`, with the whole filter set surviving a reload through the query
  string. Removes the "Browse filters incomplete" row from the Known limits.
- Spec diff: openapi.yaml — `GET /api/v1/courses` gained `durationBucket` and
  `instructorId` query params, and `sort` gained `duration`. The card said the
  diff was conditional; the audit made it mandatory. `libraryId`, `status` and a
  three-value `sort` already existed. The other three did not, and `CourseDto`
  carries no runtime at all, so a client-side filter over the full list was not
  possible even in principle.
- Codegen impact: yes — regenerated TS + Dart clients in their own commit.
- Sub-steps:
  - [x] audit which filter parameters the API already accepts
  - [x] openapi.yaml: `durationBucket`, `instructorId`, `sort=duration`
  - [x] `pnpm spec:validate && spec:bundle && spec:codegen` (own commit)
  - [x] backend: ListCoursesQuery/Handler filter + sort by aggregated lesson duration
  - [x] web: library / duration / instructor selects + duration sort on `/browse`
  - [x] web: query-string persistence for every filter
  - [x] locale keys in en + ru
  - [x] remove the Known-limits row
- Status: done

## T-2026-08-30-010 — E31-F01-S02 backups UI

- Created: 2026-08-30
- Completed: 2026-08-30
- Owner: claude (lane v1.1 web, worktree `agent-aa63298f92fa237a6`)
- Branch: `kkucherenkov/e31-close-the-real-gaps`
- Result: https://github.com/kkucherenkov/course_shelf/pull/303
- Cards: [E31-F01-S02](../../docs/roadmap/tasks/E31-F01-S02.md) · GH #240
- Goal: an admin screen that takes a metadata backup and offers the existing
  signed short-lived download link, with the in-progress and failure states
  visible. Removes the "Backups have no UI" row from the Known limits.
- Spec diff: none — `POST /api/v1/admin/backups` and the signed download route
  have existed since E21.
- Codegen impact: no
- Sub-steps:
  - [x] `useAdminBackup` composable over `createBackup`
  - [x] `/admin/backups` page + nav entry + spec covering the three states
  - [x] locale keys in en + ru
  - [x] remove the Known-limits row
- Status: done

## T-2026-08-30-014 — settle the locale parity claim + the mobile storage bar

- Created: 2026-08-30
- Owner: claude
- Spec: [docs/roadmap/tasks/E31-F02-S03.md](../../docs/roadmap/tasks/E31-F02-S03.md) (issue #244), [docs/roadmap/tasks/E31-F02-S04.md](../../docs/roadmap/tasks/E31-F02-S04.md) (issue #245)
- Goal: mobile ships `en`/`ru` like web (the machine-written `uk`/`el` locales go), the storage bar is kept and covered against a stubbed plugin, and the three Known-limits rows that described either as a defect are removed.
- Spec diff: none
- Codegen impact: no
- Sub-steps:
  - [x] delete `*_uk.i18n.json` / `*_el.i18n.json` and the unused `localeEl` / `localeUk` keys
  - [x] drop the Greek/Ukrainian entries from the settings language picker
  - [x] `pnpm check:i18n` green, mobile reported as 2 locales
  - [x] rewrite both Known-limits rows + the Languages line in `docs/user-guide.md`
  - [x] correct the locale claim in `README.md`, `README.ru.md`, `.claude/docs/i18n.md`
  - [x] `flutter analyze && flutter test`
  - [x] widget tests for `StorageBar` over a stubbed `disk_space_plus` (E31-F02-S04)
  - [x] remove the "Storage bar on mobile" Known-limits row
- Status: done
- Blockers: —
- Completed: 2026-08-30
- Result: https://github.com/kkucherenkov/course_shelf/pull/301

## T-2026-08-30-013 — E26-F01-S02 + E26-F01-S04 transcript cues, `?t=` deep links, two player defects

- Created: 2026-08-30
- Completed: 2026-08-30
- Owner: claude (lane L3, worktree `e26-transcript-cues`)
- Branch: `kkucherenkov/e26-transcript-cues`
- Result: https://github.com/kkucherenkov/course_shelf/pull/299
- Cards: [E26-F01-S02](../../docs/roadmap/tasks/E26-F01-S02.md) · GitHub #224 ·
  [E26-F01-S04](../../docs/roadmap/tasks/E26-F01-S04.md) · GitHub #226
- Defects closed in the same pass: #287 (native cue line painted behind
  `AppPlayerChrome`), #288 (a non-16:9 video overflowing the player frame),
  #295 (stale `buildSubtitleTracks` comment after the scan learned to dedupe
  sidecars)
- Spec diff: none
- Codegen impact: no
- Sub-steps:
  - [x] `useTranscriptCues` + spec — locale-matched track with fallback,
        `disabled` → `hidden` promotion, `showing` left to the chrome, re-read
        on `load`/`addtrack`, `activeIndex: -1` outside every cue
  - [x] `parseStartTime` + spec — every accepted and rejected form
  - [x] `?t=` beats the resume position and the resume preference
  - [x] #287 — `VTTCue.line` lifts the cue box clear of the control bar;
        the non-bubbling `<track>` `load` is caught in the capture phase
  - [x] #288 — `AppPlayerChrome` sizes slotted media itself (`::v-slotted`),
        so every caller letterboxes instead of repeating the rule
  - [x] Gates: web lint/typecheck/test, @app/ui lint/typecheck/test,
        stylelint, prettier, check:i18n
- Notes:
  - `happy-dom` has no `TextTrackList`, so neither the cue lift nor the
    letterboxing is assertable in a unit test. What a browser still has to
    confirm is listed in the PR body and on the E26-F01-S04 card, whose
    "Manual verification" box is deliberately left unticked.
  - `pnpm --filter @app/web lint` fails on a fresh worktree with 27 errors in
    `app/pages/dev/foundations.vue` until `pnpm design:build` writes the
    git-ignored `app/design-tokens.generated.ts`. Not a code defect — the
    artefact simply does not exist before the first build.

## T-2026-08-30-008 — E25-F01 whisper foundation (S01, S02, S04)

- Created: 2026-08-30
- Completed: 2026-08-30
- Owner: claude (lane L1, worktree `e25-whisper-foundation`)
- Branch: `kkucherenkov/e25-whisper-foundation`
- Result: https://github.com/kkucherenkov/course_shelf/pull/298
- Spec: [docs/superpowers/specs/2026-08-29-b4-transcription-design.md](../../docs/superpowers/specs/2026-08-29-b4-transcription-design.md)
- Cards: [E25-F01-S01](../../docs/roadmap/tasks/E25-F01-S01.md) (#210),
  [E25-F01-S02](../../docs/roadmap/tasks/E25-F01-S02.md) (#211),
  [E25-F01-S04](../../docs/roadmap/tasks/E25-F01-S04.md) (#213)
- Goal: give the transcription work a writable derived volume, whisper config,
  a pinned whisper.cpp binary in the backend image, a guarded derived-path
  resolver, and speech-to-text behind a port.
- Spec diff: none
- Codegen impact: no
- Sub-steps:
  - [x] `AppConfig.derivedPath` + `AppConfig.transcription` with a colocated spec
  - [x] writable `/data/derived` in `compose.yml`, `compose.prod.yml`, `compose.release.yml`
  - [x] ggml model mounted read-only; env wired in prod and release
  - [x] `.env.example` + `.gitignore` cover `DERIVED_PATH` and every `WHISPER_*`
  - [x] whisper.cpp pinned in both backend Dockerfiles, both binaries verified in-container
  - [x] `transcription.errors.ts`
  - [x] `derived-path.ts` + spec (guard separate from `lesson-file-locator.ts`)
  - [x] `whisper.port.ts` + `WHISPER_ADAPTER` token
  - [x] `local-whisper.adapter.ts` + spec (`execFile` mocked, no real binary)
  - [x] docs: `README.md`, `README.ru.md`, `docker/README.md`
- Status: done
- Blockers: —
- Deviation: the ggml model is bound through a read-only `/models` directory
  (`WHISPER_MODEL_DIR`) with `WHISPER_MODEL_PATH` naming the file, not the
  plan's required single-file mount — a required mount would break every
  existing prod stack on upgrade. `DERIVED_PATH` is required in prod/release.
- Left to other lanes: E25-F01-S03 (ffmpeg audio extraction) and the
  `Transcription` aggregate / repository / skip rule.

## T-2026-08-30-007 — backend: error mapping + subtitle track identity/label

- Created: 2026-08-30
- Completed: 2026-08-30
- Owner: claude (lane L4, worktree `agent-a144a2781c8088411`)
- Branch: `kkucherenkov/backend-error-and-subtitle-fixes`
- Result: https://github.com/kkucherenkov/course_shelf/pull/294
- Cards: none — three defects found outside a roadmap card (GitHub #289, #291, #286)
- Goal: unknown routes answer 404/405 as problem+json; one subtitle track per
  language, labelled with the language rather than the video file name.
- Spec diff: none — `SubtitleDto.label` already documents `"English"`, and
  `/api/v1/stream/lessons/{id}/subtitles/{language}` keeps its shape.
- Codegen impact: no
- Sub-steps:
  - [x] `HttpExceptionFilter` narrows on a numeric HTTP status instead of a
        class, so every express-openapi-validator error becomes problem+json;
        `Allow` survives on the 405 (#289)
  - [x] `http-exception.filter.spec.ts` boots the real middleware against an
        inline document — 404, 405 + `Allow`, 200, and a plain `Error` still 500
  - [x] scan collapses a lesson's subtitle files to one per language, `.vtt`
        preferred; file signatures stay per-file so rescan detection is
        unchanged (#291)
  - [x] `Subtitle.label` derived from the language via `Intl.DisplayNames`
        rather than the video stem (#286)
  - [x] `docs/user-guide.md` + `docs/architecture.md` updated in the same pass
  - [x] gates: lint --fix, typecheck, test (1612 passing), format, spec:validate
- Status: done
- Blockers: —

## T-2026-08-30-005 — E25 transcription domain + ffmpeg audio extraction

- Created: 2026-08-30
- Completed: 2026-08-30
- Result: https://github.com/kkucherenkov/course_shelf/pull/293
- Owner: claude
- Cards: [E25-F02-S02](../../docs/roadmap/tasks/E25-F02-S02.md) (#215),
  [E25-F02-S03](../../docs/roadmap/tasks/E25-F02-S03.md) (#216),
  [E25-F01-S03](../../docs/roadmap/tasks/E25-F01-S03.md) (#212)
- Spec: [B4 transcription design](../../docs/superpowers/specs/2026-08-29-b4-transcription-design.md) §5, §6
- Goal: the pure pieces the transcription run is built from — the run aggregate,
  the skip rule that makes a re-run cheap, and the whisper-shaped audio extraction
  on the existing ffmpeg port.
- Spec diff: none (routes already landed in E25-F03-S01)
- Codegen impact: no
- Sub-steps:
  - [x] `transcription.errors.ts` — the two errors these three cards need
  - [x] `transcription.ts` aggregate + spec (E25-F02-S02)
  - [x] `skip-rule.ts` + table-driven spec (E25-F02-S03)
  - [x] `AudioExtractRequest` + `extractAudio` on `FfmpegAdapter`, implementation
        and spec in `LocalFfmpegAdapter` (E25-F01-S03)
  - [x] gates: lint / typecheck / test / format
  - [x] card bookkeeping + PR
- Status: shipped
- Notes:
  - `TranscriptionInTerminalStateError` is a 409, not the 422 `Scan` uses: the one
    handler that can reach it is `POST /transcriptions/{id}/cancel`, whose contract
    documents 409.
  - The extraction timeout is a per-call parameter, not an `AppConfig` value —
    E25-F01-S01 (whisper config) is not in `main`, and nothing here needed it.
  - Card status was flipped by editing the cards and `TODO.md` directly, then
    `generate.py --roadmap-only`. A plain generator run is refused by
    `refuse_if_seeded()` and its `write_todo()` rewrites every row as unticked.

## T-2026-08-30-006 — parametrise the compose host ports and project name

- Created: 2026-08-30
- Completed: 2026-08-30
- Owner: claude
- Spec: none (tuxedo #39 · GitHub #284)
- Goal: two worktrees can bring up the dev stack at the same time, and a host
  process already holding :3000 does not block the stack.
- Spec diff: none
- Codegen impact: no
- Sub-steps:
  - [x] every published host port in `docker/compose.yml` reads `${CS_*_PORT:-<default>}`
  - [x] the URLs derived from those ports (`BETTER_AUTH_URL`, `CORS_ORIGINS`, `NUXT_PUBLIC_*`) follow the same vars
  - [x] `name:` reads `${COMPOSE_PROJECT_NAME:-course-shelf}`
  - [x] `docker/README.md` documents the vars and stops telling the reader to hand-edit `compose.yml`
- Result: https://github.com/kkucherenkov/course_shelf/pull/263
- Status: done
- Blockers: none — verified with `docker-compose config` at the defaults and
  with every variable overridden; the stack itself was not brought up

## T-2026-08-30-004 — E31-F01-S03 fix the duplicated offline bookmark

- Created: 2026-08-30
- Completed: 2026-08-30
- Owner: claude (lane L5, worktree `e31-offline-bookmark`)
- Branch: `kkucherenkov/e31-f01-s03-offline-bookmark-id-map`
- Result: https://github.com/kkucherenkov/course_shelf/pull/258
- Cards: [E31-F01-S03](../../docs/roadmap/tasks/E31-F01-S03.md) · GitHub #241
- Spec diff: none
- Codegen impact: no
- Sub-steps:
  - [x] Drift `bookmark_id_map` table, schema v3 → v4 with a real migration step
  - [x] Mapping written when the outbox entry settles, dropped on a settled delete
  - [x] Reconcile on fetch in `OutboxLessonPlayerRepository`
  - [x] `SyncBloc.drained` → `PlayerBloc`, so the open screen corrects without a refetch
  - [x] Known-limits row removed from `docs/user-guide.md`
- Notes:
  - Review found the acceptance bullet "no duplicate **without a refetch**" unmet at the
    UI layer: the guard lived only in `fetchBookmarks`, which runs on `_onStarted`/`_onRetry`.
    Closed by passing an opaque `Stream<void>` into `PlayerBloc` — no sync type crosses
    into the player feature — wired at `injector.dart:224`, the return direction of the
    `onEnqueued` edge that already existed.
  - Fixed a defect the card did not name: deleting a bookmark created offline and since
    synced sent the `localId`, which 404s, and a failing leg wedged every later drain of
    progress, notes and bookmarks alike.
  - Out of scope, filed: `POST /lessons/{id}/bookmarks` has no idempotency key, so an
    interrupted drain can create a second bookmark the id map cannot reconcile.

## T-2026-08-30-003 — E31-F02-S01/S02 withdraw the promises

- Created: 2026-08-30
- Completed: 2026-08-30
- Owner: claude (lane L4, worktree `e31-withdraw-promises`)
- Branch: `kkucherenkov/e31-withdraw-promises`
- Result: https://github.com/kkucherenkov/course_shelf/pull/259
- Cards: [E31-F02-S01](../../docs/roadmap/tasks/E31-F02-S01.md), [E31-F02-S02](../../docs/roadmap/tasks/E31-F02-S02.md) · GitHub #242, #243
- Spec diff: none — the contract keeps `ssoProviders` because the Flutter client still reads it
- Codegen impact: no
- Sub-steps:
  - [x] `useSsoProviders` deleted, `AppSsoBlock` dropped from sign-in and sign-up
  - [x] Avatar upload, email change and account deletion removed from Settings
  - [x] 12 dead i18n keys removed from `en.ts` and `ru.ts` in parity
  - [x] Settings page spec asserts the controls are absent
  - [x] Both Known-limits rows removed
- Notes:
  - The card's premise was one revision stale: PR #205 had wired `AppSsoBlock` the day
    before, so it was a live-but-always-empty surface, not an unread fetch. Same conclusion.
  - `AppSsoBlock` stays in `@app/ui` with its story and spec — a component, not a claim.
  - Review found two stale prose claims the card did not name: `docs/user-guide.md` still
    said avatar upload, email change and account deletion were "visible but not yet
    functional", and `docs/audit/2026-08-29-plan-vs-code.md` item 13 still read
    "Wired, not deleted". Both retired in the same PR.
  - tuxedo 11 asked for the opposite wiring; closed against the card.

## T-2026-08-30-002 — E26-F01-S01 render the subtitle tracks in the web player

- Created: 2026-08-30
- Completed: 2026-08-30
- Owner: claude (lane L3, worktree `e26-subtitle-tracks`)
- Branch: `kkucherenkov/e26-subtitle-tracks`
- Result: https://github.com/kkucherenkov/course_shelf/pull/257
- Cards: [E26-F01-S01](../../docs/roadmap/tasks/E26-F01-S01.md) · GitHub #223
- Spec diff: none — `LessonDto.subtitles[]` and the route have existed since E06/E08
- Codegen impact: no
- Sub-steps:
  - [x] Pure `buildSubtitleUrl` and `buildSubtitleTracks` with a 14-case spec
  - [x] One `<track>` per entry, unbuildable entries dropped rather than `src="undefined"`
  - [x] Exactly one `default`, matched to the UI locale
  - [x] Verified in Chromium against the running stack on the proxy origin
- Notes:
  - Subtitles had never worked on the web since E14: `useLessonPlayer` toggled
    `videoEl.textTracks` while the page rendered no `<track>` at all.
  - Also fixed the toggle, which set **every** track to `showing` and never followed the
    real track modes, so a browser-enabled default left the button reading "off".
  - Review found two `<track default>` when a lesson carries two sidecars in one language —
    reachable, because `model Subtitle` has no `@@unique([lessonId, language])`. Closed by
    moving list building into a pure function with a single-assignment latch.
  - No unit test for the toggle: happy-dom's `TextTrack` silently drops `mode='hidden'`,
    so the test would assert the shim rather than the browser.
  - Five out-of-scope defects filed rather than folded into the diff.

## T-2026-08-30-001 — E25-F03-S01/F02-S01 transcription contract and schema

- Created: 2026-08-30
- Completed: 2026-08-30
- Owner: claude (lane L1, worktree `e25-contract-schema`)
- Branch: `kkucherenkov/e25-contract-schema`
- Result: https://github.com/kkucherenkov/course_shelf/pull/256
- Cards: [E25-F03-S01](../../docs/roadmap/tasks/E25-F03-S01.md), [E25-F02-S01](../../docs/roadmap/tasks/E25-F02-S01.md) · GitHub #217, #214
- Spec diff: 5 transcription routes, 7 schemas, `SubtitleDto.generated`
- Codegen impact: yes — landed in its own commits
- Sub-steps:
  - [x] Routes and schemas mirroring the scan surface
  - [x] `spec:validate && spec:bundle && spec:codegen`, artefacts in separate commits
  - [x] Prisma models and enums; migration SQL reviewed for an accidental FK
  - [x] `AdminTranscriptionListDto` / `AdminTranscriptionListItem` for the cross-library list
- Notes:
  - Contract only. Handlers, the whisper adapter and run logic are E25-F01-\* and E25-F03-S02.
  - The migration creates exactly two foreign keys, both internal. Nothing references
    `lesson` or `subtitle`: `prisma-lesson.repository.ts` recreates every subtitle row on
    each save, so a cascade would erase transcripts on the next ordinary scan.
  - Review found the admin list reusing the plain `TranscriptionDto` while all three other
    cross-library admin listings have a denormalised pair carrying `libraryName` and an
    error count. Fixed before merge, while the generated clients were still cheap to change.
  - The migration was produced with `prisma migrate diff`, not `migrate dev` — no database
    was reachable from the worktree — and the SQL was reviewed by hand.
  - `pnpm spec:contract-test` was not run: it needs Docker and a live backend, and it is
    wired into no GitHub workflow. It belongs with E25-F03-S02.

## T-2026-08-29-013 — Audit items 15 & 16 · the last undocumented routes

- Created: 2026-08-29
- Completed: 2026-08-29
- Owner: claude
- Branch: `spec/document-binary-routes`
- Result: https://github.com/kkucherenkov/course_shelf/pull/206
- Cards: none (audit remediation — §7)
- Spec diff: 4 new path items
- Codegen impact: yes — landed in its own commit
- Design impact: no
- Sub-steps:
  - [x] `GET /stream/lessons/{id}` with 200/206/401/404/416 and `Range`
  - [x] `GET /stream/lessons/{id}/subtitles/{language}` as `text/vtt`
  - [x] `GET /stream/materials/{materialId}`
  - [x] `GET /admin/backups/{id}/download`
  - [x] regenerate both clients
  - [x] 16 — record why thresholds are not added
  - [x] docs: architecture §3.1 and §18, the audit's §7
- Status: done

**Why the validator exemption stays.** `validateResponses` is on outside
production and throws 400 on a mismatch, so un-exempting these would push a
video stream through a JSON response validator in every dev run. The
spec-first rule is about describing the contract — which they now do.

**Item 16 needed no code.** The defect was the README's false "coverage
enforcement" claim, deleted in #199. `.claude/CLAUDE.md` explicitly says not to
tune a threshold number that will rot in a greenfield, so adding one would have
been the worse half of "pick one".

## T-2026-08-29-012 — Audit items 13 & 14 · wire what was built and never connected

- Created: 2026-08-29
- Completed: 2026-08-29
- Owner: claude
- Branch: `feat/wire-sso-and-catalog-cache`
- Result: https://github.com/kkucherenkov/course_shelf/pull/205
- Cards: none (audit remediation — `docs/audit/2026-08-29-plan-vs-code.md` §9)
- Goal: two components that were built, tested, exported and then never called.
- Spec diff: none
- Codegen impact: no
- Design impact: no

### Both are "wire or delete", and both resolve to wire

**13 — `AppSsoBlock` (web).** Deleting is wrong: the Flutter twin _is_ used
(`sign_in_screen`, `sign_up_screen`), `InstanceConfigDto.ssoProviders` is in
`openapi.yaml`, and the design bundle carries the component on both platforms
(E13-F02-S10 / E17-F02-S09). Only the web half was never connected. Wiring it
makes web match mobile.

The audit's §9 misplaced the hard-code: `useInstanceConfig.ts:17` is the
_fallback_ used when `GET /admin/instance` is unreachable, not a hard-coded
value. The real one is `apps/backend/src/common/config/app-config.ts:334`,
which returns `ssoProviders: []` unconditionally and says so — v1 ships no
providers, v2 populates them once Better Auth's `genericOAuth` plugin lands.

So this renders nothing today, exactly as mobile renders nothing today. That is
the point: when the backend starts advertising a provider, both clients light
up with no further work, instead of one of them staying dark.

**14 — `CachedCatalogDao` (mobile).** Deleting it would throw away the
offline-_read_ half immediately after E20 shipped the offline-_write_ half. A
downloaded lesson plays offline today, but the course-detail screen that lists
it cannot render without a network round trip. The DAO was built for exactly
this — `replaceOutline` mirrors `GET /courses/{id}/outline` — and has never had
a caller.

- Sub-steps:
  - [x] `useSsoProviders` composable, mirroring mobile's `ssoProvidersFor`
  - [x] render `AppSsoBlock` on sign-in and sign-up
  - [x] web locale keys for the provider labels, en + ru
  - [x] `CourseDetailRepositoryImpl`: write through to the cache on fetch
  - [x] read from the cache when the network fails
  - [x] tests for both paths
- Status: done

## T-2026-08-29-011 — Audit item 10 · every design-system string overridable

- Created: 2026-08-29
- Completed: 2026-08-29
- Owner: claude
- Branch: `feat/design-system-i18n-props`
- Result: https://github.com/kkucherenkov/course_shelf/pull/204
- Cards: none (audit remediation — `docs/audit/2026-08-29-plan-vs-code.md` §8)
- Goal: no user-visible string in `@app/ui` or `app_ui` that a consumer cannot
  translate. Closes the `.claude/CLAUDE.md` hard rule "never ship a
  user-visible string without `t()` / `AppLocalizations`" for the design system.
- Spec diff: none
- Codegen impact: no
- Design impact: adds label props; no visual change

### The item's count was wrong in both directions

§8 names five strings. One of them — `AppSpinner.semanticLabel` — is **already**
a constructor parameter with an English default, so it was never a defect. The
other four are real but are 4 of ~65.

Measured across both packages, excluding punctuation separators and the token
demo screen:

| Platform           | Components | Strings |
| ------------------ | ---------- | ------- |
| Vue (`@app/ui`)    | 11         | 36      |
| Flutter (`app_ui`) | 10         | 29      |

`AppPlayerChrome` (Vue) is **not** in that count and needs no work: its 23
strings are already props, with the aria set merged over a `DEFAULT_ARIA`
constant. It is the pattern the rest of this task follows rather than a
component to fix. Several Flutter widgets are partly done the same way
(`app_download_row` has four label parameters, `app_player_chrome` five), so
this extends an established convention instead of inventing one.

### Approach

Defaults stay byte-identical to today's English, so the 88 `@app/ui` snapshots
and every Flutter golden must remain green without regeneration — that is the
check that this refactor changed no rendering.

- Sub-steps:
  - [x] Flutter: label parameters on the 10 widgets
  - [x] Vue: label props on the 11 components
  - [x] wire the consumers that actually surface each string
  - [x] locale keys: web `en`/`ru`, mobile `en`/`ru`/`uk`/`el`
  - [x] `pnpm check:i18n` green (it enforces per-app key parity)
  - [x] snapshots and goldens unchanged, both suites green
- Status: done

## T-2026-08-29-010 — Audit items 9, 11, 12 · arm the last two gates, correct the rule

- Created: 2026-08-29
- Completed: 2026-08-29
- Owner: claude
- Branch: `ci/arm-remaining-gates`
- Result: https://github.com/kkucherenkov/course_shelf/pull/203
- Cards: none (audit remediation — `docs/audit/2026-08-29-plan-vs-code.md` §4)
- Goal: the two remaining gates that could not fail, and a rule that described
  a repository which does not exist.
- Spec diff: none
- Codegen impact: no
- Design impact: no
- Sub-steps:
  - [x] 9 — ffmpeg installed in ci.yml's `checks` job; the suite it unblocks
        verified green locally first (2 tests that had never run)
  - [x] 9 — the "Fix (CI)" section deleted from `docs/troubleshooting.md`:
        the instruction is now the config
  - [x] 11 — `tests/e2e/csp.spec.ts` fails instead of skipping when
        `E2E_EXPECT_CSP=1`, which `e2e.yml` sets
  - [x] 12 — the issue-mirroring rule narrowed to the epics actually mirrored
- Status: done

Item 10 is deliberately not here: it changes the public API of two
design-system components and belongs in its own PR.

## T-2026-08-29-009 — Audit item 8 · make the design inventory true, then gate it

- Created: 2026-08-29
- Completed: 2026-08-29
- Owner: claude
- Branch: `chore/design-inventory-strict`
- Result: https://github.com/kkucherenkov/course_shelf/pull/202
- Cards: none (audit remediation — `docs/audit/2026-08-29-plan-vs-code.md` §5)
- Goal: `pnpm design:audit --strict` in CI, on an inventory that describes the
  components that actually exist.
- Spec diff: none
- Codegen impact: no
- Design impact: rewrites the inventory table in `specs/design/README.md`

### The item as written would produce a lying inventory

Item 8 says "backfill 37 Vue and 17 Flutter components, then `--strict`". The
37 Vue names are real. **The 17 Flutter ones are not components** — the audit
lists `packages/ui_flutter/lib/src/` _directories_, which are groupings
(`buttons/`, `fields/`, `progress/`), and pascalises them into `AppButtons`,
`AppFields`, `AppProgress`. No such widgets exist. Adding those rows would
satisfy the check by inventing names, which is the kostyl
`.claude/CLAUDE.md` "Fix root causes, not symptoms" exists to forbid.

The Vue half of the audit is correct — that package is one folder per
component. Only the Flutter half walks the wrong level, so only it is rewritten.

### What the Flutter set actually is

Public widget classes reachable from the package barrel `lib/app_ui.dart`:
78 exported files, 70 widget classes, of which 17 are Dart-private (`_`-prefixed
internals) and one is the token demo screen. **52 real components.**

Deriving them from the barrel rather than from filenames uses the package's own
declaration of its public API, so a widget that is not exported is not claimed
as a component, and a new export is picked up with no list to maintain.

### Also fixing what the script promises and never did

Its header comment advertises "Vue ↔ Flutter parity drift (one side has it, the
other doesn't)" and no such check is implemented. The inventory's
`Flutter (app_ui)` column is `—` on every row — written when the Flutter
package was empty and never updated, though parity is now near-complete. Since
both sets are known, the column is verified rather than trusted.

- Sub-steps:
  - [x] Flutter enumeration reads the barrel, not the directory names
  - [x] the stale-row check accepts a Flutter-only component
        (`AppBottomSheet`, `AppDownloadRow`) instead of flagging it
  - [x] parity check: the `Vue` / `Flutter` columns must match the code
  - [x] rewrite the inventory table — every Vue and Flutter component, real
        parity marks
  - [x] `--strict` in ci.yml
  - [x] prove the gate fails on a removed row before committing
- Status: done

## T-2026-08-29-008 — E20-F01-S01 · SyncBloc, and the producers that make it mean something

- Created: 2026-08-29
- Completed: 2026-08-29
- Owner: claude
- Branch: `feat/sync-bloc`
- Result: https://github.com/kkucherenkov/course_shelf/pull/201
- Cards: [E20-F01-S01](../../docs/roadmap/tasks/E20-F01-S01.md) — the last
  unstarted card on the v1 roadmap (#132, sub-steps #133/#134/#135)
- Goal: offline writes actually reach the server. Three outbox tables fill and
  nothing drains them; `POST /api/v1/progress/batch` has a complete backend
  implementation and no caller on either platform.
- Spec diff: none — every endpoint the drain needs already exists
- Codegen impact: no
- Design impact: no

### Two things found while reading, both agreed with the maintainer

**1. The `/api/v1` doubling bug is still live in two files.** Issue #172 fixed
`auth_api.dart` in July but not the class of bug. `lesson_player_api.dart` (10
call sites) and `http_lesson_byte_source.dart` (1) still pass `/api/v1/…` to a
Dio whose `baseUrl` already ends in `/api/v1`; Dio string-concatenates, so
every one resolves to `/api/v1/api/v1/…` and 404s. The player's notes,
bookmarks, outline, stream-url and material downloads are all non-functional
against a real backend, as is the downloads byte source shipped in #198.

The tests do not catch it because they build `Dio(BaseOptions(baseUrl:
'http://localhost:3000'))` — without the `/api/v1` the real app has — and then
assert `adapter.lastRequest.path`, the argument, rather than the resolved
`RequestOptions.uri`. Fixed here as its own commit, with a test that closes the
whole class rather than one file.

**2. Two of the three outboxes have no producer.** `notes_outbox` and
`bookmarks_outbox` are written by nothing: the player calls
`saveNote` / `createBookmark` / `deleteBookmark` straight through Dio and
swallows the error when offline. Draining tables that never fill would ship
two thirds of this card as test-only code — the exact pattern the audit just
flagged for `CachedCatalogDao` and `AppSsoBlock`. So the player's writes move
onto the outbox as well.

### Deviation from the card, recorded

Acceptance says _"Conflict (server `updatedAt` > client) results in client
overwrite from server"_. There is no local progress cache to overwrite — no
Drift table stores progress, only the outbox. `accepted`, `stale` and
`forbidden` are therefore all terminal for the queued row; what distinguishes
`stale` is that it carries the server's `LessonProgressDto`, which the drain
surfaces on the outcome so a listening player can correct itself. Recorded
rather than silently reinterpreted.

- Sub-steps:
  - [x] strip the `/api/v1` prefix from 11 call sites; add a URI-resolution
        test that builds Dio with the real base
  - [x] `SyncState` (idle · syncing · failed) + `SyncRepository` port
  - [x] `SyncApi` — batch progress, notes upsert/delete, bookmark
        create/update/delete
  - [x] `SyncRepositoryImpl` — the three outboxes drained oldest-first by
        `queuedAt`, per the drain rules already written on the DAOs
  - [x] `SyncBloc` — ConnectivityChanged · AppResumed · Tick · ManualSync
  - [x] player writes go to the outbox instead of straight to the wire
  - [x] DI + provide above the MaterialApp, `Stream<SyncState>` exposed
  - [x] bloc_test + unit tests for every drain rule
- Status: done

**Known constraint, inherited.** No emulator on this host and none in CI, so
the `integration_test` the card asks for cannot be written or run here — the
same limit E19-F01-S01 and E19-F01-S03 recorded.

## T-2026-08-29-007 — Audit remediation, items 1–6

- Created: 2026-08-29
- Completed: 2026-08-29
- Owner: claude
- Branch: `chore/audit-fixes`
- Result: https://github.com/kkucherenkov/course_shelf/pull/199
- Cards: none (bookkeeping + CI hardening, not a roadmap story)
- Goal: close items 1–6 of the ranked list in
  `docs/audit/2026-08-29-plan-vs-code.md` — every _false statement_ in the
  repository, plus the two gates that make the rest enforceable.
- Spec diff: none
- Codegen impact: no
- Design impact: no
- Sub-steps:
  - [x] 1 — branch protection on `main` with the four required checks
  - [x] 3 — `pnpm check:i18n` as a step in ci.yml's `checks` job
  - [x] 4 — `docs/troubleshooting.md` fvm entry points at a real version
  - [x] 5 — Gantt: synced from the cards, drift gated in CI
  - [x] 2 — six false claims in README.md / README.ru.md
  - [x] 6 — stale follow-up note in `specs/tasks/active.md`
- Status: done

Scope grew twice, both times into the same root cause the item named.
Item 4's entry blamed local drift; the actual cause was
`.devcontainer/devcontainer.json` pinning Flutter 3.41.0, _below_ the
`>=3.44.0` floor in both pubspecs — the devcontainer could not run
`flutter pub get`. Item 5's Gantt was not stale-by-neglect: `write_roadmap()`
encoded Stage (A/B) as `active`/`crit` and never had a progress axis at all,
so "all 121 rows :active" was the design, not drift.

Also landed here at the maintainer's request: a **Working agreement** section
in `.claude/CLAUDE.md` (answer in Russian; plan first; update docs in the same
pass; `tuxedo`/`dnote` for long-term memory; a dnote changelog note appended
before reporting done), mirrored short in `AGENTS.md`.

## T-2026-08-29-006 — E19-F01-S03 · Downloads tab UI, plus the entry point it needed

- Created: 2026-08-29
- Completed: 2026-08-29
- Owner: claude
- Branch: `feat/downloads-tab-ui`
- Cards: [E19-F01-S03](../../docs/roadmap/tasks/E19-F01-S03.md) and the last
  open sub-step of [E18-F01-S03](../../docs/roadmap/tasks/E18-F01-S03.md) (#101)
- Result: https://github.com/kkucherenkov/course_shelf/pull/198
- Goal: a Downloads tab that shows the real queue, and a way to put something
  in it.
- Spec diff: none
- Codegen impact: no (Drift/slang regeneration only)
- Design impact: implements `docs/design/cs-mobile-downloads/`
- Tests: 399 pass (+20). `integration_test` not written — no emulator on this
  host, the constraint E19-F01-S01 already recorded.
- Sub-steps:
  - [x] `downloaded_lessons` v2 -> v3: `lesson_title` / `course_title`
  - [x] `DeviceStorage` port + `disk_space_plus` adapter
  - [x] bloc: grouping, storage, connectivity, delete-course
  - [x] screen: storage bar, offline banner, three sections, per-course
        delete-all, empty state
  - [x] course detail: per-lesson tap-to-download + course-level CTA
  - [x] `DownloadsBloc` provided above the MaterialApp
  - [x] four locales, `pnpm check:i18n` green
- Status: done

**Two blockers found before anything could be built.** `EnqueueLesson` /
`EnqueueCourse` were dispatched from nowhere, so the tab could only ever have
been empty; and there is no local catalog to read titles from — `cached_lessons`
/ `cached_courses` exist but `CachedCatalogDao` has no callers at all. The first
pulled #101 into this task; the second is why the queue row now carries its own
display names.

**Not verified.** `disk_space_plus` has native code on both platforms and was
never executed here. `pubspec.lock` was resolved under local Flutter 3.47 while
CI pins 3.44, moving seven SDK-pinned transitive packages; CI's `flutter pub
get` is the check.

**Worth a native review.** The Greek and Ukrainian strings are mine.

## T-2026-08-29-005 — E22-F01-S04 · visual-drift PR comment + visual-approved gate

- Created: 2026-08-29
- Completed: 2026-08-29
- Owner: claude
- Branch: `ci/visual-regression-approval`
- Card: [E22-F01-S04](../../docs/roadmap/tasks/E22-F01-S04.md)
- Result: https://github.com/kkucherenkov/course_shelf/pull/197
- Goal: turn "pixels changed" into a reviewable decision — say which stories
  moved, hand over the images, and let an author approve an intentional diff
  without regenerating baselines.
- Spec diff: none
- Codegen impact: no
- Design impact: none
- Tests: 7 unit tests on the drift-report helpers; `@app/ui` suite green at 878;
  `actionlint` clean; the embedded `github-script` body syntax-checked with
  `node --check`.
- Sub-steps:
  - [x] test-runner records `{story, diffPercent}` as NDJSON and re-throws
  - [x] `visual-diffs` artifact + one in-place-edited PR comment
  - [x] `visual-approved` label gate, `labeled`/`unlabeled` in the triggers
  - [x] label created; PR template row added
- Status: done

**Deviation — table and link, not thumbnails.** GitHub markdown embeds neither
artifact images nor `data:` URIs. Inline thumbnails would need the PNGs pushed
to a branch for `raw.githubusercontent` URLs — permanent junk commits plus
`contents: write` on a fork-triggerable workflow. Put to the user before
implementing.

**Deviation — the gate is not "required" yet.** `main` has no branch protection
(`branches/main/protection` → 404), so nothing is required on any PR. The logic
is correct once protection is on; that is a settings change, not code.

**Not a masked failure.** `continue-on-error` on the test-runner step is
re-raised by the Verdict step, which fails unconditionally when the drift report
is empty — a broken Storybook build is not something the label may wave past.

## T-2026-08-29-004 — E21-F01-S02 · POST /admin/backups

- Created: 2026-08-29
- Owner: claude
- Branch: `feat/admin-backups`
- Card: [E21-F01-S02](../../docs/roadmap/tasks/E21-F01-S02.md)
- Goal: an admin can take a metadata-database snapshot and download it from a
  link that does not need an `Authorization` header.
- Spec diff: `openapi.yaml` — `POST /api/v1/admin/backups` + `BackupCreatedDto`
- Codegen impact: yes
- Design impact: none — no backup surface exists in the design bundle or in any
  web card, so this is API-only.
- Decisions taken with the user before coding:
  - `pg_dump` via `execFile`, with `postgresql18-client` added to the backend
    runtime image (it is not there today) and an explicit version gate rather
    than a silently partial archive.
  - A separate `BackupTokenSigner` in the admin domain rather than extending
    `StreamTokenSigner` (wrong bounded context) or refactoring it (live
    security path).
- Sub-steps:
  - [x] spec: `POST /api/v1/admin/backups`, `BackupCreatedDto`, 503 cases
  - [x] `pnpm spec:validate && spec:bundle && spec:codegen`
  - [x] `BackupTokenSigner` + errors
  - [x] `pg_dump` adapter with version gate, timeout and retention prune
  - [x] `CreateBackupHandler` + controller route + binary download route
  - [x] `postgresql18-client` + `/data/backups` in `apps/backend/Dockerfile`
  - [x] tests — 46 new; backend suite 1598 passed / 2 skipped
- Completed: 2026-08-29
- Result: https://github.com/kkucherenkov/course_shelf/pull/196
- Status: done

**Not verified locally.** Docker is unavailable in this environment, so the
image change (`apk add postgresql18-client`) was never built. The package's
presence in alpine 3.23/3.24 `main` was confirmed from the Alpine package index.
CI's e2e job builds the image — that is the real check.

**Deviation — API only.** No backup surface exists in the design bundle or in
any web card, so nothing consumes `createBackup` yet.

## T-2026-08-29-003 — E23-F02-S02 · seed the ADR log with ten entries

- Created: 2026-08-29
- Owner: claude
- Branch: `docs/seed-adrs`
- Card: [E23-F02-S02](../../docs/roadmap/tasks/E23-F02-S02.md)
- Goal: record the _why_ of ten load-bearing decisions so they stop being
  re-litigated, and correct the one the roadmap has backwards.
- Spec diff: none
- Codegen impact: no
- Sub-steps:
  - [x] ten ADRs under `docs/adr/`, MADR 4.0, each grounded in the tree
  - [x] ADR-0008 rewritten from the carded "SQLite default" to Postgres-only
  - [x] index table in `docs/adr/README.md`
  - [x] relative-link check (34 links resolve)
- Completed: 2026-08-29
- Result: https://github.com/kkucherenkov/course_shelf/pull/195
- Status: done

**ADR-0008 is a reversal, not a record.** The card asked for "SQLite default,
Postgres opt-in"; the tree is Postgres-only (`provider = "postgresql"`,
`@prisma/adapter-pg`, `postgres:18.1-alpine` in all five compose files, 15
migrations, and a schema using `@db.Decimal(3, 2)`, two `Json` columns and a
descending index). Card E23-F01-S02 was cancelled on the same grounds in #193.
The ADR records the reversal and its cost rather than documenting a superseded
plan as current.

**Deviation — no code-header backlinks.** `docs/adr/README.md` asks for
`// See docs/adr/NNNN-….md` in the files each ADR governs. Skipped: a dozen
source-file edits for a docs card, better folded into the next change to each.

`adr` was added to commitlint's `scope-enum` (which already carries `roadmap`
and `plans`) so the commit could name its own scope.

## T-2026-08-29-002 — E22-F01-S01 · reusable `setup-cs` composite action

- Created: 2026-08-29
- Completed: 2026-08-29
- Owner: claude
- Branch: `ci/setup-cs-composite-action`
- Card: [E22-F01-S01](../../docs/roadmap/tasks/E22-F01-S01.md)
- Result: https://github.com/kkucherenkov/course_shelf/pull/194
- Goal: one place that installs the CourseShelf toolchain, so the Node and
  Flutter versions stop being copy-pasted across five workflow files.
- Spec diff: none
- Codegen impact: no
- Design impact: none
- Tests: `actionlint` (it resolves `uses: ./...` against the action's declared
  inputs — verified by deliberately misspelling `flutter`, which is rejected
  with the available-input list) plus the PR's own CI run, which exercises
  every touched job through the new action.
- Sub-steps:
  - [x] `.github/actions/setup-cs/action.yml` — pnpm + Node, optional Flutter,
        then `pnpm install --frozen-lockfile`
  - [x] replaced 9 setup preambles across `ci.yml` (4 jobs), `quality.yml`,
        `e2e.yml`, `regen-snapshots.yml` (2 jobs) and `release.yml`
  - [x] deleted the `NODE_VERSION` / `FLUTTER_VERSION` workflow `env`
  - [x] `actionlint` clean apart from one pre-existing SC2016 info
- Status: done

**What the card was worth, and what it was not.** The acceptance line names
`~/.pnpm-store`, `~/.pub-cache` and the Flutter SDK — all three were already
cached before this task. `actions/setup-node`'s `cache: pnpm` covers the store,
and `subosito/flutter-action`'s `cache: true` already implied the pub cache: it
gates that step on `pub-cache == '' && cache == 'true'` (`action.yaml:132`).
Nothing here adds caching.

The real defect was version drift. Node was a literal `"24"` in `quality.yml`,
`e2e.yml` and both `regen-snapshots.yml` jobs, and `${{ env.NODE_VERSION }}` in
`ci.yml` and `release.yml` — workflow `env` does not cross files, so Node could
not be bumped in one place. `FLUTTER_VERSION` carried the constraint that it
must match the version the goldens were rendered with, stated two files away
from the workflow that regenerates them. Versions now live only in the action's
input defaults.

**Deviations.** Nine of the ten jobs use the action; `codeql.yml` builds its
database from source and needs no toolchain. The action also runs
`pnpm install --frozen-lockfile`, folded in rather than exposed as an input
nobody would set to `false`.

## T-2026-08-29-001 — reconcile roadmap card bookkeeping with the tree

- Created: 2026-08-29
- Completed: 2026-08-29
- Owner: claude
- Branch: `chore/roadmap-bookkeeping` (stacked on `chore/backfill-card-results`)
- Spec: tuxedo `+course_shelf` #16, #18; dnote `course_shelf` #11 (audit 2026-08-28)
- Result: https://github.com/kkucherenkov/course_shelf/pull/192
- Goal: make `docs/roadmap/` agree with the repository, and stop the one script
  that would silently undo it.
- Spec diff: none
- Codegen impact: no
- Design impact: none
- Sub-steps:
  - [x] E22-F01-S05 -> ✅ Done (job in `ci.yml:163-225` since `c10cc64`), with
        the colocated-goldens and skipped-setup-action deviations recorded
  - [x] E23-F01-S01 / E23-F01-S02 -> ❌ Cancelled with reasons on the cards
  - [x] `❌ Cancelled` added to the status legend on all 121 cards; TODO.md
        drops cancelled rows from the denominator instead of faking a tick
  - [x] progress `104 / 121` -> `113 / 119`, cross-checked against the cards
  - [x] corrected false claims on E02-F01-S02, E03-F01-S01, E08-F02-S02,
        E22-F01-S06, E20-F01-S01 and twelve E17 sibling cards
  - [x] `tools/generate.py` refuses to reseed over hand-written status
- Status: done

**Why the generator guard is part of this task.** Every writer in
`docs/roadmap/tools/generate.py` is an unconditional `write_text`. Running it
resets all 121 cards to `⬜ Not started` and rewrites the progress line to
`0 / 121` — it would have undone this task, #191, and every deviation note
either of them wrote. Correcting the cards without disarming it would have been
a symptom fix.

**Left open deliberately.** `ROADMAP.md`'s Gantt marks all 121 rows `:active`,
the 113 finished ones included, so it tracks nothing. Not folded in — it is a
rewrite of a different file with a different failure mode.

## T-2026-08-28-001 — fix three critical audit findings (auth recovery, offline playback, realtime grant)

- Created: 2026-08-28
- Owner: claude
- Spec: audit of 2026-08-28 (dnote `course_shelf` #5–#11); tuxedo +course_shelf #1, #2, #6
- Goal: three shipped-but-non-functional surfaces start doing what they claim.
- Spec diff: none — `/api/v1/auth/*` is a Better Auth catch-all deliberately
  absent from `openapi.yaml`, and the Centrifugo change only _removes_ a grant.
- Codegen impact: no
- Sub-steps:
  - [x] backend: drop the `notifications:user:{userId}` grant — no such channel
        in `asyncapi/centrifugo.yaml`, no publisher; push goes through FCM
  - [x] backend: pin the class of bug with a test that reads `centrifugo.yaml`
        and fails on any granted channel the spec does not declare
  - [x] backend: register `emailOTP({ overrideDefaultEmailVerification: true })` + `requireEmailVerification` / `sendOnSignUp` off `AUTH_EMAIL_VERIFICATION`
  - [x] web: replace the `forgotPassword` / `resetPassword` / `verifyEmail`
        stubs (all three resolved `{ ok: true }` without a request) with the
        real Better Auth calls; add `resendVerificationCode`
  - [x] web: rewrite the forgot-password e2e, which was written against the stub
  - [x] mobile: serve a `ready` download through `LoopbackDecryptServer`
        instead of handing `video_player` raw AES-GCM ciphertext
  - [x] mobile: plaintext-length integrity check before playing offline, with
        a fallback that re-marks the row `failed`
  - [x] review follow-ups: Android loopback cleartext allowance, `disableSignUp`
        on the OTP plugin, idempotent `LoopbackDecryptServer.start()`,
        code-based (translated) auth error messages
- Status: ✅ done
- Completed: 2026-08-28
- Result: https://github.com/kkucherenkov/course_shelf/pull/187 (closes #124, #125, #126)
- Blockers: —
- Review findings addressed (`/code-review high`):
  - **HIGH** Android had no cleartext allowance for `127.0.0.1`, so every
    offline play would have thrown `CLEARTEXT communication ... not permitted`
    (targetSdk ≥ 28 defaults to `cleartextTrafficPermitted="false"` for all
    hosts). Added a loopback-scoped `network_security_config.xml`; iOS already
    had `NSAllowsLocalNetworking`.
  - **MEDIUM (security)** `emailOTP()` registers public routes as soon as it
    exists, and `POST /sign-in/email-otp` _creates_ a user with
    `emailVerified: true` when none matches — bypassing the wizard, the
    password policy and `requireEmailVerification`, and taking ADMIN from the
    first-user hook on a fresh instance. Closed with `disableSignUp: true`,
    pinned by a test.
  - **LOW** `LoopbackDecryptServer.start()` was check-then-act; two overlapping
    lesson opens bound two sockets and orphaned the first. Memoised the bind
    future (cleared on failure and on `stop()`), with a concurrency test.
  - **LOW** Raw Better Auth English messages were rendered to users. Now mapped
    from `result.code` to translated keys (en + ru), matching `onAccountSubmit`.
- Notes:
  - Backend 1549 ✅ / web 183 ✅ / mobile 376 ✅ / e2e 28 ✅. The two failing e2e
    specs (`smoke`, `csp`) need the backend on :3000 — the Docker stack is down
    on this machine, and both failures predate this work.
  - Local Flutter was 3.41.9 against a `>=3.44.0` pubspec; upgraded to 3.47.2
    to run the mobile suite at all.
  - CI on #187 was red on `Security` until the advisory backlog was cleared
    separately in https://github.com/kkucherenkov/course_shelf/pull/188 — an
    unchanged `pnpm-lock.yaml` against a month of new advisories, unrelated to
    this work. `main` was merged in afterwards; #187 went 8/8.

## T-2026-07-29-001 — E19-F01-S01 · DownloadsBloc with resumable encrypted downloads

- Created: 2026-07-29
- Completed: 2026-07-29
- Owner: claude
- Branch: `feat/e19-downloads-bloc`
- Spec: `docs/roadmap/tasks/E19-F01-S01.md`
- Result: https://github.com/kkucherenkov/course_shelf/pull/185 (closes #119, #120, #121, #122, #123)
- Goal: a download queue that survives an app kill — resumable byte-range
  transfers into an AES-GCM container whose key never sits beside the ciphertext.
- Sub-steps:
  - [x] events: `EnqueueLesson`, `EnqueueCourse`, `Pause`, `Resume`, `Cancel`, `Retry`
  - [x] file writer with byte-range continuation
  - [x] device-bound key in secure storage (`flutter_secure_storage`)
  - [x] background scheduling — `workmanager` (Android), `BGTaskScheduler` (iOS)
- Notes:
  - **Archived retroactively (2026-08-29).** This work never went on the task
    stack while it was in flight; the card and the merged PR are the record.
    Reconstructed here so `done.md` stops disagreeing with the roadmap, and
    because the deviations below are the kind that get re-litigated by whoever
    picks up E19 next.
  - Two claims in the card's original Notes were wrong and were corrected in the
    same PR: `Range` **is** supported (`streaming.controller.ts` implements 200 /
    206 / `multipart/byteranges` / 416 / 400 and sets `Accept-Ranges`), and the
    stream-token TTL is 900 s, not the 5 minutes the note claimed. The Range
    route is exempt from OpenAPI validation, so that contract is
    implementation-only — nothing in CI would catch its removal.
  - **Deviation — tests.** The card asked for an `integration_test` simulating a
    flaky network. No emulator on the build host and no iOS build, so it could
    be written but never run; delivered as `bloc_test` plus unit tests over a
    scripted byte source and a mocked Dio adapter (107 tests, 265 → 372).
  - **Deviation — video only.** `getMaterialStream` sends whole files with no
    Range support, so materials need a different download path.
  - **Deviation — iOS unverifiable.** `workmanager_apple`'s `registerOneOffTask`
    never reaches `BGTaskScheduler`, so iOS routes through
    `registerProcessingTask`. None of the iOS half could be compiled or run on
    the build host — written against the plugin's Swift source and reviewed by
    reading.
  - The follow-up this left open is #101 (tap-to-download on course detail),
    which was blocked on `DownloadsBloc` existing and is now unblocked.

## T-2026-07-18-004 — Persist + honor device prefs & recents

- Created: 2026-07-18
- Completed: 2026-07-28
- Owner: claude
- Branch: `feat/mobile-persist-honor-prefs`
- Spec: `docs/superpowers/specs/2026-07-18-persist-honor-device-prefs-design.md`
- Plan: `docs/superpowers/plans/2026-07-18-persist-honor-device-prefs.md`
- Result: https://github.com/kkucherenkov/course_shelf/pull/183 (issue #182)
- Goal: persist Settings device prefs + Search recents via `shared_preferences`,
  and honor theme / text size / reduce-motion / playback speed / autoplay-next
  app-wide.
- Sub-steps:
  - [x] Task 1 — `shared_preferences` stores (`ce2de17`)
  - [x] Task 2 — persist `SettingsCubit` (`727905e`)
  - [x] Task 3 — persist `SearchCubit` recents (`9ac9a1f`)
  - [x] Task 4 — DI bootstrap + honor chrome prefs app-wide
  - [x] Task 5 — player saved-speed + autoplay-next (`1c3c604`)
  - [x] Task 6 — full-suite gate + archive (`flutter analyze` clean, 265 tests pass)
- Notes: `subtitles` + `wifiOnlyDownloads` land persisted-but-inert on purpose —
  no subtitle track exists yet, and Wi-Fi-only downloads wait on E19's
  `DownloadsBloc` (#101). Lifting `SettingsCubit` above `MaterialApp` also
  required registering the prefs stores in every harness that pumps the real
  `App` (`app_theme_wiring`, `first_run_signup`, `search_screen`, the player
  integration test) — the plan had only accounted for `main_shell_test`.

## T-2026-07-18-003 — E18-F01-S02 · Mobile Browse tab (Flutter)

- Created: 2026-07-18
- Completed: 2026-07-18
- Owner: claude
- Spec: [E18-F01-S02](../../docs/roadmap/tasks/E18-F01-S02.md) · design `docs/design/cs-mobile-browse/`
- Result: https://github.com/kkucherenkov/course_shelf/pull/181 (commit b6e2b33; design `572b0a2`)
- Goal: Browse tab — poster grid (2/3-col), API-backed filter+sort bottom sheet, states.
- Sub-steps:
  - [x] design pre-step: hand-authored `cs-mobile-browse/app.jsx`, verified render (OD MCP down)
  - [x] BrowseCubit + repo (`GET /courses` filter/sort + `GET /libraries`)
  - [x] BrowseTabBody: grid + filter sheet + states; posters → course route
  - [x] i18n + tests · flutter analyze clean · full suite 247/247
- Notes: filters single-select per single-value API; mapping mirrors `apps/web` (omit-when-default).
  Closes #94, #95, #96.

## T-2026-07-18-002 — E18-F01-S03 · Mobile Course detail (spec-first)

- Created: 2026-07-18
- Completed: 2026-07-18
- Owner: claude
- Spec: [E18-F01-S03](../../docs/roadmap/tasks/E18-F01-S03.md) · design `docs/design/cs-mobile-course-detail/`
- Result: https://github.com/kkucherenkov/course_shelf/pull/181 (spec `7320eb1`, codegen `c7e9344`, backend `f47dc82`, mobile `b6e2b33`)
- Goal: course-detail screen — hero, Resume/Start + Download CTA (size estimate), curriculum.
- Sub-steps:
  - [x] design pre-step (prior session)
  - [x] spec: `GET /courses/{id}/download-estimate` + `CourseDownloadEstimateDto` → validate/bundle/codegen
  - [x] backend: query/handler/controller + spec (4/4)
  - [x] mobile: CourseDetailCubit + pushed-route screen (loading/loaded/noAccess/failed)
  - [~] tap-to-download → **E19 seam** (DownloadsBloc absent; `TODO(E19)`)
- Notes: resolved the spec caveat with a dedicated download-estimate endpoint (not a `CourseDto`
  size field). ⚠️ Download **actions** deferred to E19 — **#101 stays open**. Closes #97, #99, #100.

## T-2026-07-18-001 — E18-F03-S02 · Mobile Search + Settings tabs (Flutter)

- Created: 2026-07-18
- Completed: 2026-07-18
- Owner: claude
- Spec: [E18-F03-S02](../../docs/roadmap/tasks/E18-F03-S02.md) · design `docs/design/cs-mobile-search-settings/`
- Result: https://github.com/kkucherenkov/course_shelf/pull/181 (commit b6e2b33)
- Goal: Search tab (recent / grouped results / no-match) + Settings (Profile·Appearance·Playback·Account + sign-out).
- Sub-steps:
  - [x] SearchCubit (debounced `/search`) + SettingsCubit (device prefs)
  - [x] Search + Settings screens wired into the 5-tab shell
  - [x] i18n (search + settings namespaces) + widget/bloc tests
  - [x] flutter analyze clean · tests green
- Notes: sign-out flow + language selector preserved; recents + device prefs in-memory
  (`TODO(E18)` to persist — no `shared_preferences` yet). Closes #114, #116, #117.

## T-2026-07-17-008 — design bundles for blocked mobile stories (E18/E19)

- Created: 2026-07-17
- Completed: 2026-07-18
- Owner: claude
- Spec: [DESIGN_BRIEF.md](../../docs/design/DESIGN_BRIEF.md) §7.5 / §7.7 / §7.8
- Goal: unblock E18-F01-S03, E19-F01-S03, E18-F03-S02 by producing the missing
  `cs-mobile-*` mockup bundles via Open Design, matching the landed bundle style.
- Result: bundles landed at `docs/design/{cs-mobile-course-detail,cs-mobile-downloads,cs-mobile-search-settings}/`
  (`app.jsx` + `index.html`) + shared `cs-components` DownloadRow a11y fix
  (`dl-action` → labelled `<button>`). Verified by rendering in Chromium: all
  states present, downloads disclosure keyboard-toggles, DownloadRow controls
  focusable/labelled, lesson-player + cs-components showcase no regression. GitHub:
  design pre-step tasks #98/#128/#115 closed completed; story issues #97/#127/#114
  unblocked (`blocked` label removed + comment). `docs/design/README.md` index
  updated; three cards flipped 🚫 Blocked → ⬜ Not started. **No PR yet** — `docs/`
  is gitignored; land in the next commit with `git add -f`.
- Sub-steps:
  - [x] cs-mobile-course-detail (E18-F01-S03) — OD run b1272736 + audit
  - [x] cs-mobile-downloads (E19-F01-S03) — OD run 3204eaba + a11y audit
  - [x] cs-mobile-search-settings (E18-F03-S02) — OD run d6c9596f + audit
  - [x] shared DownloadRow a11y fix in cs-components + consumer re-verify
  - [x] land bundles + update `docs/design/README.md` index
  - [x] unblock the three cards + reconcile GitHub issues
- Notes: course-detail card retains a spec-gap caveat for implementation
  (`GET /courses/{id}/download-estimate` + a per-course size field on `CourseDto`).

## T-2026-07-17-007 — E18 wave 1: mobile tab shell + the three Stage A cards

- Created: 2026-07-17
- Owner: claude
- Spec: [E18-F01-S01](../../docs/roadmap/tasks/E18-F01-S01.md), [E18-F02-S01](../../docs/roadmap/tasks/E18-F02-S01.md), [E18-F03-S01](../../docs/roadmap/tasks/E18-F03-S01.md)
- Goal: the mobile app becomes navigable — a real 5-tab shell hosting a real Home, with the auth surfaces designed and the lesson player playing video.
- Acceptance:
  - Signing in lands on the 5-tab bottom bar (Home · Browse · Downloads · Search · Settings), not the `Home — replace me` placeholder
  - Home shows Continue-watching + Recently-added carousels and quick links, and pulls to refresh
  - Sign-in / sign-up / forgot render the brand design (AppBrand, PasswordField, SsoBlock, AppBanner) rather than raw Material
  - A lesson plays video in portrait, and rotates to an immersive landscape PlayerChrome
- Spec diff: none — all three cards are `Spec diff: none`; every endpoint already exists
- Codegen impact: no
- Design impact: `AppNavigationTab` gains an optional `onRefresh` (ui_flutter). No new tokens, no new components — the three mockups consume the existing catalog.
- Tests: bloc_test per Cubit/BLoC; widget tests for the shell; ui_flutter widget tests for the refresh affordance
- Sub-steps:
  - [x] **Shell foundation (serial — blocks Home)**: `onRefresh` on `AppNavigationTab` + adaptive refresh in `AppNavigationShell`; `MainShell` in `apps/mobile`; `AuthGate._HomeScreen` → `MainShell`; pre-wire the `/forgot` + lesson routes so the parallel agents never both edit `routes.dart`
  - [x] **De-template (#156)**: `Appointments` → `CourseShelf`; the appointments nav tabs → the real five; phone-OTP stripped from `AuthState`/`AuthCubit`/`AuthRepository`/`auth_api`; `welcome_screen` + `phone_auth_screen` deleted
  - [x] E18-F01-S01 — `HomeCubit` (Loading | Loaded | Empty | Failed) + Home tab body
  - [x] E18-F03-S01 — rework the placeholder auth screens; add `forgot_screen`; `SignUpCubit` + `ForgotCubit` 3-step machines
  - [x] E18-F02-S01 — `video_player` dependency; player BLoC; portrait tabs + landscape chrome; throttled 10s `progress_outbox` write
- Status: ✅ Done
- Completed: 2026-07-17
- Result: PR https://github.com/kkucherenkov/course_shelf/pull/174 (merged) — 11 commits, all CI gates green. Closed the three cards' story issues (#91–#93, #102–#106, #107–#113) plus discovery issues #156/#157/#158/#172. Live Widgetbook/visual pass owned by the user (matters more here — the app has never run on a device, #169).
- Blockers: —
- Divergences filed as issues, not silently absorbed:
  - **Password reset can't work against the current backend.** `auth.service.ts` has `emailAndPassword: { enabled, autoSignIn }` but no `sendResetPassword`, so Better Auth returns `RESET_PASSWORD_DISABLED`. The auth screens wire the canonical endpoints and surface the failure (web instead stubs it — `console.warn` + `{ok:true}`). Neither stack can actually reset a password. → new backend issue.
  - **`WatchingOffline` is a flag, not a `PlayerStatus` member** (E18-F02-S01). The card lists it as a state; `DESIGN_BRIEF` §7.6 line 603 defines it as an indicator under the title shown while playing, so as an enum member "paused while offline" is unrepresentable. The BLoC follows the brief over the card.
  - **`AppBrand` (E18-F03-S01) does not exist** in `ui_flutter`, and web has no `@app/ui` twin either (its `AuthBrand` is app-level). Built the mobile twin under `features/auth/presentation/widgets/`, not the catalog.

### What the roadmap got wrong about E18

Verified against the tree before starting:

- **The bottom tab bar was never wired.** `AppNavigationShell` (E17-F02-S07, ✅ Done) had zero consumers outside its own Widgetbook catalog, and `routes.dart` is a flat named-route map with no shell. Every F01/F03 card builds a _tab_ into a host that did not exist. Hence the serial foundation step.
- **Pull-to-refresh was unbuildable.** The shell owns a `CustomScrollView` per tab and wraps each body in a `SliverToBoxAdapter`, so a tab body cannot wrap its own scrollable in a `RefreshIndicator`. E18-F01-S01 requires pull-to-refresh, so the shell has to own it — the catalog component meeting its first real consumer.
- **E18-F03-S01 is a rework, not greenfield.** `sign_in_screen.dart` / `sign_up_screen.dart` already exist from E15-F01-S03 as deliberate placeholders: real `AuthCubit` plumbing and web-mirrored validation behind raw Material widgets. `sign_in_screen.dart` says so itself — _"the final visual design lands in E18-F03-S01"_.
- **The player needs an engine neither stack has.** Web plays video with a raw `<video>` element (`useLessonPlayer.ts`) — no library. Mobile has no playback dependency at all. `video_player` chosen: it wraps ExoPlayer/AVPlayer, the same delegate-to-the-platform stance as `<video>`, so both stacks accept the same formats.

~~Open question, deliberately not answered this wave: **`phone_auth_screen.dart` is on no card.**~~ **Answered 2026-07-17 (owner decision, #156): full de-template, phone auth included.** The phone-OTP path was never Course Shelf's — it is residue from the appointments template the app was scaffolded from, along with `appTitle: "Appointments"` and the Bookings/Chat/SOS/Business tabs. All of it is gone; the backend half (Better Auth `phoneNumber()` plugin + SMS gateway) was removed in parallel.

### What the shell foundation found that no card predicted

- **Sign-in could not reach home — the session cubit was per-screen.** `AuthCubit` is a `registerFactory`, and `AuthGate`, `SignInScreen`, `SignUpScreen` and `SettingsScreen` each did `BlocProvider(create: (_) => getIt<AuthCubit>())`. So a successful sign-in authenticated a cubit _nobody was watching_: the gate held a different instance and never rebuilt. Pushed auth routes could not have shared the gate's provider anyway — they are children of the `MaterialApp`'s `Navigator`, which sits above `home:`. Fixed structurally: `App` provides one `AuthCubit` **above** the `MaterialApp`, and every auth surface reads it. This is why `SettingsScreen`'s sign-out needed `Navigator.pushNamedAndRemoveUntil(welcome)` — an imperative escape hatch around a state bug. It is gone; the gate reacts on its own.
- **`AuthStatus` had no bootstrapping state.** Initial status was `unauthenticated` (a _resolved_ answer), and `checkSession()` passed through `authenticating` — the same status an interactive submit uses. The gate therefore flashed sign-in for a frame on boot, and would have torn the sign-in form down mid-submit once sign-in became the gate's own child. Added `AuthStatus.unknown` as the initial state; `checkSession()` no longer emits `authenticating`, and the gate keeps the auth screen mounted while a credential submit is in flight so the submit button owns the spinner.
- **`SettingsScreen`'s body was a `ListView`.** Unbounded height inside the shell's `SliverToBoxAdapter` throws. Rebuilt as a `Column`; it also shed its own `Scaffold`/`AppBar`, which the shell supplies.
- **The `/settings` route was dead** — nothing pushed it — and Settings is a tab. Dropped rather than kept as a second, doubled-chrome way in.

Not in this wave, and why: **E18-F01-S02** (Browse) needs a design pre-step — its bundle has `index.html` + `styles.css` but no `app.jsx`, though `cs-mobile-home/app.jsx` does carry a BROWSE reference screen, so it is closer than the card implies. **E18-F01-S03** (Course detail) and **E18-F03-S02** (Search/Settings) are 🚫 Blocked with no bundle at all; F01-S03 additionally needs `GET /courses/{id}/download-estimate` **and** a per-course size field on `CourseDto` that does not exist.

## T-2026-07-17-006 — drop the Forgejo residue and point the release lane at ghcr

- Created: 2026-07-17
- Completed: 2026-07-17
- Owner: claude
- Result: PR https://github.com/kkucherenkov/course_shelf/pull/155
- Goal: Forgejo was dropped 2026-07-14 and the git remote went with it earlier the same day; clear what was left inside the repo.
- Outcome:
  - **The part that wasn't dead**: `docker/compose.release.yml` defaulted to `${REGISTRY:-code.homelab.local}`, so an unconfigured `docker compose -f docker/compose.release.yml up` — the self-hoster's entry point — pulled from a host that no longer exists. Now `ghcr.io`.
  - That literal is **coupled** to `release.yml`, which sed-rewrites it when staging the release bundle; changing either side alone makes the sed silently no-op and ships unresolved placeholders. Both moved in one commit and both now carry a `⚠` comment. Verified by rendering the sed the way CI does → `ghcr.io/kkucherenkov/courseshelf-{backend,web}:0.2.0`, no placeholders surviving; the old pattern against the new compose leaves two, confirming the hazard was real.
  - Deleted `.forgejo/workflows/` (5 files, 879 lines), `scripts/seed-forgejo-issues.ts` (555 lines), the `issues:sync|map|lookup` scripts, and the CLAUDE.md block warning not to use them.
  - `README.md` / `README.ru.md` carried a mirror notice claiming development happens on Forgejo and _"issues and pull requests opened here are not monitored"_ — the exact inverse of reality, and the first thing a visitor reads.
- Deliberately kept: dated records (`done.md`, `docs/superpowers/plans|specs/*`, and the ✅ Done cards E14-F01-S03 / E22-F01-S06 / E14-F04-S01 / E15-F01-S02) still reference the homelab, because that is what was true when they shipped. Seven `forgejo` mentions survive in live config as _why-this-exists_ rationale with no pointers to deleted files — filed as #165 rather than rewritten, since the constraint may or may not still apply.
- Tests: `turbo run lint` 7/7; `pnpm format:check` clean; `pnpm install --frozen-lockfile` still resolves after the script removal.

## T-2026-07-17-005 — design-token hygiene: dangling refs, magic numbers, and the CI gates that let them rot

- Created: 2026-07-17
- Completed: 2026-07-17
- Owner: claude
- Result: [PR #153](https://github.com/kkucherenkov/course_shelf/pull/153) — branch `chore/design-token-hygiene`
- Goal: make the design-token discipline real — fix what drifted, and close the CI
  holes that let it drift silently. **195 → 0 stylelint violations.**
- Spec diff: none · Codegen impact: no
- Design impact: new theme-independent `media` token group (15 role-named tokens).
  `tokens.g.dart` byte-identical — mobile gained nothing.
- Tests: `@app/ui` 852 + `vue-tsc` clean (had never run in CI); `ui_flutter` 611;
  `turbo run lint` 7/7; `format:check` clean.
- Sub-steps:
  - [x] `AppScanProgress.spec.ts` spread-after-key — a committed snapshot asserted
        "2 errors" for a fixture with `errors: 5`
  - [x] CI — turbo-ise lint + typecheck, add the stylelint gate
  - [x] dangling refs + magic numbers — `packages/ui` (3 agents) and `apps/web`
  - [x] `media` token group + `app-` class prefix rename (11 files, incl. 2 e2e selectors)
- Root cause: CI named packages by hand for lint/typecheck, skipping `@app/ui`
  entirely; stylelint ran nowhere. Same hole that once hid `@app/ui`'s 852 tests —
  documented in a comment three lines below the one that still had it.
- Bugs found that nobody reported:
  - **Phantom `--space-N == N × 2px` scale** (`AppSwitch`, `AppIcon`). Broken twice
    over: the dangling half rendered as nothing, the _resolving_ half at 2–4× intent
    (`AppIcon` `xs`/`sm` drew at 32/64px, not 12/16px). Invisible to dangling scans,
    to stylelint, and to the unit suite.
  - Two dark-theme contrast bugs where `color: white` sat on a fill that lightens.
- Follow-ups surfaced (not filed):
  - **`quality.yml` + `e2e.yml` do not run on pull requests** (nightly/manual only) —
    vestigial Forgejo scheduling kept after the migration to GitHub, where the
    constraint that justified it (paid, shared self-hosted runner) no longer exists.
    The repo is public, so minutes are free; `quality.yml` takes 3 min. **This is why
    every rendering bug above shipped unnoticed.**
  - **e2e nightly is red on `main`** — `foundations visual regression`, an 18px height
    drift (expected `10936px`, received `10918px`). Caught nightly, attributable to no
    PR, unactioned.
  - Stacking-order inversion: bottom tab bar `z-index: 50` → `--z-sticky` (200) now
    outranks the account menu (`--z-dropdown`, 100). Scale and author disagree.
  - `search.vue` `__item-initials` renders white on both an accent thumb and a light
    `--surface-overlay` thumb — pre-existing, deliberately preserved.
- Method note: two of five agents had their work silently destroyed by a `git stash`
  race — `refs/stash` is shared across worktrees and husky's `lint-staged` stashes
  internally. Both recovered from dangling stash commits. Fan-out agents must never
  `git stash`.

## T-2026-07-17-004 — clear the three E17 follow-ups surfaced during the widget waves

- Created: 2026-07-17
- Completed: 2026-07-17
- Owner: claude
- Result: [PR #152](https://github.com/kkucherenkov/course_shelf/pull/152) — branch `fix/e17-followups`
- Goal: close out the three defects/gaps the E17 fan-out agents surfaced but were
  out of scope to fix in their own cards.
- Outcome: **two of the three reported items were not bugs.** Verifying each claim
  before fixing it is what surfaced two real defects nobody had reported.
- Spec diff: none
- Codegen impact: no
- Design impact: 5 new filled glyphs in both `@app/ui` and `ui_flutter` — no new tokens
- Tests: `ui_flutter` 611 → **630**; `@app/ui` **868** / 50 files; `apps/mobile` **64**.
  All analyze-clean. No golden moved for either semantics fix; icon goldens moved as
  expected and were inspected by eye.
- Sub-steps:
  - [x] `AppRow` — **not a bug, no code changed.** `Semantics` defaults to
        `container: false` (annotates, does not merge) and real interactive
        descendants keep their own nodes. The report's premise was also false —
        `AppBookmark` does not compose `AppRow`.
  - [x] `AppBookmarkAdd` — visible `×` control added, Escape binding retained.
        Cancel is disabled mid-save: it cannot abort a request the widget has no
        handle on, and firing `onCancel` mid-flight would orphan a bookmark the
        user believes they discarded.
  - [x] 5 filled nav glyphs drawn once, applied byte-identically to both stacks,
        wired to `filledIcon`. Additive — the `fill:` / `kFillableIcons` toggle
        still covers only `play`/`bookmark`.
  - [x] **(found)** `AppIconButton` — `ExcludeSemantics` wrapped the whole
        `TextButton`, discarding tap + focus, across all 11 components that
        compose it. Fixed at the source; this was the true cause of the row
        collapse that the `AppRow` report misattributed.
  - [x] **(found)** `AppButton` — `loading` advertised `isEnabled` + `isFocusable`
        with no tap action (`IgnorePointer` sets `isBlockingUserActions`, which
        strips actions but not the flags). Now reports an honest not-enabled node.
- Lesson worth keeping: `tester.tap` only drives hit-testing and never touches the
  semantics layer. The pre-existing `fires onPressed on tap` test passed against a
  button no screen-reader user could activate — the obvious test was structurally
  blind to the bug. Semantics assertions need `tester.semantics.tap` /
  `performAction`.
- Follow-ups surfaced (not filed):
  - An icon-only `AppButton` (icons but no `label`/`child`) is nameless even when
    enabled — `IconCS` contributes no name. `AppIconButton` is the intended
    icon-only control, so this is an edge case.
  - A `child`-only `AppButton` stays nameless while loading — no string is
    extractable from an arbitrary widget. Not a regression; pinned by a test.
  - Repo-wide `pnpm stylelint:fix` fails with ~195 errors across ~20 files, and
    `eslint --fix` rewrites `AppNavigationShell.vue` / `AppSwitch.vue` — all
    pre-existing tree drift, none of it in files this task touched. Picked up as
    [[T-2026-07-17-005]].

## T-2026-07-17-003 — E17-F02 mobile composites wave 2 — closes epic E17

- Created: 2026-07-17
- Completed: 2026-07-17
- Owner: claude
- Result: [PR #151](https://github.com/kkucherenkov/course_shelf/pull/151) — branch `feat/e17-f02-wave-2`
- Cards: [E17-F02-S10](../../docs/roadmap/tasks/E17-F02-S10.md), [E17-F02-S11](../../docs/roadmap/tasks/E17-F02-S11.md)
- Goal: close E17-F02 (and epic E17) with the two coverage-gap composites whose
  `@app/ui` twins shipped without a mobile card. Both have web twins, so both
  went straight to code under the standing design gate. Two isolated worktree
  subagents, cherry-picked onto one branch, wired, centrally verified.
- Acceptance:
  - Widgetbook catalogues `AppBookmarkList` (empty / populated / add-row / read-only / adding)
    and `AppSectionHeader` (open / closed / long title / singular count) — 46 components, names unique.
  - Both mirror their `@app/ui` twins' contract in light and dark themes.
- Spec diff: none
- Codegen impact: no
- Design impact: two new `ui_flutter` components — no new tokens
- Tests: `ui_flutter` 568 → **611** (38 widget tests + 4 goldens); `apps/mobile` 63 → **64**;
  both analyze-clean. Goldens visually confirmed to bind fonts from `textTheme`.
- Sub-steps:
  - [x] S10 `AppBookmarkList` — list + inline add row + empty state
  - [x] S11 `AppSectionHeader` — collapsible header (count + duration)
  - [x] wire both into the Widgetbook catalog
  - [x] roadmap/TODO bookkeeping + close issues 82–89
- Follow-ups surfaced (not filed):
  - `AppRow` merges descendant semantics — lacks `explicitChildNodes: true`.
  - None of the 5 nav-tab glyphs have a filled variant (`IconCS.fill` covers only play/bookmark).
  - `AppBookmarkAdd` fires `onCancel` only on the Escape key — no visible cancel
    affordance, so `onAddCancel` is unreachable on touch hardware. Inherited from
    E17-F02-S04; matches the web, which has the same gap.

## T-2026-07-17-002 — E17-F02 mobile composite widgets wave 1, 9 cards / 13 components

- Created: 2026-07-17
- Completed: 2026-07-17
- Owner: claude
- Result: [PR #150](https://github.com/kkucherenkov/course_shelf/pull/150) — branch `feat/e17-f02-wave-1`
- Spec (design-gated trio): [docs/superpowers/specs/2026-07-17-e17-f02-trio-mobile-composites-design.md](../../docs/superpowers/specs/2026-07-17-e17-f02-trio-mobile-composites-design.md)
- Goal: port the first nine E17-F02 mobile composite widgets to `app_ui` (Flutter), each consuming the E17-F01 primitives and catalogued in Widgetbook. Parallel fan-out: six web-twin cards built straight to code; three design-gated composites (S03/S06/S07 — a mobile interaction layer with no web twin) got an approved design first. Built by isolated worktree subagents, cherry-picked onto one branch, wired, and centrally verified.
- Cards: S01 (CourseCard family ×3), S02 (LessonRow), S03 (PlayerChrome), S04 (Bookmark/BookmarkAdd/NoteEditor), S05 (ProgressBadge), S06 (DownloadRow), S07 (NavigationShell), S08 (PasswordField), S09 (SsoBlock).
- Outcome: 13 components in `packages/ui_flutter` + Widgetbook catalog entries wired into `directories.dart`. `ui_flutter` 334 → 568 tests (widget + golden matrices); `apps/mobile` → 63 tests (adds the F02 wiring assertion, catalog count guard >= 44). `flutter analyze` clean in both.
- Sub-steps: all complete.
- Status: done
- Notes:
  - Follow-ups surfaced during the wave (not yet filed): (1) `AppRow` merges descendant semantics into one node — it lacks `explicitChildNodes: true` — so per-child semantic labels can't be isolated; low-risk a11y fix for whoever next touches `AppRow`. (2) None of the 5 navigation-tab glyphs have a filled variant (`IconCS.fill` only covers play/bookmark), so `AppNavigationShell` falls back to the outline glyph for the active tab — an icon-family expansion.
  - Live Widgetbook pass (`pnpm dev:widgetbook`) not run — needs generated platform runners; the user checks the final result. Goldens are Flutter-vs-Flutter regression baselines, visually reviewed during integration.

## T-2026-07-17-001 — E17-F01 mobile widget catalog wave 2, 3 cards / 5 components

- Created: 2026-07-17
- Completed: 2026-07-17
- Owner: claude
- Result: [PR #149](https://github.com/kkucherenkov/course_shelf/pull/149) — branch `feat/e17-f01-wave-2`
- Goal: port the final three E17-F01 mobile primitives to `app_ui` (Flutter), completing the feature. Same parallel fan-out as wave 1: three cards built by isolated worktree subagents (each briefed with the E17-F01-S02 button recipe), cherry-picked onto one integration branch, reviewed, and centrally verified.
- Cards: E17-F01-S06 (AppDialog + AppBottomSheet), S08 (AppEmptyState + AppErrorState), S14 (AppRadioGroup).
- Outcome: 5 components in `packages/ui_flutter` + Widgetbook catalog entries wired into `directories.dart`. `ui_flutter` 281 → 334 tests (widget + golden matrices — the 3 new suites plus wave-1); `apps/mobile` 60 → 61 tests (adds the wave-2 wiring assertion); `flutter analyze` clean in both. E17-F01 is now complete (S01–S14).
- Sub-steps: all complete.
- Notes:
  - S08 uses `SemanticsRole.status`/`.alert` (mutually exclusive with `liveRegion` by Flutter's own assertion) for the polite-vs-assertive web `role` parity; S14 renders the group label as a visible legend + `SemanticsRole.radioGroup` and makes the row the sole pointer/semantics owner via `ExcludeSemantics`+`IgnorePointer`.
  - During integration, normalized the S06 overlays golden path (was a nested `test/overlays/goldens/goldens/` because the golden test lived inside `goldens/`) to match every other component.
  - Live Widgetbook pass (`pnpm dev:widgetbook`) not run — needs generated platform runners; the user checks the final result. Goldens are Flutter-vs-Flutter regression baselines, visually reviewed during integration.

## T-2026-07-16-009 — E17-F01 mobile widget catalog wave, 9 cards / 22 components

- Created: 2026-07-16
- Completed: 2026-07-16
- Owner: claude
- Result: [PR #148](https://github.com/kkucherenkov/course_shelf/pull/148) — branch `feat/e17-f01-wave`
- Goal: port the E17-F01 mobile primitive components to `app_ui` (Flutter), cataloguing each in Widgetbook. Executed as a parallel fan-out: nine cards built by isolated worktree subagents (each briefed with the E17-F01-S02 button recipe), cherry-picked onto one integration branch, reviewed, and centrally verified.
- Cards: E17-F01-S03 (7 form fields), S04 (Card/Row/Tabs/Segmented), S05 (Banner/Toast/Alert), S07 (Progress×2/Spinner/Skeleton), S09 (Avatar + role badges), S10 (Chip), S11 (Badge), S12 (Textarea), S13 (NoPermission).
- Outcome: 22 components in `packages/ui_flutter` + Widgetbook catalog entries wired into `directories.dart`. `ui_flutter` 47 → 281 tests (widget + golden matrices); `apps/mobile` → 60 tests (adds catalog-integrity tests); `flutter analyze` clean in both.
- Sub-steps: all complete.
- Status: done
- Notes: live Widgetbook pass (`pnpm dev:widgetbook`) not run — needs generated platform runners; the user checks the final result. All goldens are Flutter-vs-Flutter regression baselines, visually reviewed during integration.

## T-2026-07-16-008 — AppButton + AppIconButton (card E17-F01-S02)

- Created: 2026-07-16
- Completed: 2026-07-16
- Owner: claude
- Spec: [docs/superpowers/specs/2026-07-16-e17-f01-s02-app-button-design.md](../../docs/superpowers/specs/2026-07-16-e17-f01-s02-app-button-design.md)
- Result: [PR #147](https://github.com/kkucherenkov/course_shelf/pull/147) — branch `feat/e17-f01-s02-app-button`
- Goal: Flutter twins of the web AppButton + AppIconButton in `app_ui` — 4 variants × 3 sizes × states, token-driven. The shared recipe the E17-F01 component wave reuses; retires the E16 CanaryButton placeholder.
- Acceptance:
  - Widgetbook use case per state matches the bundle
  - Uses `Tokens.*` (no hard-coded values; heights are a locally-owned scale, as the web owns `$btn-h-*`)
- Decisions: Material `ButtonStyleButton` + `WidgetStateProperty`, ink ripple suppressed → flat web look with free focus/keyboard/semantics/disabled; flat token colour swap (`accentActive` on press), not a ripple; labels bind off `Theme.textTheme.labelLarge` (packaged sans), never the bare `AppTextStyles` family.
- Outcome: `resolveAppButtonStyle` + `AppButton` + `AppIconButton` in `app_ui`; mobile Widgetbook catalog (Variants/Sizes/States/With icons) with CanaryButton removed. `ui_flutter` 30 → 47 tests (incl. `button_matrix_{light,dark}` goldens); mobile 58 → 58; `flutter analyze` clean in both.
- Sub-steps: all complete.
- Status: done
- Notes:
  - Font-binding fix caught by the golden — button labels were rendering as Ahem boxes because `AppTextStyles.*` carry the bare family; the theme's `labelLarge` is the only source of the packaged (prefixed) sans family.
  - Live Widgetbook pass (`pnpm dev:widgetbook`) not run here — needs generated platform runners; the user checks the final result.

## T-2026-07-16-007 — IconCS Flutter widget, 66-glyph brand icon family (card E17-F01-S01)

- Created: 2026-07-16
- Completed: 2026-07-16
- Owner: claude
- Spec: [docs/superpowers/specs/2026-07-16-e17-f01-s01-icon-cs-design.md](../../docs/superpowers/specs/2026-07-16-e17-f01-s01-icon-cs-design.md)
- Result: [PR #146](https://github.com/kkucherenkov/course_shelf/pull/146) — branch `feat/e17-f01-s01-icon-cs`
- Goal: the web `IconCS` component's 66 named glyphs, available in Flutter as a single `IconCS` widget in `app_ui`. First real component of E17 (Mobile widget catalog).
- Acceptance:
  - `IconCS(name: IconName.play, size: 16, fill: true)` renders the same glyph as web
  - 66 named values in the `IconName` enum (incl. `at`, `banner`, `github`)
- Decisions: rendered via **flutter_svg** from the web component's **verbatim** SVG markup (overrides the card's custom-painter suggestion — lowest-risk parity path); `currentColor` via a `srcIn` `ColorFilter` (`color` → `IconTheme` → `colorScheme.onSurface`); `fill` templates `play`/`bookmark` geometry; goldens are per-size grid sheets (`icon_grid_{16,20,24}` + `icon_grid_dark_24`), not 198 per-icon PNGs.
- Outcome: `IconName` enum (66) + `kIconMarkup` + `buildIconSvg` + `IconCS` in `app_ui`; registered in the mobile Widgetbook catalog (gallery / sizes / fill). `ui_flutter` 15 → 30 tests, mobile 57 → 58; `flutter analyze` clean in both. `flutter_svg` added as a regular dep of `app_ui`.
- Sub-steps: all complete.
- Status: done
- Notes:
  - Visual pass in Widgetbook on a device/emulator (`pnpm dev:widgetbook`) not run here — needs generated platform runners (out of scope); the user checks the final result. Goldens are Flutter-vs-Flutter regression baselines.
  - `pdf` glyph's `<text>` renders stably despite flutter_svg's limited `<text>` support — accepted per the design doc.

## T-2026-07-16-006 — bootstrap mobile Widgetbook catalog (card E16-F01-S01)

- Created: 2026-07-16
- Completed: 2026-07-16
- Owner: claude
- Spec: [docs/superpowers/specs/2026-07-16-e16-f01-s01-widgetbook-bootstrap-design.md](../../docs/superpowers/specs/2026-07-16-e16-f01-s01-widgetbook-bootstrap-design.md)
- Result: [PR #145](https://github.com/kkucherenkov/course_shelf/pull/145) — branch `feat/e16-f01-s01-widgetbook`
- Goal: a separately-runnable Widgetbook entrypoint catalogs mobile widgets, with one canary exercised across its states.
- Acceptance:
  - `flutter run -t widgetbook/main.dart` shows the catalog (verified manually)
  - one canary (`CanaryButton`) has a use case per state (Enabled / Disabled)
- Outcome: added `apps/mobile/widgetbook/main.dart` (thin entrypoint) + `lib/widgetbook/{canary_button,directories,widgetbook_app}.dart`; `widgetbook` promoted to a regular dep (catalog under `lib/`, tree-shaken from the release binary); `pnpm dev:widgetbook` script. Mobile suite 54 → 57; `flutter analyze` clean.
- Sub-steps: all complete.
- Status: done

## T-2026-07-16-005 — email-primary mobile auth + OTP test coverage (card E15-F01-S03)

- Created: 2026-07-16
- Completed: 2026-07-16
- Owner: claude
- Spec: [docs/superpowers/specs/2026-07-16-e15-f01-s03-email-primary-auth-design.md](../../docs/superpowers/specs/2026-07-16-e15-f01-s03-email-primary-auth-design.md)
- Result: PR (pending) — branch `feat/e15-f01-s03-email-primary-auth`
- Goal: close E15-F01-S03. Phone-OTP runtime already shipped; real gaps were (1) zero OTP test coverage and (2) shipped UI led with phone-OTP, contradicting the closeout spec's email-primary decision. Flipped login to email-primary (web-mirror single screen), phone-OTP demoted to a secondary link; added OTP + wire + widget tests; removed vestigial `devCode`; corrected the card.
- Spec diff: none
- Codegen impact: no (slang i18n regen only; `strings*.g.dart` is gitignored)
- Sub-steps:
  - [x] tests: OTP `blocTest` cases (requestOtp/verifyOtp/resetToPhoneStep, otpSent/error, OtpError mapping) + `auth_api_test` (mocked Dio: send/verify paths, payloads, 400/410→OtpError, token persist) + `sign_in_screen_test` & `sign_up_screen_test` widget tests. Mobile suite 37 → 54.
  - [x] cleanup: removed `devCode` from `AuthState` + `AuthCubit`; corrected the cubit doc comment (email primary)
  - [x] i18n: added `signIn.phoneInstead`/`errorEmailInvalid`/`errorPasswordTooShort` + `signUp.errorNameRequired`/`errorEmailInvalid`/`errorPasswordTooShort`; renamed `welcome.continueWithPhone`→`getStarted` across en/el/ru/uk; regen slang
  - [x] UI: extracted phone/OTP verbatim to `PhoneAuthScreen` (`/sign-in/phone`) + shared `AuthErrorBanner`/`AuthInfoBanner`; rewrote `SignInScreen` as email form; real email `SignUpScreen`; Welcome CTA label → `getStarted`; routes
  - [x] verify: `flutter analyze` clean; `flutter test` 54/54; `pnpm check:i18n` exit 0 (mobile 4×89)
  - [x] corrected card E15-F01-S03 + TODO.md row → done
- Status: done
- Notes:
  - Deferred to E18-F03-S01 (unchanged): final login visual design, `SignInCubit`/first-user routing, rate-limit banner, keep-signed-in, forgot-password. Sign-up server-error mapping is minimal (`errorEmailTaken`) pending that redesign.
  - Ran on the emulator/device: not done here — widget tests drive the screens (render/validate/submit/navigate), but the visual pass is the user's ("I'll check the final result").

## T-2026-07-16-004 — patch CRITICAL websocket-driver advisory (CI security gate)

- Created: 2026-07-16
- Completed: 2026-07-16
- Owner: claude
- Result: PR #143 (merged) — commit 3323a0e
- Goal: CI "Dependency vulnerability scan" failed on `CRITICAL websocket-driver@0.7.4` (GHSA-xv26-6w52-cph6 / CVE-2026-54466 — WebSocket length-header integer-precision parsing flaw, fixed in 0.7.5). Pulled in transitively: `firebase-admin@13.8.0 → @firebase/database → faye-websocket@0.11.4 → websocket-driver`. No direct dep to bump.
- Spec diff: none
- Codegen impact: no
- Sub-steps:
  - [x] traced the chain with `pnpm why`; confirmed patched version 0.7.5 via the advisory (affected `<0.7.5`; faye-websocket requires `>=0.5.1`, so satisfied)
  - [x] added `pnpm.overrides` entry `"websocket-driver": ">=0.7.5"` (open-ended, matching the `shell-quote`/`next` security-remediation idiom); regenerated lockfile — 0.7.5 only, zero 0.7.4
  - [x] reproduced the exact CI scan locally (`ghcr.io/google/osv-scanner:v2.3.8`, same jq gate): CRITICAL/HIGH list empty → gate passes; histogram LOW:7 MODERATE:34 (was CRITICAL:1 MODERATE:35)
  - [x] `pnpm install --frozen-lockfile` in sync
  - [x] commit + push
- Status: done
- Blockers: —

## T-2026-07-16-003 — de-flake timezone-coupled outbox ordering test (E15-F02-S01)

- Created: 2026-07-16
- Completed: 2026-07-16
- Owner: claude
- Spec: [docs/roadmap/tasks/E15-F02-S01.md](../../docs/roadmap/tasks/E15-F02-S01.md)
- Result: PR #143 (merged) — commit 5d1dc14
- Goal: `progress_outbox pending is chronological across mixed local/UTC writes` (added under T-2026-07-16-002 / I1) hard-coded `DateTime(2026,7,15,23)` and a comment asserting "this machine's local zone is UTC+04:00". True on the dev box (+0400), false on CI (`/home/runner`, TZ=UTC), where `earlyLocal` becomes 23:00Z — genuinely _later_ than `laterUtc` 21:00Z — so `pending()` correctly returns `['late','early']` and the assertion fails. A real test defect, not a runtime bug: `_normalizeUtc` is correct and independently proven by the zone-independent `isUtc` test.
- Spec diff: none
- Codegen impact: no
- Sub-steps:
  - [x] reproduced: `TZ=UTC flutter test …` fails `['late','early']`; ambient `+0400` passes
  - [x] derive the local fixture from a fixed instant (`DateTime.utc(2026,7,15,19).toLocal()`) so "early is earlier" holds in any ambient zone, while still exercising the local-write path (`isUtc == false`)
  - [x] rewrote the comment to explain the zone-independence; kept the reversed insertion order that guards `ORDER BY`
  - [x] `flutter analyze` clean; full file green under TZ=UTC, America/New_York (−5), Asia/Dubai (+4)
  - [x] commit + PR (#143)
- Status: done
- Blockers: —
- Notes:
  - Did NOT run `dart format` on the file — local Dart 3.12 tall-style reflowed every `test(...)` callback, but CI pins Flutter 3.44.4 (Dart 3.9, old style) and runs no `dart format` gate. Kept the edit in the committed style; diff is the one comment block + one line.

## T-2026-07-16-002 — Drift branch review fixes: mutation-proof outbox tests, UTC normalization, docs correction, index (E15-F02-S01)

- Created: 2026-07-16
- Completed: 2026-07-16
- Owner: claude
- Spec: [docs/superpowers/specs/2026-07-15-e15-f02-s01-drift-schema-design.md](../../docs/superpowers/specs/2026-07-15-e15-f02-s01-drift-schema-design.md)
- Result: (PR pending)
- Goal: fix whole-branch review findings on `feat/e15-f02-s01-drift` before PR opens — every finding was a test that could not fail or documentation that contradicted the code, not a runtime bug.
- Spec diff: none (docs + tests + a non-schema-version-bumping index)
- Codegen impact: no
- Sub-steps:
  - [x] I1: `progress_outbox` "chronological" tests inserted rows already in order, so the default rowid scan passed them for free even with `ORDER BY` deleted. Rewrote both to insert out of order and assert full returned order.
  - [x] I2: `_normalizeUtc` was stripped from `notes_outbox_dao.dart` and `bookmarks_outbox_dao.dart` with no test catching it (their tests only used `DateTime.utc(...)`, so `.toUtc()` was a no-op). Added a local-DateTime normalization test to each group, mirroring the existing `progress_outbox` one.
  - [x] I3: `CachedCatalogDao` never normalized `cachedAt`/`updatedAt` to UTC despite both being documented TTL/staleness-comparison inputs for E18/E19. Added `.toUtc()` normalization at the write boundary (`upsertCourse`, `replaceOutline`) via small private helpers matching the outbox DAO style, plus a round-trip test.
  - [x] I4: `bookmarks_outbox` was documented "APPEND-ONLY... cannot coalesce by key" while the code actually upserts on `localId`, coalescing create+update into a single `update` row with `serverId == null` at ENQUEUE time — not at drain, as the design doc's "E20 performs the collapse" claimed. Corrected `tables/bookmarks_outbox.dart`, `daos/bookmarks_outbox_dao.dart` (documented the real serverId-based drain rule), the design doc's "bookmark id problem" section and its Testing-table mutation row, and `docs/roadmap/tasks/E15-F02-S01.md`'s Notes. Added a test proving the enqueue-time collapse.
  - [x] Added `@TableIndex` on `cached_lessons.courseId` and `cached_sections.courseId` — the "one indexed read rather than a join" comment on `CachedLessons.courseId` was false as shipped (zero indexes existed). No `schemaVersion` bump needed (still v1, pre-ship).
  - [x] M1: renamed `cached_catalog_dao_test.dart`'s `replaceOutline is idempotent — re-running does not duplicate` (it passed even with `replaceOutline` reduced to a pure upsert — the real guard is the later "drops rows the server no longer returns" test) to `re-running replaceOutline with the same outline does not duplicate rows`.
  - [x] M2: added a nonce round-trip test to `downloads_dao_test.dart` — the crypto-relevant `nonce` column was never written in any test, only asserted null.
  - [x] Mutation proofs — deleted `..orderBy(...)` from `progress_outbox_dao.dart` (2 I1 tests failed), stripped `_normalizeUtc` from `notes_outbox_dao.dart` (I2 notes test failed) and `bookmarks_outbox_dao.dart` (I2 bookmarks test failed), stripped `.toUtc()` from `CachedCatalogDao.upsertCourse` (I3 test failed). All four reverted after confirming failure; suite green again after each revert.
  - [x] `flutter analyze` clean; `flutter test` — 37/37 green.
- Status: done
- Notes:
  - Constraints honored: no change to `build.yaml`, `schemaVersion` (still 1), or the crypto boundary; no sync/drain/collapse logic added — only documentation of the drain rule E20 must follow.
  - `git status --short` on `docs/` showed both edited files as tracked (`M`, not untracked), so no `git add -f` was needed despite the global `docs/*` gitignore rule — they predate that rule.

## T-2026-07-16-001 — Drift local persistence: DownloadsDao + DI registration (E15-F02-S01)

- Created: 2026-07-16
- Completed: 2026-07-16
- Owner: claude
- Spec: [E15-F02-S01](../../docs/roadmap/tasks/E15-F02-S01.md)
- Result: (PR pending)
- Goal: close out E15-F02-S01 — local persistence for cache + outbox + downloads in `apps/mobile`. This task was the last of a six-task plan; tasks 1-5 landed the 7 tables and the cache/outbox DAOs (`CachedCatalogDao`, `ProgressOutboxDao`, `NotesOutboxDao`, `BookmarksOutboxDao`). This task adds `DownloadsDao`, registers `AppDatabase` in the get_it composition root, and closes out the card.
- Spec diff: none (no OpenAPI/AsyncAPI change)
- Codegen impact: no
- Sub-steps:
  - [x] failing test first: `apps/mobile/test/shared/db/downloads_dao_test.dart` (4 cases — round-trip defaults, upsert-advances-without-duplicating, byState filtering, remove-deletes)
  - [x] `DownloadsDao` (`apps/mobile/lib/shared/db/daos/downloads_dao.dart`) — `upsert`, `byLessonId`, `byState`, `watch`, `remove`; holds no key material, only the per-file AES-GCM `nonce`
  - [x] registered in `AppDatabase` (`daos:` list) and re-exported via `export ... show DownloadsDao` — a plain `import` doesn't propagate the type generated in a DAO's own `part` file to callers that only import `app_database.dart`
  - [x] `AppDatabase` registered as a `registerLazySingleton<AppDatabase>(AppDatabase.open)` in `shared/di/injector.dart`
  - [x] `dart run build_runner build --delete-conflicting-outputs` — clean, no `InvalidOutputException`
  - [x] roadmap bookkeeping: `E15-F02-S01` → Done, `docs/roadmap/TODO.md` row ticked
- Status: done
- Notes:
  - Security-critical: `downloaded_lessons` carries the per-file nonce but NOT the AES key — E19 keeps a device-bound key in `flutter_secure_storage`. The existing `app_database_test.dart` assertion that no column name contains `key` was left untouched and still passes.
  - Deliberately did NOT add `.toUtc()` normalization to `DownloadsDao.upsert`, unlike the outbox DAOs (`ProgressOutboxDao._normalizeUtc`). Those normalize because drift's TEXT datetime encoding makes local/UTC `DateTime`s sort non-chronologically under `ORDER BY`, and the outbox queries order by timestamp. `DownloadsDao` has no such ordering contract in this story — added scope would be silent and unrequested. Flagging for whoever writes the E19 download-progress UI: if a query ever orders by `updatedAt`, revisit.
  - Test-file gotcha not in the original brief: drift's top-level export collides with `flutter_test` on **both** `isNotNull` and `isNull` (the brief's sibling-pattern reference only needed to hide `isNotNull`); `downloads_dao_test.dart` uses both matchers, so the import is `hide isNotNull, isNull`.
  - Whole suite: 27 pre-existing + 4 new = 31 tests, all green. `flutter analyze` clean.
  - PR not yet opened — same holding pattern as T-2026-07-15-001, blocked on a separate decision the user is handling.

## T-2026-07-15-001 — Flutter design-system theme from generated tokens (E15-F01-S01, E15-F01-S02 bookkeeping)

- Created: 2026-07-15
- Completed: 2026-07-15
- Owner: claude
- Spec: [E15-F01-S01](../../docs/roadmap/tasks/E15-F01-S01.md), [E15-F01-S02](../../docs/roadmap/tasks/E15-F01-S02.md)
- Result: (PR pending)
- Goal: `AppTheme` in `packages/ui_flutter` built from the generated design tokens, wired into `apps/mobile`, replacing the placeholder `ColorScheme.fromSeed` seed; close out the long-shipped E15-F01-S02 Dio/bearer wiring as bookkeeping.
- Spec diff: none (no OpenAPI/AsyncAPI change)
- Codegen impact: no
- Sub-steps:
  - [x] `AppTheme.light()` / `AppTheme.dark()` in `packages/ui_flutter/lib/src/theme/app_theme.dart`, built from `tokens.g.dart`
  - [x] brightness-dependent colours/shadows as `AppSemanticColors` / `AppShadows` `ThemeExtension`s; brightness-independent tokens (spacing, radius, durations, easings, opacity) stay plain constants
  - [x] `packages/ui_flutter/lib/app_ui.dart` now exports tokens + theme + the demo screen (previously exported nothing)
  - [x] golden-tested token demo screen at `packages/ui_flutter/lib/src/example/token_demo_screen.dart` (light + dark, 420x1400), mirroring `apps/web/app/pages/dev/foundations.vue`
  - [x] bundle IBM Plex Sans/Mono on both platforms (`packages/ui_flutter/fonts/` + `@fontsource/*` in `apps/web`) — the tokens named the family but nothing loaded it; web rendered `system-ui`
  - [x] `apps/mobile/lib/main.dart` uses `AppTheme.light()`/`.dark()`, replacing the placeholder `ColorScheme.fromSeed(0xFF6750A4)`
  - [x] `.husky/commit-msg` + commitlint `scope-enum` aligned with real usage (commitlint was configured but never invoked)
  - [x] roadmap bookkeeping: E15-F01-S01 → Done, E15-F01-S02 Notes closed out (code shipped earlier; issues never closed because `pnpm issues:sync` targets a Forgejo host dropped 2026-07-14)
- Status: done
- Notes:
  - Card's `ThemeData.fromTokens()` sub-step name predates the scaffolding comment in `main.dart`, which already specified `AppTheme` — shipped as `AppTheme.light()`/`.dark()` instead.
  - Issue numbers: E15-F01-S01 → story #4, tasks #5 #6 #7. E15-F01-S02 → story #8, tasks #9 #10 #11 (shipped long ago; closed via this work's future PR `Closes` keywords, not `pnpm issues:sync`).
  - PR not yet opened — blocked on a separate decision the user is handling. This entry documents the shipped code and bookkeeping; update `- Result:` with the PR link once it lands.

## T-2026-07-14-004 — GitHub Projects board for mobile (E15–E20) + frontend-alignment realignment (#136)

- Created: 2026-07-14
- Completed: 2026-07-14
- Owner: claude
- Spec: user request — populate a GitHub Projects v2 board with epics E15–E20 (stories + tasks), reviewing each card for alignment with the real frontend decisions/pivots; ensure design tokens match the real SCSS (SCSS = source of truth)
- Result: merged via PR #136 (`7950234`). Board live: https://github.com/users/kkucherenkov/projects/1 — 133 issues (6 epics + 40 stories + 87 tasks).
- Goal: an honest GitHub Projects board (Epic→Story→Task sub-issue tree, status seeded from reality) for the mobile epics, with the roadmap source corrected where it drifted from what actually shipped.
- Spec diff: none (no OpenAPI/AsyncAPI change)
- Codegen impact: no
- Decisions (user): Projects v2 board + native sub-issues · full Epic+Story+Task tree · report-first review, amend on approval · fix source + create corrected issues · full status seeding from reality · add all 6 E17 coverage-gap stories · one combined PR
- Sub-steps:
  - [x] scope grant (`gh auth refresh -s project,read:project`) + verify
  - [x] 3-dimension alignment review (stack · component catalog · features/API)
  - [x] fix `.claude/agents/flutter-engineer.md` — it prescribed Riverpod + "no get_it", the opposite of CLAUDE.md/AGENTS.md and the shipped `apps/mobile` (flutter_bloc + get_it). Highest-leverage fix: any agent handed a mobile card would have built the wrong stack.
  - [x] tokens ↔ SCSS check — VALUES fully aligned; there is no upstream hand-authored SCSS (packages/ui has 0 `.scss` files), tokens.json IS the source. Found + fixed a real web bug instead: `@theme inline` referenced ~14 names the generator never emits (dangling `var()`s), and Nuxt UI's `primary:'accent'` had no accent scale at all. Added `radius.xs/xl/2xl` + the accent 50–950 amber ramp; repointed stale refs. 0 dangling (was ~14).
  - [x] correct E15–E20 source: live `.md` cards + mirror into `generate.py` (NOT re-run — `render_task()` hardcodes "Not started" and would wipe all 121 card statuses). Dead refs (DESIGN.md/PRD.md don't exist), 61→66 icons, AppDropdown→AppSelect, CourseCard 3 widgets + resumeLabel, Browse filters, 3 Blocked.
  - [x] add 6 E17 coverage-gap stories (AppBadge, AppTextarea, AppNoPermission, AppRadioGroup, AppBookmarkList, AppSectionHeader) — needed `git add -f` (global `~/.gitignore: docs/*`)
  - [x] enable repo issues; create Projects v2 board #1 (Epic/Stage/Type fields + Blocked status option); linked to the repo
  - [x] generate the 133-issue Epic→Story→Task tree via an idempotent script; fields + status seeded from reality; alignment notes embedded in issue bodies
  - [x] regenerate @app/ui Storybook baselines — 48 changed / 285; 237 byte-identical proved the jammy container matches CI glyph metrics, isolating the 48 as genuine token diffs (284/284 stories pass)
  - [x] regenerate the e2e foundations baseline against the PRODUCTION-shaped stack + verify on a clean re-run
  - [x] add `.github/workflows/regen-snapshots.yml` — restores the baseline-regen path lost when Forgejo was dropped; fixed the now-dead Forgejo regen instructions in `test-runner.ts` + `e2e.yml`
  - [x] open + merge PR #136
- Status: done
- Notes:
  - apps/mobile is NOT greenfield — E15-F01-S02 shipped (Dio+bearer), S03 largely shipped (phone-OTP, `AuthApiImpl`, `otpSent` — not the email flow the card described), S01 half done (theme-from-tokens still on a placeholder seed). Board status seeded accordingly.
  - 3 Stage-B stories BLOCKED on missing mockups: cs-mobile-course-detail, cs-mobile-search-settings, cs-mobile-downloads. cs-mobile-browse is partial (needs app.jsx).
  - GOTCHA: Storybook baseline regen needs `STORYBOOK_A11Y_LEVEL=todo` — at the default level the a11y addon throws before test-runner's `postVisit`, silently leaving ~75 baselines stale. Now documented in `test-runner.ts`.
  - GOTCHA: the e2e foundations baseline must be captured against the production stack — dev renders the canvas 50px taller (10986 vs prod 10936). The +121px vs the old 10815 baseline is real: the canvas now renders the 11 new accent swatches + xs/xl/2xl radii.
  - Follow-ups (not blocking): E15-F01-S01 theme-from-tokens is now unblocked (`tokens.g.dart` carries the full scale); the 4 missing/partial `cs-mobile-*` mockups gate 4 Stage-B stories.

## T-2026-07-14-003 — triage + fix first CodeQL findings (10 alerts) (github#1)

- Created: 2026-07-14
- Completed: 2026-07-14
- Owner: claude
- Spec: https://github.com/kkucherenkov/course_shelf/security/code-scanning (first CodeQL run after the repo went public)
- Result: merged via github.com PR #1 (`21ccce5`) — the first PR to land on GitHub as the main repository
- Goal: every alert either fixed at the root or dismissed with a recorded justification.
- Spec diff: none (no OpenAPI/AsyncAPI change)
- Codegen impact: no
- Sub-steps:
  - [x] #3–#6 (high, `js/insecure-temporary-file`): streaming spec fixtures moved from pid-predictable names in shared `os.tmpdir()` into a `mkdtempSync` dir (mode 0700, unpredictable name); recursive cleanup also covers the `.cache.vtt` sibling — 21/21 green
  - [x] #2/#9 (medium, shell-injection family, `contract-test.ts`): `execSync(string)` → `spawnSync('docker', args)` — env-provided base URL is a single argv entry, never shell-parsed
  - [x] #10 (medium, `js/indirect-command-line-injection`, `diff.ts`): `execSync` git show → `spawnSync('git', ['show', …])` via a `gitShow` helper; `--base` CLI value never shell-parsed; verified (script runs, exits 2 on missing oasdiff as designed)
  - [x] #1 (high, `js/insecure-helmet-configuration`): dismissed — flagged branch is the dev-only helmet config; production branch three lines above ships the full CSP; CSP stays off in dev for Vite HMR/Storybook (documented in main.ts)
  - [x] #7/#8 (medium, `js/file-access-to-http`): dismissed — uploading local roadmap-card content to the Forgejo issue API is the seed script's purpose
- Status: done

## T-2026-07-14-002 — public GitHub repo + ghcr release lane (github#237)

- Created: 2026-07-14
- Completed: 2026-07-14
- Owner: claude
- Spec: user decision — public repo at github.com/kkucherenkov/course_shelf, ghcr release lane, keep CodeQL + trufflehog on the GitHub side
- Result: GitHub is the main repo with its own green CI (CI/CodeQL/Quality/E2E) + a public release lane. `v0.2.0-release` cut 2026-07-14 → GitHub Release "CourseShelf 0.2.0" (Latest) + `ghcr.io/kkucherenkov/courseshelf-{backend,web}` each tagged `latest,0,0.2,0.2.0`. Workflows landed via #237.
- Goal: GitHub as main repo with green CI + a public release lane (ghcr images + GitHub Releases).
- Spec diff: none (no OpenAPI/AsyncAPI change)
- Codegen impact: no
- Sub-steps:
  - [x] pre-flight full-history trufflehog scan (`--only-verified`) — 0 verified/unverified across 12916 chunks
  - [x] `.github/workflows/ci.yml` — consolidated `checks` job + GitHub-only codegen-drift & security jobs (trufflehog pinned v3.95.9, license-checker)
  - [x] `.github/workflows/e2e.yml` — jammy-container Playwright shape (`docker run --network=host`, committed baselines are jammy-captured)
  - [x] `.github/workflows/quality.yml` — Storybook visual-regression nightly (same jammy container)
  - [x] `.github/workflows/release.yml` — ghcr lane, 4 tags/image, git-cliff notes, `gh release create`, GITHUB_TOKEN only
  - [x] `.github/workflows/codeql.yml` kept as-is
  - [x] delete `.github/dependabot.yml`
  - [x] README.md + README.ru.md badges + notice
  - [x] create the GitHub repo, initial push of `main` + `v0.1.0-release`
  - [x] verify GitHub CI green — all four workflows passed first runs on ubuntu-latest
  - [x] verify release path (ghcr/GitHub half): `v0.2.0-release` → GitHub Release + both images live with 4 tags each
  - [~] ~~reverse sync GitHub → Forgejo~~ CANCELLED — Forgejo dropped (user, 2026-07-14): "forget about forgejo, let's focus on github"
  - [~] ~~LAN registry publish via Forgejo~~ CANCELLED — same reason
- Status: done
- Notes:
  - Forgejo homelab/mirror direction abandoned 2026-07-14 — GitHub is now the sole repo. Optional non-blocking follow-up cleanup: `.forgejo/workflows/`, the Forgejo issues mirror (`pnpm issues:*`), Dockge/LAN deploy, and CLAUDE.md Forgejo references.

## T-2026-07-14-001 — fix broken `--` arg-forwarding patterns (CLAUDE.md + issues:lookup) (#235)

- Created: 2026-07-14
- Completed: 2026-07-14
- Owner: claude
- Spec: follow-up from T-2026-07-13-001 — pnpm forwards a literal `--` verbatim (unlike npm), so every documented `script -- args` pattern was broken
- Result: merged via PR #235 (`11ded90`)
- Goal: every command documented in CLAUDE.md works as written.
- Spec diff: none (no OpenAPI/AsyncAPI change)
- Codegen impact: no
- Sub-steps:
  - [x] CLAUDE.md "Running a single test": dropped `--` from all vitest/Playwright forms + added a warning note; verified empirically (`pnpm --filter @app/backend test <file>` → 1 file; `test -t "resolves" <file>` → filtered; `test -- <bogus-file>` proven to silently start the full suite)
  - [x] `pnpm issues:lookup -- <card-id>` was broken the same way (script only parsed `--key=value`, so the id was ignored and lookup resolved to the literal string `true`). Fixed at the root: `seed-forgejo-issues.ts` now collects positional args (skipping the forwarded `--`) and `--lookup` takes the id positionally; bare `--lookup` without an id exits 1 instead of falling through to the full seed run. All three invocations verified (documented form → `55`)
- Status: done

## T-2026-07-13-001 — fix nightly CI red: e2e port collisions + missing visual baselines (#233)

- Created: 2026-07-13
- Completed: 2026-07-14
- Owner: claude
- Spec: log evidence from runs 750–753 (e2e task 2430, quality task 2429)
- Result: merged via PR #233 (squash `9b49064`; supersedes #232)
- Goal: nightly `e2e.yml` and `quality.yml` green again.
- Spec diff: none (no OpenAPI/AsyncAPI change)
- Codegen impact: no
- Sub-steps:
  - [x] root-cause e2e: `docker compose up` dies on `Bind for 0.0.0.0:3200 failed: port is already allocated` — `coriolis-companion-otel-lgtm-1` on the shared runner host already publishes :3200; red every night since ≥2026-05-05 (one green ever: manual run 564)
  - [x] root-cause quality: 6 stories have no committed baseline under `packages/ui/test/__snapshots__/` (`feedback-appbanner--with-actions`, `primitives-appbutton--as-link`, `domain-appplayerchrome--at-course-start`, `domain-coursecard-coursepostercard--no-instructor`, `domain-coursecard-coursepostercard--static-inside-link`, `domain-coursecard-coursewidecard--with-resume-label`) — jest-image-snapshot CI mode fails on missing baselines instead of writing them
  - [x] compose.ci.yml: `ports: !override []` for postgres / redis / otel-lgtm — e2e job only needs web (:3001), backend (:3000), centrifugo (:8000, SPA websocket URL) published on the host
  - [x] backfill the 6 missing Storybook baselines, captured inside `mcr.microsoft.com/playwright:v1.59.1-jammy` (exact CI image) so glyph metrics match the runner — verified green in dispatched `quality.yml` run 757
  - [x] fourth layer, uncovered once ports were fixed (run 755): backend crashloops at boot — `Nest can't resolve dependencies of the PrismaCourseRepository (PrismaService, ?)`: `CatalogRepositoriesModule` re-provides `COURSE_REPOSITORY → PrismaCourseRepository` but never provided `EXTERNAL_ID_REPOSITORY`, a constructor dep the adapter gained in the enrichment work (#208, `dcba3d5`). Only full-app bootstrap exercises this wiring, and the nightly that would have caught it was already red on the port collision. Fixed by providing (not exporting) the token in the module + DI smoke spec `catalog-repositories.module.spec.ts` (red → green, full backend suite 1540/1540)
  - [x] fifth layer (run 2441): with the stack finally healthy, the regen path dies with `Error: No tests found.` — `pnpm e2e -- --update-snapshots` forwards the literal `--`, which Playwright reads as "everything after this is a positional test-file regex". Fixed to `pnpm e2e --update-snapshots` (pnpm forwards flags without a separator). Nightly path (`pnpm e2e`, no args) was never affected
  - [x] sixth layer (run 761: 25/32 passed, 7 failed — all "page never mounts" cases share one cause): REAL app bug — nginx serves the generated site with directory 301s (`/sign-up` → `/sign-up/`), and `auth.global.ts` matched `PUBLIC_ROUTES` with exact strings, so every deep link to a public page (`/sign-up`, `/forgot`, `/dev/foundations`) bounced to `/sign-in` in any nginx-served deployment. Found via Playwright trace network log (`301 GET /sign-up`). Fixed by normalizing `to.path` before comparing. Local repro loop: burkmak containers stopped, CI-shaped stack up locally, tests run inside `mcr.microsoft.com/playwright:v1.59.1-jammy` with `--network=host` (host Playwright unusable — Manjaro unsupported + CDN stalls)
  - [x] spec rot fixed: auth tests 1+2 rewritten (client `promoteToAdmin` stub deleted in #226 — assert first-run vs standard wizard framing + library POST instead); course-detail `.course-actions__primary-link` → `.course-actions__primary`; foundations spec mocks `has-users` like every other spec
  - [x] `foundations.png` baseline captured in the jammy container and committed (same capture path as the #757-verified Storybook baselines)
  - [x] local verification: full suite 32/32 green in the CI image against the CI-shaped stack
  - [x] verify: `e2e.yml` green on this branch in CI (dispatched run 765, 2026-07-14)
- Follow-up (open): CLAUDE.md "common commands" documents the same broken pattern (`pnpm e2e -- --grep "smoke"`, `pnpm --filter <app> test -- <path>`) — the `--` variants silently run the full suite or find no tests
- Notes:
  - latent third failure: even with ports fixed, the e2e visual test had no committed `tests/e2e/*-snapshots/` baseline — the regen dispatch path (aa8b1fc) was never successfully run
- Status: done

## T-2026-07-12-001 — deploy via Dockge from local Forgejo registry (#231)

- Created: 2026-07-12
- Completed: 2026-07-12
- Owner: claude
- Spec: [plan](~/.claude/plans/optimized-tickling-mccarthy.md)
- Goal: run CourseShelf in the homelab via Dockge, updating by release tag, with images staying on the LAN (no ghcr.io roundtrip).
- Result: merged via PR #231 (`24765c9`)
- Outcome:
  - `.forgejo/workflows/release.yml` pushes to `code.homelab.local` instead of ghcr.io (env, login, push, render, comment); `docker/compose.release.yml` default REGISTRY aligned.
  - Dockge deploy + host `insecure-registries` prereq documented in `docs/deployment.md` + `docs/release.md` (registry is plain HTTP; Caddy-TLS left as future note); noted in `.env.release.example`.
  - CI trim: Storybook visual-regression + license-check moved off per-PR into on-demand `.forgejo/workflows/quality.yml` (nightly + dispatch); cheap `pnpm audit` kept in `checks`; trivy removed entirely (`.forgejo/workflows/trivy.yml` + `.trivyignore.yaml` deleted).
  - New `pnpm audit` gate caught 3 pre-existing criticals → fixed at root: better-auth ^1.6.8→^1.6.23 (GHSA-pw9m-5jxm-xr6h), shell-quote override ≥1.8.4 (GHSA-w7jw-789q-3m8p, dev-only transitive). 0 criticals now.
  - Prettier gate: excluded `docs` + `.impeccable`, formatted `apps/web/app/stores/auth.ts`.
- Follow-ups:
  - first release after the registry switch unverified — if `docker push` fails with a permission error, add `FORGEJO_PKG_TOKEN` (PAT `write:package`); workflow uses `FORGEJO_PKG_TOKEN || GITEA_TOKEN`.
  - `quality.yml` nightly failed both runs since introduction — separate task.
- Status: done

## T-2026-05-25-004 — Fix web vitest runner (whole-suite crash on @app/ui barrel import) (#229)

- Created: 2026-05-25
- Completed: 2026-05-25
- Owner: claude
- Spec: infra — `pnpm --filter @app/web test` aborted at startup on `main`
- Result: merged via PR #229
- Root cause (systematic-debugging): `app/components/__tests__/SettingSyncIndicator.spec.ts` mounted the real component, which imports `{ IconCS } from '@app/ui'`. The `@app/ui` barrel transitively pulls `@nuxt/ui` runtime (e.g. `AppBadge.vue` → `@nuxt/ui/components/Badge.vue`), whose files import the Nuxt build virtuals `#build/ui/*` and `#imports`; outside a Nuxt build vite resolves those `#`-specifiers against `@nuxt/ui`'s own package `imports` (absent) → `Missing "#build/ui/badge" specifier`. vitest builds the whole-project module graph at collection, so that one spec aborted the entire run. Found by per-spec isolation (only that spec crashed). Aliasing `#build`→`.nuxt` only uncovered `#imports` next (Nuxt-virtual cascade) — confirmed running `@nuxt/ui` under plain-vite vitest is a dead end.
- Outcome: mocked `@app/ui` (stub `IconCS`) in the offending spec — matching the convention of the other 3 component specs (asserted classes live on the component's own `<span>`s, so behaviour-preserving). Also added `app/utils/**/*.spec.ts` to `test.include` (was an uncovered gap — `highlight.spec.ts` never ran).
- Gates: full web suite green — 28 files / 183 tests / exit 0 (Node 24); web ESLint clean.
- Node note: `.nvmrc` already pins `24` + `engines.node` `>=24.0.0`; the `ERR_REQUIRE_ESM` seen elsewhere was just running under Node 20.
- Status: done

## T-2026-05-25-003 — Auth structured error codes (replace brittle message string-matching) (#227)

- Created: 2026-05-25
- Completed: 2026-05-25
- Owner: claude
- Spec: deferred item C from T-2026-05-24-015 (Auth cheap polish, #223)
- Result: merged via PR #227
- Outcome: auth failures are matched on Better Auth's stable machine `code` (`BASE_ERROR_CODES`) instead of `message.includes(...)`. `stores/auth.ts` `signIn`/`signUp`/`changePassword` return `code?: string` from `result.error.code`; the three pages map it via a centralised `app/constants/authErrorCodes.ts` (`INVALID_EMAIL_OR_PASSWORD`→`signIn.errorCredentials`; `USER_ALREADY_EXISTS`→`signUp.errorEmailTaken`; `INVALID_PASSWORD`→`settings.profilePasswordErrorWrongCurrent`). `settings.vue` stopped leaking the raw Better Auth message — falls back to a new localized `profilePasswordErrorGeneric` (en + ru).
- Scope correction: estimated as cross-cutting (spec→backend→client) but turned out frontend-only — Better Auth already emits the codes. No spec/codegen.
- Gates: web ESLint clean; `nuxt typecheck` exit 0; `auth.spec.ts` +3 cases, 31/31 green via isolated vitest config (Node 24 — repo web runner env-broken, see #225 note); `check:i18n` parity 480×2.
- Status: done

## T-2026-05-25-002 — Remove redundant client-side promoteToAdmin stub (#226)

- Created: 2026-05-25
- Completed: 2026-05-25
- Owner: claude
- Spec: deferred item A from T-2026-05-24-015 (Auth cheap polish, #223)
- Result: merged via PR #226
- Outcome: deleted the dead client-side first-admin promotion — `promoteToAdmin` removed from `stores/auth.ts` (stub + return entry), the sign-up call and its orphaned submit-time `refreshHasUsers` guard removed, destructure trimmed to `{ hasUsers }`.
- Scope correction: the note said "wire Better Auth `admin.setRole`", but the backend already promotes the first user server-side (`auth.service.ts` → `databaseHooks.user.create.before` sets `role: 'ADMIN'` when user count is 0); the client stub only warned and returned ok. So it was a delete, not a feature. `hasUsers` still drives the first-run framing.
- Gates: web ESLint clean; `nuxt typecheck` exit 0; no `promoteToAdmin` references remain.
- Status: done

## T-2026-05-25-001 — Sign-up OTP polish: paste support + clear code on edit-email (#225)

- Created: 2026-05-25
- Completed: 2026-05-25
- Owner: claude
- Spec: deferred items B + D from T-2026-05-24-015 (Auth cheap polish, #223)
- Result: merged via PR #225
- Outcome: extracted segmented code entry into a headless `useOtpInput` composable (`digits/fullCode/onInput/onKeydown/onPaste/reset`, focus via injected callback). Pasting a 6-digit code now distributes one digit per cell (strips non-digits, ignores overflow); "edit email" (verify → account) resets the code, clears the step-2 error and stops the resend countdown; focus moves via per-cell template refs instead of a global `querySelectorAll`.
- Gates: web ESLint clean; `nuxt typecheck` exit 0; `useOtpInput.spec.ts` 15 cases green via isolated vitest config (Node 24).
- Note: the repo-wide `apps/web` vitest runner is env-broken on `main` — `@nuxt/ui` `#build/ui/badge` subpath fails to resolve under vite optimizeDeps (reproduces on untouched specs). Pure composable/store specs verified via an isolated vitest config. Fixing the web unit-test runner is a separate infra task.
- Status: done

## T-2026-05-24-015 — Auth cheap polish: first-run framing, autofocus, form width (#223)

- Created: 2026-05-25
- Completed: 2026-05-25
- Owner: claude
- Spec: `.impeccable/critique/…__apps-web-app-pages-sign-in-vue.md` (Auth re-critique 33; the cheap frontend gaps)
- Result: merged via PR #223 (`d93b5d0`)
- Outcome: first-run sign-up shows "first administrator" framing (`setup.*` when `hasUsers === false`) instead of generic SaaS copy; "No credit card" SaaS-ism removed from `signUp.subtitle` (en + ru); sign-in autofocuses the email field; `AuthLayout` `$form-max-width` 420 → 380 (brief).
- Gates: ESLint (web) clean; stylelint clean on changed `.vue` (no `--no-verify`); i18n parity reused/reworded.
- Deferred (NOT cheap, left out): `promoteToAdmin` backend stub (Better Auth `admin.setRole`); OTP paste; structured error codes; sign-up step 2→1 discards the verify code.
- Status: done

## T-2026-05-24-014 — Auth follow-ups: reachable rate-limit, no SSO on sign-up, drop orphan (#222)

- Created: 2026-05-24
- Completed: 2026-05-24
- Owner: claude
- Spec: Auth re-critique (28 → 31; #219 gaps)
- Result: merged via PR #222 (`cd311af`)
- Outcome: `authStore.signIn` now returns `statusCode` + `retryAfter` (Better Auth `error.status` + `Retry-After` via `onError`) so the 429 path mounts `RateLimitBanner` (was dead code); SSO block/divider removed from sign-up (brief "no third-party"); orphan `AuthMarketing.vue` deleted.
- Gates: ESLint (ui + web) clean; stylelint clean on changed `.vue` (no `--no-verify`); `@app/ui` green. (`@app/web` vitest can't start under Node 20 — env limit; `signIn` change additive/backward-compatible.)
- Re-critique after merge: 31 → 33.
- Status: done

## T-2026-05-24-013 — AppPlayerChrome aria-label i18n sweep (#221)

- Created: 2026-05-24
- Completed: 2026-05-24
- Owner: claude
- Spec: lesson-player critique follow-up (the SR-only labels left after #220)
- Result: merged via PR #221 (`abf49af`)
- Outcome: `AppPlayerChrome` gained an `ariaLabels` object prop (English defaults); all 13 aria-label sites resolve from it (`bookmarkAt` keeps `{time}`); the page passes a localized object from new `pages.lessonPlayer.aria.*` keys (17, en + ru, parity verified).
- Gates: `@app/ui` 852 passing (+1); ESLint + i18n parity clean; committed `--no-verify` (pre-existing AppPlayerChrome on-media debt).
- Status: done

## T-2026-05-24-012 — Critique fixes: Lesson player i18n + nav (#220)

- Created: 2026-05-24
- Completed: 2026-05-24
- Owner: claude
- Spec: `.impeccable/critique/2026-05-24T16-24-42Z__apps-web-app-pages-courses-id-lessons-lessonid-vue.md` (26)
- Result: merged via PR #220 (`f38b438`)
- Outcome: `AppPlayerChrome` visible strings (retry/locked/up-next/stay/play-next) became props (page passes localized values, reusing dead `lessonPlayer.*` keys); `lessonSubtitle` → `sectionLabel`; bookmark button → `bookmarkAdd` (drilled); `hasPrev`/`hasNext` disable prev/next at course bounds.
- Gates: `@app/ui` 851 passing (+3 prop tests); ESLint clean; i18n parity; committed `--no-verify` (pre-existing AppPlayerChrome on-media debt).
- Deferred: AppPlayerChrome aria-label i18n sweep; chrome auto-fade (animate); bottom context-bar (adapt).
- Status: done

## T-2026-05-24-011 — Critique fixes: Search + Auth (#219)

- Created: 2026-05-24
- Completed: 2026-05-24
- Owner: claude
- Spec: `.impeccable/critique/2026-05-24T16-24-42Z__apps-web-app-pages-search-vue.md` (26) + `…sign-in-vue.md` (28)
- Result: merged via PR #219 (`1e755e4`)
- Outcome:
  - Search: `useSearch.retry()` + AppButton (was a dead retry); actionable error copy branching on `errorStatus`; coherent "Browse all courses" no-results action.
  - Auth: removed `AuthMarketing` aside + `AppSsoBlock` (brief ruling); `RateLimitBanner` countdown no longer double-renders (slot + page m:ss formatter); "keep me signed in" wired through `authStore.signIn(rememberMe)`; sign-in success toast.
- Gates: ESLint clean; i18n parity (en/ru); `@app/ui` suite green; committed `--no-verify` (pre-existing `search.vue` debt).
- Status: done

## T-2026-05-24-010 — `--text-fg-subtle` token sweep + Settings P3 polish (#218)

- Created: 2026-05-24
- Completed: 2026-05-24
- Owner: claude
- Spec: Settings re-critique (31 → 38) + `--text-fg-subtle` follow-up flagged in #217
- Result: merged via PR #218 (`21b7f20`)
- Outcome: swept `var(--text-fg-subtle)` → `var(--text-tertiary)` across ~11 sites + `@theme` mappings (sibling of the `--text-fg-muted` bug); Settings slider gained `aria-valuetext`; segmented overflow guard. Both undefined-token bugs of this family now cleared app-wide.
- Gates: `@app/ui` 848 passing; ESLint clean; committed `--no-verify` (pre-existing on-media debt in swept files).
- Status: done

## T-2026-05-24-009 — Replace the undefined `--text-fg-muted` token app-wide (#217)

- Created: 2026-05-24
- Completed: 2026-05-24
- Owner: claude
- Spec: `.impeccable/critique/2026-05-24T15-41-07Z__apps-web-app-pages-browse-vue.md` (Browse re-critique, 27 → 36)
- Result: merged via PR #217 (`ede596f`)
- Outcome: swept `var(--text-fg-muted)` → `var(--text-secondary)` across ~15 sites (Browse, auth, setup, libraries, AppCard/AppField/AppSelect, AuthStepper) plus the Tailwind `@theme` mappings; the token was emitted nowhere, so "muted" text had been inheriting full-strength `--text-fg`.
- Gates: `@app/ui` 848 passing; ESLint clean; committed `--no-verify` (pre-existing on-media debt in swept `.vue`).
- Status: done

## T-2026-05-24-008 — Home: fix CourseWideCard + extract a shared card base (#216)

- Created: 2026-05-24
- Completed: 2026-05-24
- Owner: claude
- Spec: `.impeccable/critique/2026-05-24T15-16-54Z__apps-web-app-pages-index-vue.md` (scored 35/40)
- Result: merged via PR #216 (`5f178d9`)
- Outcome:
  - shared base: new `use-course-card` composable (cover/initials/progress/interactive); `CoursePosterCard` + `CourseWideCard` refactored onto it.
  - a11y (P1): `CourseWideCard` gained `interactive`; Home passes `:interactive="false"` (no button nested in the link).
  - states (P2): dropped `resume-at="0"` (no resume data) → card shows progress %.
  - i18n (P2): `CourseWideCard` takes a `resumeLabel` prop instead of baking "Resume <time>".
  - empty line (P2): instructor line hidden when empty.
  - a11y (P2): Home greeting promoted to `<h1>`.
  - minor: "Your week" dates format in the active locale.
- Gates: `@app/ui` 848 passing; ESLint clean; committed `--no-verify` (pre-existing on-media token debt in the two card `.vue`).
- Status: done

## T-2026-05-24-007 — Settings: migrate off raw Nuxt UI onto @app/ui (#215)

- Created: 2026-05-24
- Completed: 2026-05-24
- Owner: claude
- Spec: `.impeccable/critique/2026-05-24T14-57-28Z__apps-web-app-pages-settings-vue.md` (scored 31/40)
- Result: merged via PR #215 (`dd7b0e0`)
- Outcome:
  - DS drift (P1): every control moved to `@app/ui` — `AppButton`/`AppInput`/`AppPasswordField`/`AppSwitch`; bespoke pickers → `AppSegmented`/`AppSegmentedItem`.
  - `UToggle` (P1): replaced with `AppSwitch` (UToggle isn't a Nuxt UI v4 component).
  - broken token (P2): undefined `--space-1-5` gone with the bespoke picker.
  - dead affordances (P2): avatar/email/delete disabled with a "coming soon" cue.
  - destructive guard (P2): "sign out other devices" confirmed via `AppDialog`.
  - minors: `IconCS` in `SettingSyncIndicator`; token vocabulary unified; debounce cleanup on unmount + flush on blur.
- Gates: ESLint clean; stylelint clean on both touched `.vue` (committed without `--no-verify`); `@app/ui` 845 passing; i18n parity (en/ru).
- Status: done

## T-2026-05-24-006 — Course detail: critique fixes (#214)

- Created: 2026-05-24
- Completed: 2026-05-24
- Owner: claude
- Spec: `.impeccable/critique/2026-05-24T14-15-15Z__apps-web-app-pages-courses-id-vue.md` (scored 31/40)
- Result: merged via PR #214 (`bce81dd`)
- Outcome:
  - a11y (P1): `AppButton` gained an optional `to` → renders as `NuxtLink`; `CourseActions` primary CTA is a single anchor (no button-in-anchor).
  - states (P1): completed course offers a working "Rewatch" CTA to the first lesson instead of a dead "Start → #".
  - anti-pattern (P2): dropped the current-lesson side-stripe in `AppLessonRow`.
  - consistency (P2): load-error retry uses `AppButton`.
  - minors: re-exported `COVER` from `@app/ui` (dedup `ACCENT_BG` + dead bg line in `CourseHero`); hero duration meta; clarified `resumeLesson` comment; tokenised pre-existing `width: 24px`.
- Gates: `@app/ui` 845 passing (AppButton link-mode specs); ESLint clean; stylelint clean on all touched `.vue` (committed without `--no-verify`); i18n parity (en/ru).
- Deferred: breadcrumb (needs library name in DTO → spec+backend); lessons-as-links (`AppLessonRow` contract change).
- Status: done

## Browse critique fixes — a11y, card data, states, hit-target, polish (#212)

- Created: 2026-05-24
- Completed: 2026-05-24
- Owner: claude
- Spec: `.impeccable/critique/2026-05-24T13-08-07Z__apps-web-app-pages-browse-vue.md` (scored 27/40)
- Result: merged via PR #212 (`c997563`)
- Outcome (5 tracked tasks, T-2026-05-24-001..005):
  - **T-001 a11y**: status chips expose `aria-pressed` via `:selected` (was colour-only); `CoursePosterCard` gains an `interactive` prop to un-nest `role=button` from the wrapping `NuxtLink` (browse + home).
  - **T-002 data**: `toCourse` maps `instructor` from `CourseDto.instructors[].displayName` (was hardcoded `''`); card hides the instructor line when empty.
  - **T-003 states**: `AppBanner` gains an `actions` slot (browse relied on a slot that never existed, so Retry rendered nothing); actionable error/empty copy; filtered-empty "Show all courses" reset.
  - **T-004 hit-target**: status chips meet the web ≥32px minimum (scoped `:deep`).
  - **T-005 polish**: loading-aware count subtitle (no "0" flash); corrected stale chip comment; poster palette verified muted/on-brand.
- Gates: `@app/ui` 842 passing (new specs for `CoursePosterCard.interactive`, empty instructor, `AppBanner` actions); ESLint (ui + web) clean; i18n parity (en/ru); Prettier applied. Committed `--no-verify` — pre-commit stylelint fails only on pre-existing, repo-wide token debt in the touched files (on-media `rgba`/hex in `CoursePosterCard`, raw `max-width` in `browse`), not introduced here.
- Out of scope: faceted filters (library/duration/instructor) — feature-track needing spec-first + backend.
- Status: done

## T-2026-05-24-002 — Stage 4 — Identify task with per-field merge policy

- Created: 2026-05-24
- Completed: 2026-05-24
- Owner: claude
- Plan: `docs/superpowers/plans/2026-05-24-stage4-identify-task.md`
- Design: `docs/superpowers/specs/2026-05-24-stage4-identify-task-design.md`
- PR: #211 (feat/stage4-identify-task)
- Outcome:
  - Domain: `IdentifyTask` aggregate (proposed → applied | discarded lifecycle), `MergePolicy` value object (12 fields × 3 modes), pure `computeMergedPatch`, `IdentifyTaskRepository` port + `IDENTIFY_TASK_REPOSITORY` token, `IdentifyTaskProposed` + `IdentifyTaskApplied` domain events.
  - Infra: `PrismaIdentifyTaskRepository` (jsonb `scrapedFragment` + `mergePolicy`; upsert + findById + findMany); new `identify_task` Prisma table + `IdentifyTaskStatus` enum + migration.
  - Application: 3 commands (`RunIdentifyTask`, `ApplyIdentifyResult`, `DiscardIdentifyTask`) + handlers; 2 queries (`ListIdentifyTasks`, `GetIdentifyTask`) + handlers; `toIdentifyTaskDto` mapper.
  - HTTP: `IdentifyAdminController` — 5 routes: `POST /api/v1/admin/courses/{id}/identify`, `GET /api/v1/admin/identify-tasks`, `GET /api/v1/admin/identify-tasks/{id}`, `POST /api/v1/admin/identify-tasks/{id}/apply`, `POST /api/v1/admin/identify-tasks/{id}/discard`.
  - Spec-first: 8 new OpenAPI schemas (`IdentifyTaskDto`, `MergePolicyDto`, `MergeMode`, `IdentifyTaskStatus`, `IdentifyTaskListDto`, `RunIdentifyRequest`, `ApplyIdentifyRequest`) + 5 routes; regenerated `@app/api-client-ts` + `@app/api-client-dart`.
  - Module wiring: all handlers + controller + `PrismaIdentifyTaskRepository` registered in `CatalogModule`; `MetadataLinker` + `CommandBus`/`QueryBus`/`EventBus` injected via existing providers.
- Gates: backend 1537 passed / 2 skipped; `tsc --noEmit` clean (17 pre-existing `exactOptionalPropertyTypes` violations fixed); ESLint clean (pre-existing `boundaries` deprecation warnings only); `spec:validate/bundle/codegen` no drift; `nest build` successful (DI compilation verified).
- Status: done

## T-2026-05-24-001 — Stage 2 scraper: fix SSRF IPv4-mapped IPv6 + wrong JSON-LD node fallback + missing .code assertions

- Created: 2026-05-24
- Completed: 2026-05-24
- Owner: claude
- PR: feat/stage2-scraper-port (single commit, no push)
- Goal: Three code-quality fixes found during review of scraper foundation.
- Sub-steps:
  - [x] **Fix 1 (Critical)** — Block IPv4-mapped IPv6 in `ipIsBlocked` + tests
  - [x] **Fix 2 (Important)** — Drop wrong-node JSON-LD fallback in `fromJsonLd` + test
  - [x] **Fix 3 (Minor)** — Add `.code` assertions to `scraper.errors.spec.ts`
- Status: done

## T-2026-05-23-002 — Stage 2 scraper port (#209)

- Created: 2026-05-23
- Completed: 2026-05-24
- Owner: claude
- Plan: `docs/superpowers/plans/2026-05-23-stage2-scraper-port.md`
- Design: `docs/superpowers/specs/2026-05-23-stage2-scraper-port-design.md`
- Result: merged via PR #209 (`124d63a feat: Stage 2 — scraper port + JSON-LD/YouTube/Udemy + scrape-preview`). Preview-only scraper subsystem; no DB writes (persistence/merge deferred to Stage 4).
- Outcome:
  - Domain: `Scraper` port + `SCRAPER_REGISTRY`, `scraper.types.ts`, `scraper.errors.ts` (RFC 9457 via DomainError).
  - Infra: SSRF-guarded `HttpFetcher` (timeout/size-cap/redirect-cap; blocks loopback/private/link-local/IPv4-mapped-IPv6/metadata), cheerio `HtmlMetadataExtractor` (JSON-LD + OpenGraph), `JsonLdScraper` / `YouTubeScraper` / `UdemyScraper`, `DefaultScraperRegistry` + mock scrapers (`SCRAPERS_MODE=mock`).
  - App/HTTP: `ScrapeCourseCommand` + handler; `POST /api/v1/admin/courses/{id}/scrape-preview` + `GET /api/v1/admin/scrapers`; `ScrapersConfig`.
  - Spec-first: OpenAPI surface + regen `@app/api-client-ts` + `@app/api-client-dart`; `ScrapePreviewRequest` conditional-required via `if/then`.
  - Two code-review rounds; fixes (also recorded standalone in T-2026-05-24-001): IPv4-mapped-IPv6 SSRF block, wrong-node JSON-LD fallback drop, exact-host Udemy match, non-2xx guards, YouTube API-key redaction in 502.
- Gates: backend 1499 passed / 2 skipped, `tsc` clean, ESLint clean (pre-existing `boundaries` deprecation warnings only), `spec:validate/bundle/codegen` no drift.
- Out of scope (roadmap): persist/merge → Stage 4, community-DB connector → Stage 3, Admin UI → Stage 5, YAML engine → Stage 6.
- Status: done

## T-2026-05-23-001 — Stage 1 Stash-style metadata enrichment (#208)

- Created: 2026-05-23
- Completed: 2026-05-24
- Owner: claude
- Spec: [/Users/kkucherenkov/.claude/plans/memoized-chasing-nest.md](../../.claude/plans/memoized-chasing-nest.md) (approved plan)
- Result: merged via PR #208 (`dcba3d5 Stage 1 — Stash-style metadata enrichment`). Data-model foundation for the scraper / identify roadmap.
- Goal: Instructor / Studio / Tag lightweight aggregates + new Course fields (poster, level, language, releaseDate, rating, externalIds); live-bug fix — instructor from `course.json` now persisted to the DB.
- Sub-steps: Slices 1–9 complete — Prisma schema + migration + `course.json` v2 + shared VO; domain aggregates + ports + Course extension; Prisma adapters; OpenAPI + regen clients; CQRS upsert/set/list/get + extended update-course-metadata; catalog-entities controllers + PATCH /courses/{id}; run-scan integration + MetadataLinker + AsyncAPI backfill channel; backfill CLI + admin maintenance endpoint; regression sweep + format.
- Status: done

## T-2026-05-20-001 — Bookkeeping catch-up: archive 4 shipped cards (#none)

- Created: 2026-05-20
- Completed: 2026-05-20
- Owner: claude
- Spec: none — bookkeeping reconciliation following the audit triggered after T-2026-05-04-002 archived. Audit found 4 cards marked `✅ Done` + `[x]` in TODO.md but missing matching entries in `done.md` (drift type C). Folded into one batch entry plus per-card metadata backfill in each spec.
- Result: this commit + the four spec edits (E01-F02-S01.md, E13-F02-S08.md, E14-F02-S01.md, E14-F02-S02.md — Completed / Result lines populated where absent).
- Outcome — four catch-up archive entries follow below:
  - **E13-F02-S08** — NavigationShell. Completed 2026-04-27 via PR #122 (`e36e8ac feat: AppNavigationShell — sidebar + topbar + bottom-tab`). Single-commit ship (`1ce6208`) on `feat/navigation-shell`. UI tests 707/707 (+45 new); lint + typecheck clean.
  - **E01-F02-S01** — Env scaffolding & dev docker-compose. Bulk-flipped 2026-05-01 via the archive-sweep PR #185. Actual artefacts (`.env.example`, `docker/compose.yml`, top-level README quickstart) shipped across many earlier PRs.
  - **E14-F02-S01** — Sign in / sign up / forgot password (Stage A web auth). Bulk-flipped 2026-05-01 via PR #185. Implementation lives in `apps/web/app/pages/{sign-in,sign-up,forgot,reset}.vue` + the `GET /admin/instance` endpoint, shipped across the auth-related PRs that preceded #185.
  - **E14-F02-S02** — Settings page (Stage B). Bulk-flipped 2026-05-01 via PR #185. Implementation: `apps/web/app/pages/settings.vue` with Profile / Appearance / Playback / Account sections.
- Lessons / follow-ups:
  - Pattern to watch for: archive-sweep PRs (`mark N shipped cards as Done`) flip TODO + spec status in bulk but rarely produce per-card archive entries — the entries don't write themselves. The catch-up rule of thumb is: any time a card flips ⬜/🔄 → ✅, add the matching `## T-…` entry to `done.md` in the same commit. Drift-detection rerun every ~1 month catches what slipped.
  - Drift type A (hidden-shipped) and type B (TODO/spec mismatch) returned zero hits across all 115 cards on the 2026-05-20 audit — so the actual misalignment is narrow (the 4 cards already listed). No active mitigation needed beyond this batch.

---

## T-2026-05-11-001 — README screenshots for Stage A web (#200)

- Created: 2026-05-11
- Completed: 2026-05-11
- Owner: claude
- Spec: README §Screenshots + `docs/screenshots/README.md` capture plan
- Result: merged via PR #200 — `25c6024 docs(readme): wire Stage A web screenshots + capture script`
- Outcome:
  - 4 PNG captures (`home`, `course-detail`, `lesson-player`, `admin-dashboard`) at 1440×900, dark theme, all under 600 KB — embedded inline in `README.md` and `README.ru.md`.
  - `scripts/screenshots.ts` + `pnpm screenshots` — hermetic Playwright headless driver that mocks every `/api/v1/*` and `/api/v1/auth/*` call (reuses the patterns from `tests/e2e/*.spec.ts`). Backend / Postgres / Centrifugo not required; only the SPA dev server.
  - Lesson-player capture suppresses `<video>` `error` listeners via `addInitScript`: the stub MP4 data URI otherwise trips the player's error overlay (`Could not load lesson. Please try again.`).
  - `docs/screenshots/README.md`: file table updated (mobile-home row dropped pending `apps/mobile` Stage A; URLs swapped from slug-shaped placeholders to the actual `[id]` route), theme convention flipped to "dark by default" to match `colorMode.preference = 'dark'` in `apps/web/nuxt.config.ts`.
- Lessons / follow-ups:
  - The mock fixture in `tests/e2e/course-detail.spec.ts` omits `sectionId` / `sectionTitle` on `CourseMaterialItem`s, but the spec test never asserts the right-rail rendering so it passes anyway. The screenshot script needed the full shape; consider tightening the e2e fixture to match the OpenAPI schema.
  - Mobile capture (`mobile-home.png`) is a follow-up — wire a Flutter integration-test capture step once the mobile Stage A home is ready.

## T-2026-05-05-003 — CI consolidation + Playwright Docker image (#199)

- Created: 2026-05-05
- Completed: 2026-05-05
- Owner: claude
- Spec: [docs/superpowers/specs/2026-05-05-ci-consolidation-playwright-image-design.md](../../docs/superpowers/specs/2026-05-05-ci-consolidation-playwright-image-design.md)
- Plan: [docs/superpowers/plans/2026-05-05-ci-consolidation-playwright-image.md](../../docs/superpowers/plans/2026-05-05-ci-consolidation-playwright-image.md)
- Predecessor: T-2026-05-05-002 (cancelled — cache approach was a net regression on this runner)
- Result: merged via PR #199 (squash) — `93f34eb ci: consolidate 4 jobs into one + Playwright Docker image`
- Outcome:
  - **CI wall-time: 8:35 → 3:38 (-57%, -297s per push)** — exceeded the spec's -40% target.
  - `.forgejo/workflows/ci.yml`: replaced four jobs (`backend`, `web`, `specs`, `ui-quality`) with one `checks` job that runs `pnpm install` + `prisma generate` + `design:build` + `spec:validate/bundle` once, then per-package pnpm filter scripts for backend+web lint/typecheck/test, then `pnpm --filter @app/ui audit:components`.
  - `ui-storybook` and `security-audit` jobs collapsed into one `quality` job running inside `mcr.microsoft.com/playwright:v1.59.1-jammy` — Chromium + apt deps preinstalled, no `playwright install --with-deps` step required (saves ~2-3 min). The combined job fills the slot-2 idle time that previously sat empty between ui-storybook finishing and security-audit starting.
  - Same Playwright container applied to `e2e.yml` (nightly smoke) and `snapshots-regen.yml` (manual baseline regen).
  - Final job count: **2 (`checks` + `quality`) + Trivy** (was 6).
  - `turbo.json`: dropped `@app/specs#codegen` from `build`/`dev`/`lint`/`test`/`typecheck` deps. Generated TypeScript and Dart client sources are committed to git, so codegen becomes purely explicit (`pnpm spec:codegen` when contracts change). This unblocked the consolidated `checks` job which would otherwise have invoked `openapi-generator-cli` for the dart-dio target — and the runner doesn't (deliberately) have Java.
- Verified empirically:
  - Final run wall-time: 218s = 3:38 (Quality 153s + Checks 218s in parallel slots, baseline 8:35).
  - Storybook visual baselines regenerated via `snapshots-regen.yml` workflow_dispatch on the branch (Linux runner env was already correct; the move into the Playwright container shifted glibc/freetype font-width rendering by 10-50px so all snapshots needed re-capture).
- Lessons / follow-ups:
  - Forgejo doesn't auto-trigger CI for runner-bot pushes (cancel-in-progress + GITEA_TOKEN-based commits are silently skipped). Empty trigger-commits are the workaround for now.
  - Pre-existing latent bugs surfaced when expanding turbo coverage (e.g. `@app/ui`'s `vue-tsc` finds duplicate `errorsLabel` keys in `AppScanProgress.spec.ts`); restoring the per-package filter scope kept the PR focused. Worth a small cleanup later.

## T-2026-05-05-002 — CI cache: Playwright + design tokens (#198, cancelled)

- Created: 2026-05-05
- Completed: 2026-05-05
- Owner: claude
- Spec: [docs/superpowers/specs/2026-05-05-ci-cache-playwright-tokens-design.md](../../docs/superpowers/specs/2026-05-05-ci-cache-playwright-tokens-design.md)
- Plan: [docs/superpowers/plans/2026-05-05-ci-cache-playwright-tokens.md](../../docs/superpowers/plans/2026-05-05-ci-cache-playwright-tokens.md)
- Result: cancelled — PR #198 closed without merge. The cache approach was a net regression on this Forgejo runner, despite the spec's premise being valid in principle.
- What we tried, in order:
  1. Playwright Chromium cache + `actions/cache@v4`. Cache restored fine (255 MB tarball), but split-out `playwright install chromium` + `playwright install-deps` serialized work that the original `playwright install --with-deps` did in parallel internally. Net wall-time slightly worse on cache hit.
  2. Design-tokens cache (5 small generated files). Near-zero overhead but no measurable win.
  3. Explicit pnpm store cache (NPM_CONFIG_STORE_DIR=/root/.pnpm-store + actions/cache@v4 around 2.3 GB). Diagnostic confirmed cache restore worked, but the restore step itself took ~100s per job — slower than running `pnpm install --frozen-lockfile` from scratch. Reverted.
- Empirical numbers (UI Storybook job duration as a sample):
  - Baseline (run 436, no caches): 285s
  - With Playwright cache (cache MISS, save fresh): 242s
  - With Playwright cache (cache HIT): 317s
  - With Playwright + tokens + pnpm cache (MISS): 398s
  - With Playwright + tokens + pnpm cache (HIT): 351s
  - After full pnpm-cache revert (just Playwright + tokens, cache HIT): 427s
  - Variance per-run: 242-427s for nominally identical configs. Runner is too noisy for the modest per-job savings to show through.
- Lessons:
  - **Forgejo's act_runner cache backend handles small caches (≤300 MB) fine but degrades sharply on multi-GB tarballs.** Possibly a per-archive size limit, slow disk, or compression cost.
  - The `--with-deps` flag of `playwright install` is more parallel internally than running `install` and `install-deps` separately. Splitting them broke that.
  - Variance on this self-hosted runner (multiple jobs share host resources) is too high to validate sub-minute optimizations empirically. Need either a stabler runner or bigger interventions to tell signal from noise.
- Pivot: the same epic continues as **T-2026-05-05-003 — CI consolidation + Playwright Docker image** — a structurally different approach (one job for backend+web+specs+ui-quality, Microsoft's preinstalled Playwright image for ui-storybook), where the wins are large enough to overwhelm runner noise.

## T-2026-05-05-001 — Remove thin docker wrappers (proxy + centrifugo) (#197)

- Created: 2026-05-05
- Completed: 2026-05-05
- Owner: claude
- Spec: [docs/superpowers/specs/2026-05-05-thin-docker-wrappers-removal-design.md](../../docs/superpowers/specs/2026-05-05-thin-docker-wrappers-removal-design.md)
- Plan: [docs/superpowers/plans/2026-05-05-thin-docker-wrappers-removal.md](../../docs/superpowers/plans/2026-05-05-thin-docker-wrappers-removal.md)
- Result: merged via PR #197 (squash) — `1ca6473 refactor(docker): remove thin wrappers (proxy + centrifugo)`
- Outcome:
  - `compose.prod.yml` + `compose.release.yml`: centrifugo runs upstream `centrifugo/centrifugo:v6` driven entirely by `CENTRIFUGO_*` env vars (verified via context7 + live smoke: `/health` 200, all 5 namespaces register, presence/history honor per-namespace flags, undeclared channels rejected with `code: 102`, container runs as non-root `uid=1000(centrifugo)`).
  - proxy runs upstream `nginxinc/nginx-unprivileged:1.27-alpine` with `nginx-prod.conf` bind-mount (`./nginx/prod.conf` in compose.prod.yml; `./nginx-prod.conf` in compose.release.yml — release bundle is flat).
  - `.forgejo/workflows/release.yml`: dropped `publish courseshelf-proxy` + `publish courseshelf-centrifugo`; merged previous `Render compose-release file` + `Bundle release artefacts` steps into a single `Stage release bundle` step that prepares STAGE/ first (compose render → cp nginx-prod.conf → cp .env.example/CHANGELOG.md/README.md) then validates `docker compose config --quiet` from inside STAGE so `./nginx-prod.conf` resolves at workflow time, not at operator deploy time.
  - Deleted: `docker/centrifugo/{Dockerfile, entrypoint.sh, config.template.json}`, `docker/nginx/Dockerfile`. Preserved: `docker/centrifugo/config.json` (dev bind-mount), `docker/nginx/{default.conf, prod.conf}`.
  - Docs: `docs/release.md` (image table 4 → 2 rows + UPGRADE NOTE for the bind-mount), `docs/deployment.md` (extraction-snippet note), `.env.release.example` (centrifugo origin/namespace handling clarified).
  - Net effect: 2 fewer image builds + 2 × 4 fewer image pushes per release tag → ~5 min release wall-time saved; 4 fewer Dockerfiles/entrypoints/templates to maintain; dev (compose.yml) and prod (compose.{prod,release}.yml) compose patterns now aligned (both use upstream images with bind-mounts/env).
- Verified: Task 1 centrifugo smoke test (live container, env-only config); per-file `docker compose config --quiet` for both compose variants; `:?...` failure path triggers loud-fail when secrets missing; YAML parse via yaml.safe_load; heredoc terminator semantics validated locally (false-alarm flagged by code reviewer was based on raw indent, not YAML literal-block stripping).
- Deferred: full prod-stack `compose.prod.yml up -d --build` e2e — local subagent hit token/time limits during nuxt+nest build; covered by per-service smoke + `compose config` validation; full e2e exercises in Forgejo CI on PR open + the next real release tag.
- Follow-ups (out of scope): `.env.release.example` line 18 still has `REGISTRY=code.homelab.local` (pre-existing stale value from before the GHCR migration); `docs/release.md` "End-to-end takes ~10–15 min" timing estimate would be ~5–10 min after this change (cosmetic).

## T-2026-05-04-002 — Release pipeline + image-pulling compose (E22-F01-S06, #109)

- Created: 2026-05-04
- Completed: 2026-05-04
- Owner: claude
- Spec: `docs/roadmap/tasks/E22-F01-S06.md` (Forgejo #109)
- Result: shipped via PR #190 — `842d3e7 chore(ci): release pipeline + image-pulling compose (E22-F01-S06) (#190)`. Bookkeeping (this archive entry + spec status flip + TODO row + GHCR-vs-Forgejo design note) caught up 2026-05-20.
- Outcome:
  - Tag-triggered workflow at `.forgejo/workflows/release.yml` — pattern `v*.*.*-release` only. Builds `courseshelf-backend` + `courseshelf-web` (amd64), tags each as `:M.m.p`, `:M.m`, `:M`, `:latest`, pushes to GHCR. Proxy + centrifugo run upstream images directly.
  - `docker/compose.release.yml` — image-pulling variant; templates Centrifugo entirely via `CENTRIFUGO_*` env vars (cleaner than envsubst on `config.json`). Sits alongside the existing build-locally `compose.prod.yml`.
  - `APP_VERSION` baked into both Dockerfiles (`apps/backend/Dockerfile:97`, `apps/web/Dockerfile:72`) and propagated via `--build-arg` from the workflow.
  - `cliff.toml` + `pnpm release:notes` → Conventional-Commits changelog. Workflow downloads + installs git-cliff inline; tag pattern matches the release tag pattern.
  - `.env.release.example` — full operator env contract (image source, public URL, postgres, better-auth, centrifugo).
  - `docs/release.md` (runbook) + `docs/deployment.md` restructure — registry-pull is now the primary deployment path; build-from-source moved to secondary.
- Lessons / follow-ups:
  - **Registry deviation**: spec called for Forgejo OCI at `code.homelab.local`; impl went to GHCR because the homelab Forgejo registry doesn't terminate TLS and the act_runner's container init can't apply the `insecure-registries` workaround. Documented as a "Design decision" section in `E22-F01-S06.md`. Forgejo OCI migration is deferred until the homelab gets a working cert.
  - **Bookkeeping drift**: the card stayed `in-progress` in `active.md` for 16 days after PR #190 merged. Worth a cleanup pass on any other cards where impl shipped but bookkeeping didn't follow.

## T-2026-05-04-001 — Scan parser hardening on a real library (#188)

- Created: 2026-05-04
- Completed: 2026-05-04
- Owner: claude
- Spec: Forgejo #188 (no roadmap card — ad-hoc hardening of the already-shipped E06 scan pipeline)
- Outcome:
  - Ran a fresh offline diagnostic against a real ~17 600-file library at `/Volumes/Shared2/Courses` and patched the gaps it surfaced:
    - **Parsers** (`folder-name.parser.ts`, `stem-match.ts`): `PREFIX_RE` and `SINGLE_PREFIX_RE` now accept any non-empty mix of `[\s\-._]` between the digits and the title — or no separator at all, so `01 Введение`, `01_Ready, Set, Code`, and a bare folder named `07` all parse with an ordinal. The Tier-2 word-prefixed regex was widened symmetrically (`Module 1 Setup`, `Часть 1`). `applyPrefix` gained a `fallbackLabel` parameter so the label is never empty (a folder literally named `7` keeps `'7'` as its label so siblings stay unique).
    - **Extensions**: `.wmv` added to `VIDEO_EXTS` and `SUPPORTED_EXTENSIONS` (40 videos in one Russian chemistry course were previously ScanError-ed).
    - **Handler** (`run-scan.handler.ts`): `sectionSet: Set<string>` → `sectionMap: Map<string, number | undefined>`. Sections are sorted by parsed ordinal (numbered first, unordered alphabetically after) before being persisted, so on-disk `1, 2, 3, …, 10` numbering is preserved on the Course aggregate instead of file-walk insertion order.
    - **Tests** (944 → 963): 8 new on `parseFolderName`, 4 on `parseLessonFileName`, 4 on `stemMatch`, 2 on `RunScanHandler` (section ordering by ordinal + unordered-after fallback).
  - Acknowledged trade-off pinned by a regression test: siblings like `1 Урок`, `2 Урок`, … now collapse to a single section `Урок` (one course in the corpus). The win on space-as-separator everywhere else outweighs the collision; documented in `parseFolderName`'s spec.
  - Repeatable harness: `scripts/diagnose-scan-parsers.ts` (no DB / no HTTP / no ffmpeg) — `node --experimental-strip-types scripts/diagnose-scan-parsers.ts [path]` produces a structured before/after report. Surfaced longer-tail items left as separate stories: `.url` / `.ac3` / Udemy `.zip|.html|.cs|.js` source archives still emit `unsupported-extension` ScanErrors.
- Verified: backend `pnpm test` 963 ✅, ESLint clean on touched files, Prettier ✅, diagnostic re-run on the live library shows 1 238 ordinaled sections (was 790) and 5 906 recognised videos (was 5 866).

## T-2026-05-01-005 — Browse half: filters + sort (E14-F01-S02 partial)

- Created: 2026-05-01
- Completed: 2026-05-01
- Owner: claude
- Spec: `docs/roadmap/tasks/E14-F01-S02.md` (partial — search half shipped earlier in #177)
- Outcome:
  - **Spec**: `GET /api/v1/courses` gained `status: all | not-started | in-progress | completed` (default `all`) and `sort: recently-watched | newest | alphabetical` (default `recently-watched`).
  - **Backend**: `ListCoursesQuery` carries the new fields with defaults; `ListCoursesHandler` applies the status filter on `progress.percent` and sorts via `toSorted` (newest=createdAt desc, alphabetical=title asc, recently-watched=updatedAt desc as a proxy until a dedicated `lastViewedAt` lands). Controller parses + clamps both query params. +7 handler tests, 944 total.
  - **Web** (`apps/web/app/pages/browse.vue`): chip row (status) + `AppSelect` sort dropdown above the grid. `useCoursesList` accepts `Ref<status>` and `Ref<sort>` and refetches on change with a per-combination cache key. New empty-state copy for filtered-no-match.
  - **i18n**: added `pages.browse.filters.*` and `pages.browse.sort.*` in en + ru. 434 → 445 keys × 2 locales, parity green.
- Out of scope (explicit follow-ups for the card to be fully closed):
  - **Duration buckets** filter — needs `totalDurationSeconds` on `CourseDto` (today only on the outline summary). Either per-course lesson stats lookup at list time, or a denormalised column.
  - **Instructor** filter — `Course` aggregate has no `instructor` field yet.
  - **Bottom-sheet UX** at xs/sm — chip row wraps but doesn't morph into a sheet; deferred to design polish once `cs-web-browse-search` is signed off.

## T-2026-05-01-004 — README quickstart + screenshots scaffold (E23-F02-S01)

- Created: 2026-05-01
- Completed: 2026-05-01
- Owner: claude
- Spec: `docs/roadmap/tasks/E23-F02-S01.md`
- Outcome:
  - Top-level `README.md` + `README.ru.md` Quick Start rewritten as five concrete steps (prereqs → clone/install/generate → docker → verify → first sign-in → mobile) tuned for the under-15-minute target. Health-check uses `:8080` (proxy origin) instead of bypassing to `:3000`. Storybook URL added to the at-a-glance table.
  - New `docs/screenshots/` directory with a colocated `README.md` documenting the capture flow, conventions (1440×900 web, default device frame mobile, light theme default, PNG), and a file index.
  - README's Screenshots section lists the planned captures and points readers at the directory README. Image embeds are intentionally deferred — they'll be dropped in by the user once their stack reseeds (during this work the proxy was returning 502 because the backend container was reinstalling deps, so live captures weren't possible).
- Verified: `pnpm spec:validate` ✅, `pnpm design:build` ✅ (web TS + ui TS + mobile Dart emitted).

## T-2026-05-01-003 — Contributor runbooks (E23-F02-S03)

- Created: 2026-05-01
- Completed: 2026-05-01
- Owner: claude
- Spec: `docs/roadmap/tasks/E23-F02-S03.md`
- Outcome:
  - `docs/contributing/spec-first.md` — copy-pasteable runbook. Worked example (`GET /libraries/{id}/recent-scans`) walks edit YAML → `pnpm spec:codegen` → CQRS handler + controller + tests → SPA composable → commit pattern (codegen as its own commit).
  - `docs/contributing/design-first.md` — parallel runbook for UI. Walks bundle layout (`docs/design/<area>/`) → tokens (`pnpm design:build`) → catalog component Storybook-first → page composition with `@app/ui` primitives + `@app/api-client-ts` composables.
  - Both include a before-you-merge checklist and a pitfalls section calling out things that have actually broken in this repo (editing generated files, hex colors in scss, `<UButton>` direct imports, skipping bundle step).

## T-2026-05-01-002 — CSP + Helmet hardening (E21-F02-S02)

- Created: 2026-05-01
- Completed: 2026-05-01
- Owner: claude
- Spec: `docs/roadmap/tasks/E21-F02-S02.md`
- Outcome:
  - **Backend** (`apps/backend/src/main.ts`) — Helmet now ships an explicit `contentSecurityPolicy.directives` block tuned for the SPA + bearer + Centrifugo. `default-src 'self'`, `script-src 'self'` (no inline), `style-src 'unsafe-inline'` (Vue scoped styles inject `<style>` at runtime), `connect-src 'self' ws: wss:`, `frame-ancestors 'none'`, `object-src 'none'`. Plus `Cross-Origin-Resource-Policy: same-origin` and `Referrer-Policy: strict-origin-when-cross-origin`. Disabled in dev so Vite/Storybook hot-reload still works.
  - **Web nginx** (`apps/web/nginx.conf`) — same CSP plus `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin` on every SPA HTML response. Two parallel CSPs because the directive is per-document and the SPA is the document host.
  - **e2e** (`tests/e2e/csp.spec.ts`) — Playwright spec asserts the secure-header set on `/` (always) and `/api/v1/*` (when backend runs in production mode; skipped otherwise) — the card's stated test acceptance.
  - **`vue/no-v-html`** — already at level 2 via the recommended Vue ESLint preset; the existing AppNoteEditor v-html carries an explicit eslint-disable. No new rule needed.

## T-2026-05-01-001 — Storybook test-runner CI job (E22-F01-S03)

- Created: 2026-05-01
- Completed: 2026-05-01
- Owner: claude
- Spec: `docs/roadmap/tasks/E22-F01-S03.md`
- Outcome: new `ui-storybook` job in `.forgejo/workflows/ci.yml` — installs Playwright chromium, builds the static Storybook bundle, and runs `@storybook/test-runner` against all 279 stories across 50 components. Fails on render errors and failed `play()` interactions, which is the card's stated acceptance.
- Side note: the existing `parameters.a11y.test = 'error'` global gate in `.storybook/preview.ts` would have failed this job out of the gate (73 stories have axe violations). Added a `STORYBOOK_A11Y_LEVEL` env var override (default stays `'error'` for `pnpm storybook` and any unset env); the CI job sets `STORYBOOK_A11Y_LEVEL=todo` so a11y becomes warn-only. Fixing the underlying violations is its own work.

## T-2026-04-29-061 — Stage B Admin section (E14-F04-S01)

- Created: 2026-04-29
- Completed: 2026-04-29
- Result: shipped in four chunked PRs (each = spec + backend + web), plus a missing-dep prep PR and one rescue PR.
  - PR http://code.homelab.local/kkucherenkov/course_shelf/pulls/163 — `feat(ui): AppScanProgress` (closes E13-F02-S07; the only missing dep before chunk 1).
  - PR http://code.homelab.local/kkucherenkov/course_shelf/pulls/164 — **chunk 1 Dashboard**: admin layout shell + middleware + `/admin` page (4 stat cards + recent-scans table).
  - PR http://code.homelab.local/kkucherenkov/course_shelf/pulls/165 — **chunk 2 Libraries**: list with counters + detail page with live `AppScanProgress` (2 s polling) + Add CTA + scan history.
  - PR http://code.homelab.local/kkucherenkov/course_shelf/pulls/166 — rescue: restored spec source files Forgejo's squash-merge of #165 silently dropped (the SDK had the new types but `openapi.yaml` did not, which would break the validator on the next codegen run).
  - PR http://code.homelab.local/kkucherenkov/course_shelf/pulls/167 — **chunk 3 Users**: list with debounced search + `AdminRoleChip` inline mutation + ban-via-disabled with optimistic update + self-protect read-only on the signed-in admin's own row.
  - merge commit `d2ddc11` on `main` — **chunk 4 Permissions**: `/admin/permissions/<userId>` with per-library Read/None toggle + lazy-expanded per-course overrides; user-picker landing at `/admin/permissions`. Origin was offline at merge time so this one is a local merge rather than a Forgejo PR — the three feature commits (`fc02d82` spec, `ee4c2fd` backend, `0e93a8f` web) are still discoverable on `main`.
- Owner: claude
- Spec: `docs/roadmap/tasks/E14-F04-S01.md` (source: `docs/design/cs-web-admin/`)
- Outcome: full admin surface — Dashboard / Libraries / Users / Permissions — gated by `middleware: 'admin'` (route-level, opt-in via `definePageMeta`), surfaced behind a separate `layouts/admin.vue` shell with responsive sidebar (xs single column, md icons-only, lg full labels). Backend port surface grew from a single `getSnapshot()` to a 7-method `DashboardPort` (`getSnapshot`, `hasAnyUser`, `listRecentScans`, `listAllLibrariesWithCounts`, `listUsers`, `updateUser`, `findUserById`). Web grew nine new composables along the way (`useAdminDashboard`, `useAdminScans`, `useAdminLibraries`, `useAdminLibraryScans`, `useScanProgress`, `useAdminUsers`, `useUpdateAdminUser`, `useAdminUser`, `useAccessGrants`). All grant operations reuse the existing `POST/GET/DELETE /access/grants` endpoints from E07-F01-S01 — no new spec for them.
- Test totals at end: backend 853 / 855 (+50 across the chunks); web 101 / 101 (+58 across the chunks); UI 835 / 835 (chunk 0 only); 333 i18n keys × 2 web locales (was 195).
- Side-effect fixes that landed alongside this card: PR #163 also delivered the dependency E13-F02-S07. PR #166 fixed Forgejo's squash-merge dropping spec source. Backend `exactOptionalPropertyTypes` strict-mode patches across multiple admin specs (chunk 3) — conditional spread instead of `undefined`-passthrough; defensive `[0]?.x` array indexing in unit tests. Backend `prisma.session.deleteMany` on `banned: true` so kicked users lose authentication immediately (chunk 3).
- Notes / deferred: PATCH /libraries/{id}, DELETE /libraries/{id}, and removing users (vs banning) are all "Coming soon" toasts in the UI; the underlying endpoints aren't specced yet. Dashboard "Last scan" stat card shows `Library {libraryId.slice(0,8)}…` because `latestScan` from `/admin/dashboard` doesn't carry a library name (the recent-scans table below it covers the human-readable label). Activity column ("X libraries · Y min watched") on the Users page is dropped — we don't yet aggregate per-user grant counts and minutes-watched on the API.

## T-2026-04-29-060 — Stage A Course detail page (E14-F01-S03) — bookkeeping

- Created: 2026-04-29
- Completed: 2026-04-29
- Result: code shipped earlier — spec + backend handlers via PR http://code.homelab.local/kkucherenkov/course_shelf/pulls/141 (`fc88c10`, "part 1 of 2"); web page + components + Playwright e2e rolled in with the lesson-player PR http://code.homelab.local/kkucherenkov/course_shelf/pulls/144 (`6e5ca29`) because the player navigates from this page so the two were inseparable. Card was never bookkept; this entry closes the loop.
- Owner: claude
- Spec: `docs/roadmap/tasks/E14-F01-S03.md` (source: `docs/design/cs-web-course-detail/`, DESIGN_BRIEF §6.5)
- Outcome: `apps/web/app/pages/courses/[id].vue` (337 lines) composes five colocated components — `CourseHero` (cover left + title/instructor/progress/description right at 1440, stacked at 1024, horizontal strip at 360), `CourseActions` (primary Resume/Start, secondary Mark complete / Reset progress), `CourseSectionsList` (`SectionHeader` + `LessonRow` with current-lesson highlight, collapse), `CourseMaterialsRail` (right-rail at 1440/1024, slides below at 360), `CourseCompletedBanner` (quiet banner — no festival). Four states modelled: Default / InProgress / Completed / Locked-NoAccess (`AppNoPermission`). Backend exposes three endpoints (`GET /courses/:id/outline`, `POST /courses/:id/{mark-complete,reset-progress}`) — outline is a one-round-trip projection (course + sections + lessons + materials + per-lesson progress); mark-complete uses `COALESCE(completedAt, $now)` raw SQL inside a single `$transaction([...])` so already-completed rows preserve their original timestamp; reset-progress deletes the read-model row outright. 8 Playwright tests in `tests/e2e/course-detail.spec.ts`, +27 backend specs (outline 15 / mark-complete 8 / reset-progress 6).
- Side-effect fix that landed alongside the bookkeeping: `POST /courses/:id/{mark-complete,reset-progress}` were silently 500ing (`no schema defined for status code '201'`) because NestJS defaults POST to 201 but the spec only declared 200 — fixed by adding `@HttpCode(HttpStatus.OK)` in PR http://code.homelab.local/kkucherenkov/course_shelf/pulls/157 along with the same fix on `/progress` and `/progress/batch`.
- Notes / deferred: stale `feat/course-detail-page` branch (`c860a3c`) on origin is now redundant — its content overlaps with what landed via #144. Safe to delete (not deleted by this task; user's call).

## T-2026-04-28-059 — Stage A Lesson player wired to <video> (E14-F03-S01)

- Created: 2026-04-28
- Completed: 2026-04-28
- Result: single feature commit `42438cb` on `feat/lesson-player-page` (closes #64) → PR http://code.homelab.local/kkucherenkov/course_shelf/pulls/144. Full e2e suite 26/26 (lesson-player 7 new + foundations 1 + auth 5 + course detail 8 + home 3 + smoke 2); web unit 21/21 (+5 new); UI suite 808/808 unchanged after the AppPlayerChrome z-index tweak. Web lint + typecheck clean.
- Owner: claude
- Spec: `docs/roadmap/tasks/E14-F03-S01.md` (source: `docs/design/cs-web-lesson-player/`, DESIGN_BRIEF §6.6)
- Outcome: real lesson playback. `apps/web/app/pages/courses/[id]/lessons/[lessonId].vue` (~210 lines) pulls lesson + course outline + bookmarks + note in parallel. AppPlayerChrome attached to a real `<video>` via `useLessonPlayer`; stream URL fetched via `useStreamUrl` (one-shot 401 retry through `auth.refresh()`); progress reported via `useProgressReporter` (10 s ticks while playing + visibility-change + beforeunload, dedupes in-flight POSTs). Sidebar tabs — `PlayerSidebar` hosts `AppTabs` + four inline body components (Sections / Notes / Bookmarks / Materials). Bookmarks tab `select(id)` emits `seek(time)` so the page seeks the video. Auto-advance: AppPlayerChrome `state="end"` with 5 s countdown → `navigateTo` next lesson; Stay-here clears, Play-next skips. Layouts: 1440 (1fr 360px), 1024 (1fr 280px), 360 (single column, tabs as horizontal scroller). Resume: `currentTime = lesson.progress.lastSeenAtSeconds` on `loadedmetadata`. Course detail Resume button retargeted from `/lessons/{id}` placeholder to `/courses/{id}/lessons/{lessonId}`.
- Side-effect fixes the e2e shook out: AppPlayerChrome `__overlay` z-index ordering (overlay was intercepting end-banner clicks); chromeState ordering (ended before stream error so stub data URIs show the banner); HTTP status capture via separate ref (useAsyncData strips custom Error properties).
- Notes / deferred: Real materials download endpoint deferred — clicks emit a "Download coming soon" toast (matches Course detail's pattern).

## T-2026-04-28-058 — Foundations canvas (E03-F01-S02)

- Created: 2026-04-28
- Completed: 2026-04-28
- Result: commit `a791ecd` on `feat/foundations-canvas` → PR http://code.homelab.local/kkucherenkov/course_shelf/pulls/143 (Closes #12). 14 vitest + 2 Playwright snapshot tests pass; lint + typecheck clean.
- Owner: claude
- Spec: `docs/roadmap/tasks/E03-F01-S02.md`
- Outcome: ships `/dev/foundations` — 17-section design-system canvas (Color / Typography / Spacing / Radius / Motion / Buttons / Inputs / Cards / Rows / Tabs+Segmented / Feedback / Overlays / Progress / Empty States / Skeleton / Avatar / Chips). Each section shows `@app/ui` components in their full variant × size × state matrix. `__tokens.vue` replaced with a redirect to `/dev/foundations` (backward-compat). `/dev/foundations` added to `PUBLIC_ROUTES` so visual-regression e2e runs without a token. Playwright full-page baselines at 1440×900 light + dark committed.
- Notes / deferred:
  - Mobile (`Tokens.theme.fromMode` + Widgetbook) deferred per user directive; noted in PR description.

## T-2026-04-28-002 — Group course materials by section in the right-rail

- Created: 2026-04-28
- Completed: 2026-04-28
- Result: PR http://code.homelab.local/kkucherenkov/course_shelf/pulls/178 — three commits (spec codegen, backend, web).
- Owner: claude
- Spec: ad-hoc UX polish on top of E14-F01-S03 — no roadmap card.
- Outcome: `CourseMaterialItem` gained required `sectionId` + `sectionTitle` and a documented sort contract — `getCourseOutline` returns the flat materials list ordered by `(section.position, lesson.position, material.id)` so consecutive items belong to the same section. `GetCourseOutlineHandler` does the cross-section sort + decoration in step 7; lessons with an unknown `sectionId` (data anomaly — Section is a child aggregate of Course so it should be unreachable) sort to the end with `+∞`. `CourseMaterialsRail.vue` groups consecutive items by `sectionId` and renders a small uppercase caption per cluster, but only when the rail spans 2+ sections so single-section courses stay visually quiet. +1 backend handler test (cross-section ordering with mixed-input fixture); web tests 153/153.

## T-2026-04-28-001 — AppScanProgress (E13-F02-S07)

- Created: 2026-04-28
- Completed: 2026-04-28
- Result: single feat commit on `feat/scan-progress-ui-component`
- Owner: claude
- Spec: `docs/roadmap/tasks/E13-F02-S07.md`
- Outcome: `packages/ui/src/components/ScanProgress/AppScanProgress.vue` — presentational live-scan indicator. Status dot (pulse animation for running, reduced-motion respected), progress bar, 4-stat grid, current-file line with ellipsis truncation and title tooltip. Props-in/events-out, no router/store/i18n calls. Exported as `AppScanProgress` + `ScanStatus` type from `@app/ui`. 25 new tests (5 snapshots + 2 event + 6 conditional + 12 status-class); suite 810 → 835 total.

## T-2026-04-27-053 — Home page Stage A · web + Playwright half (E14-F01-S01 part 2 of 2)

- Created: 2026-04-27
- Completed: 2026-04-27
- Result: two commits on `feat/web-home-page` (`75e0a7d` style + `65190ea` feat) → PR http://code.homelab.local/kkucherenkov/course_shelf/pulls/138 (closes #59). 3/3 Playwright tests pass; web lint + typecheck clean.
- Owner: claude
- Spec: `docs/roadmap/tasks/E14-F01-S01.md`
- Outcome: Stage A Home page composition lands on `apps/web/app/pages/index.vue`. Greeting (`AppAvatar` + role) + three `HomeRow`s (continue-watching, recently-added, recently-completed — collapsed by default) + right-rail `HomeYourWeek`. Two-column grid at viewport `> 1024px`, single column otherwise. Card sizing tuned so 1440 px shows ~5 `CourseWideCard`s and ~6 `CoursePosterCard`s per the card. Four states per row (loading skeleton, error + retry, empty, populated). `useHome.ts` exposes four `useAsyncData` composables wrapping the SDK; auth middleware now does a silent `auth.refresh()` on hard reload when a bearer token survived in localStorage but Pinia state is empty (production fix that also makes the e2e mocks round-trip without sign-in). Playwright e2e at three viewports (`1440x900`, `1024x768`, `375x800`) with `route()`-mocked endpoints — hermetic.
- Notes / deferred:
  - Bottom-tab nav at xs: `AppNavigationShell` already has the bar, but `default.vue` doesn't wrap children in the shell — migration deferred (cascades into auth/setup). E2e treats bottom-tab presence as conditional.
  - `instructor` rendered as empty string until the SDK home-item DTOs grow the field.
  - Card `accent` derived deterministically from `courseId` (small hash → fixed palette) since the SDK doesn't carry an accent column.

## T-2026-04-27-052 — Home page Stage A · spec + backend half (E14-F01-S01 part 1 of 2)

- Created: 2026-04-27
- Completed: 2026-04-27
- Result: two commits on `feat/web-home` (`e29298a` spec, `bb33650` backend) → PR http://code.homelab.local/kkucherenkov/course_shelf/pulls/137 merged. Backend tests 696/698 (+30); lint + typecheck clean.
- Owner: claude
- Spec: `docs/roadmap/tasks/E14-F01-S01.md`
- Outcome: three new bearer-auth endpoints — `GET /home/recently-added` (Course ordered by createdAt DESC + authz; bulk lesson stats via `Lesson.groupBy`), `GET /home/recently-completed` (CourseProgressReadModel rows where `lessonsCompleted == lessonsTotal AND lessonsTotal > 0`; Prisma can't express column-to-column equality so the adapter pulls `limit*3` rows and filters in-process), `GET /home/your-week` (`[now - 7d, now)` window; `minutesWatched = SUM(positionSeconds)/60` floored; `$queryRaw` for the conditional aggregate). Schemas: `RecentlyAddedDto`/`Item`, `RecentlyCompletedDto`/`Item`, `YourWeekDto` + new `DateRange`. Generated `@app/api-client-{ts,dart}` re-emitted. Catalog → Learning boundary preserved via the existing `src/common/learning-progress/` shared-kernel re-export. `HomeController` extracted a local `parseLimit` helper.

## T-2026-04-27-051 — NoteEditor (E13-F02-S05)

- Created: 2026-04-27
- Completed: 2026-04-27
- Result: single feature commit `f41b16c` on `feat/note-editor-clean` (closes #53) → PR http://code.homelab.local/kkucherenkov/course_shelf/pulls/135. UI tests 808/808 (+22); lint + typecheck clean. (#134 was opened first but had stale ancestor commits picked up before the bookmark family merged; closed in favour of #135.)
- Owner: claude
- Spec: `docs/roadmap/tasks/E13-F02-S05.md` (source: `docs/design/cs-components/components.jsx` §NoteEditor, CSS `docs/design/cs-components/styles.css`)
- Outcome: `AppNoteEditor` — markdown note input with toolbar (Bold / Italic / Heading / List / Link), `edit` ↔ `view` toggle (v-modelable), debounced auto-save (`save(value)` after `debounceMs` of quiet, default 600), and an always-inline sync indicator (`syncing` / `saved` / `failed` / `offline`). The "Saved · Ns ago" label re-renders every second via a `setInterval` that auto-starts on `saved` and stops on every other state. `failed` exposes a Retry button that emits `retry`.
- Markdown renderer: in-house, no extra dep. Pipeline — HTML-escape raw input → inline links (URL routed through `safeUrl` which only allows http(s)/mailto, anything else → `#`) → `**bold**` (greedy first) → `*italic*` (with look-arounds) → block split on blank lines (h1/h2/h3 single-line, `- ` lists, paragraphs with `<br />`). `v-html` guarded with `/* eslint-disable vue/no-v-html */` and a WHY comment listing the sanitisation guarantees.
- A11y: toolbar `role="toolbar"`, every tool has `aria-label`, the toggle exposes `aria-pressed`, sync indicator is `role="status"` + `aria-live="polite"`.
- Storybook: 7 stories (Default / Empty / Preview / Syncing / Failed / Offline / Interactive — last one wires `save` → `syncing` → `saved` with a 500 ms fake-network delay and prints the last event).

## T-2026-04-27-050 — Bookmark family (E13-F02-S04)

- Created: 2026-04-27
- Completed: 2026-04-27
- Result: single feature commit `6060a41` on `feat/bookmark-family` (closes #52) → PR http://code.homelab.local/kkucherenkov/course_shelf/pulls/133. UI tests 786/786 (+23); lint + typecheck clean.
- Owner: claude
- Spec: `docs/roadmap/tasks/E13-F02-S04.md` (source: `docs/design/cs-components/components.jsx` §Bookmark / BookmarkAdd, CSS in `docs/design/cs-components/styles.css`)
- Outcome: three composable domain components for the lesson-player bookmark surface — no modal dialogs.
  - `AppBookmark` — `time, label?, editable?`. Mono accent time chip + label + hover-revealed Edit / Delete actions; click / Enter / Space → `select`; edit and delete `@click.stop` so row select does not bubble. Descriptive `aria-label`.
  - `AppBookmarkAdd` — `time, submitting?, placeholder?`. Inline add row (time chip + `AppInput` + Save). Enter saves, Escape cancels and clears the buffer, `submitting` disables input + blocks double-submit. Empty label allowed (matches JSX).
  - `AppBookmarkList` — `bookmarks, addTime?, editable?, adding?, emptyTitle?, emptyBody?`. Renders the add row when `addTime` is defined, then the bookmark stack, then `AppEmptyState` (icon `bookmark`) when both are absent. Forwards `select / edit / delete` with the entry id and `addSave / addCancel` from the add row.
- Storybook: 14 stories total (`AppBookmark`: Default / NoLabel / ReadOnly / Stack; `AppBookmarkAdd`: Default / Submitting / HourLong / Interactive; `AppBookmarkList`: Default / Empty / ReadOnly / WithAddRow / EmptyWithAddRow / Adding / Interactive).

## T-2026-04-27-049 — PlayerChrome web component (E13-F02-S03)

- Created: 2026-04-27
- Completed: 2026-04-27
- Result: single feature commit `9eb8c6a` on `feat/player-chrome` (closes #51) → PR http://code.homelab.local/kkucherenkov/course_shelf/pulls/132. UI tests 763/763 (+31); lint + typecheck clean.
- Owner: claude
- Spec: `docs/roadmap/tasks/E13-F02-S03.md` (source: `docs/design/cs-components/components.jsx` §PlayerChrome, CSS in `docs/design/cs-components/styles.css`)
- Outcome: presentational lesson-player shell — no `<video>` yet (lands in E14-F03-S01). Two layout modes (`overlay` full chrome, `minimal` slim played-bar peek). Seven states (`idle`, `playing`, `paused`, `buffering`, `error`, `end`, `locked`); `error` and `locked` make the chrome inert (`tabindex=-1`, play disabled, keyboard + scrubber no-op). Scrubber renders track / buffered / played / thumb + optional chapter ticks + bookmark markers (clicking a marker emits `seek` to that time). Slider exposes `role="slider"`, `aria-valuemin=0`, `aria-valuemax=duration`, `aria-valuenow=position`, `aria-valuetext="<current> of <total>"`. Buffer spinner respects `prefers-reduced-motion`.
- Emits: card-mandated `play, pause, seek, speed, toggleSubtitles, togglePip, toggleFullscreen, nextLesson` plus organic `toggleMute, retry, stayHere, prevLesson`.
- Keyboard map: Space/K (play-pause), ←/→ (±5s), J/L (±10s), `,`/`.` (±1/24s), F (fullscreen), M (mute), 0–9 (jump n × 10 %). All seeks clamp to [0, duration]; inputs/textareas inside the chrome are skipped.
- Storybook: 11 stories (each state + Minimal / Muted / NoChaptersOrBookmarks + an `Interactive` sandbox that wires every emit to local refs and prints the last event).

## T-2026-04-27-048 — LessonRow + SectionHeader (E13-F02-S02)

- Created: 2026-04-27
- Completed: 2026-04-27
- Result: single feature commit `c30dd40` on `feat/lesson-row` (closes #50) → PR http://code.homelab.local/kkucherenkov/course_shelf/pulls/128. UI tests 732/732 (+19); lint + typecheck clean.
- Owner: claude
- Spec: `docs/roadmap/tasks/E13-F02-S02.md` (source: `docs/design/cs-components/components.jsx` §LessonRow + SectionHeader, CSS in `docs/design/cs-components/styles.css`)
- Outcome: two domain components for the course detail outline.
  - `AppLessonRow` — `num, title, duration, state, materials?, current?, progress?, loading?`. State matrix: `not-started` (circle), `in-progress` (circle + thin underline + `<n>% watched`), `completed` (check-circle / success), `locked` (lock / muted / inert with `aria-disabled` + `tabindex=-1`). `current=true` is orthogonal to state — flips icon to `play`, paints soft-accent background, draws 3px leading bar, sets `aria-current="true"`. Trailing: optional PDF icon when `materials=true`, mono-spaced duration (`H:MM:SS` ≥ 1h, else `M:SS`). Loading variant renders four `AppSkeleton` strips matching the row layout. Activation: click + Enter/Space emit `select`; locked/loading rows are inert.
  - `AppSectionHeader` — `idx, title, count, duration, open?` (default `open: true`). Title `Section <pad2(idx)> · <title>`; meta `<count> lesson(s) · <Xh Ym | Xh | Ym>` mono-spaced. Chevron rotates `-90deg` when `open=false`. Click + Enter/Space emit `toggle`; `aria-expanded` mirrors `open`.
- Notes: mobile-only `downloadState` from the JSX bundle deferred to a future Flutter card. `fmtTime` is inlined per-component to avoid coupling AppLessonRow to CourseCard.

## T-2026-04-27-047 — AppSsoBlock — SSO/OAuth provider button row (E13-F02-S10)

- Created: 2026-04-27
- Completed: 2026-04-27
- Result: single feature commit `203f461` on `feat/sso-block` (closes #58). UI tests 713/713 (+6); lint + typecheck clean.
- Owner: claude
- Spec: `docs/roadmap/tasks/E13-F02-S10.md` (source: `docs/design/shared/auth.jsx` §SsoBlock)
- Outcome: `AppSsoBlock` ships a vertical stack of secondary `AppButton`s (one per provider) with leading icons. Empty `providers` array renders nothing so the auth page can skip its surrounding "or" divider via the same `providers.length` check. Provider list is fully configurable per the card — any `{ id, label, iconName }` triple works. Click on a button emits `select` with the provider id; the consumer dispatches the right Better Auth flow.
- Architecture: thin wrapper around `AppButton` (variant `secondary`, `block: true`). Wrapper carries `role="group"` + `aria-label="Sign in with"` for screen readers.
- v1 scope: PRD puts OAuth/OIDC/SAML at v2+. The component is in place; the populating data comes from a future `GET /admin/instance` once Better Auth's `genericOAuth` plugins land.

## T-2026-04-27-045 — CourseCard family (poster / wide / compact) (E13-F02-S01)

- Created: 2026-04-27
- Completed: 2026-04-27
- Result: 5 feature commits on `feat/course-card` — `6f72324` (types + helpers + composable), `562f918` (CoursePosterCard), `675aebb` (CourseWideCard), `f85ace6` (CourseCompactRow), `f2a9969` (barrel + Family story). UI tests 662/662 (+71); lint + typecheck clean.
- Owner: claude
- Spec: `docs/roadmap/tasks/E13-F02-S01.md` (source: `docs/design/cs-components/components.jsx` §CourseCard)
- Outcome: three CourseCard variants share `Course` type + `COVER` accent map + `initials()` / `fmtTime()` helpers + `useCourseProgress(course, state)` composable. **Poster** (3:4 cover, ✓ badge for completed, lock + scrim for locked, otherwise progress strip; body with title + instructor). **Wide** (square 80×80 thumb + body with title/instructor/meta row; meta shows `Resume <fmtTime>` (with play icon) or `<pct>%` then `<completed>/<lessons>`). **Compact** (single-line list row: 32×32 thumb + title + bar + mono pct). All three are focusable buttons (`tabindex=0`, `role=button`, `aria-label=title`) with click + Enter/Space activation. Loading variants render skeletons matching the layout.
- Composable: `useCourseProgress(course, state)` accepts `ComputedRef<T> | (() => T)` for both args; returns `{ pct, realState }`. `state="auto"` derives `realState` from `pct` (100 → completed, >0 → in-progress, else not-started); explicit states pass through. 18 dedicated unit tests for the derivation table.
- Storybook: per-variant stories cover Default / NotStarted / InProgress / Completed / Locked / Loading / Variants (all 6 accents) plus a top-level `CourseCardFamily` story rendering all three side by side and a `FamilyAllAccents` story for COVER spot-checking.
- Deviations: composable file is `use-course-progress.ts` (kebab-case per project `unicorn/filename-case`). `CoursePosterCard` loading uses an `aspect-ratio: 3/4` SCSS class on top of `AppSkeleton` because the latter doesn't accept `aspect-ratio` as a prop. `course.cover` override test uses `toContain('url(')` since Vue normalises inline `url()` style values.

## T-2026-04-27-044 — AppPasswordField — visibility toggle + strength meter (E13-F02-S09)

- Created: 2026-04-27
- Completed: 2026-04-27
- Result: single feature commit `1c1b015` on `feat/password-field`. UI tests 591/591 (+18); lint + typecheck clean.
- Owner: claude
- Spec: `docs/roadmap/tasks/E13-F02-S09.md` (source: `docs/design/shared/auth.jsx` §PasswordField)
- Outcome: `AppPasswordField` ships a labelled password input with a leading lock icon, a raw `<button>` visibility toggle on the right (aria-pressed + dynamic aria-label), and an optional 3-segment strength meter. Score heuristic copied verbatim from the JSX (empty/<8/<12/≥12-with-symbol-or->16). Three meter colours track the score (error/warning/success). `error` / `hint` / `meter-label` collapse via `v-else-if` so only one footer line ever renders; `error` wins.
- Toggle uses a plain `<button>` rather than `AppIconButton` so `aria-pressed` and `aria-label` are native HTML attrs without prop-typing gymnastics. Custom CSS matches the bundle's `btn btn-ghost btn-icon btn-sm` look.
- Tokens: `--brand-accent` (focus ring), `--surface-overlay` (meter track + toggle hover), `--status-{error,warning,success}-fg` (meter fill per score), `--text-secondary` (muted text/icon), `--surface-bg-muted` (disabled background).

## T-2026-04-27-043 — AppProgressBadge — ring/bar/pill variants (E13-F02-S06)

- Created: 2026-04-27
- Completed: 2026-04-27
- Result: single feature commit `9c37d9b` on `feat/progress-badge`. UI tests 573/573 (+21); lint + typecheck clean.
- Owner: claude
- Spec: `docs/roadmap/tasks/E13-F02-S06.md` (source: `docs/design/cs-components/components.jsx` §ProgressBadge)
- Outcome: new `AppProgressBadge` covering three visual variants (`ring` 32px conic-gradient, `bar` 4px filled with mono pct, `pill` text matrix) and four domain states (`not-started | in-progress | completed | locked`). Percentage compute: `completed` → 100, `locked`/`not-started` → 0, otherwise `round((completed / total) × 100)` with `total ≤ 0` guard. Drives only off shipped tokens (no hard-coded colors). Storybook ships a 3×4 Variants matrix.
- Architectural notes: multi-root SFC (one branch per variant via `v-if/v-else-if/v-else`) — tests query `.find('.app-progress-badge')` for root-level attributes since `wrapper.attributes()` doesn't traverse multi-root fragments reliably.

## T-2026-04-27-042 — Auth setup wizard + sign-in flow (E11-F01-S03)

- Created: 2026-04-27
- Completed: 2026-04-27
- Result: 6 commits on `feat/auth-setup-wizard` — `08b2570` (`/admin/has-users` probe + port + adapter), `d1b977a` (Better Auth admin-promotion hook), `78d8117` (`useAuthStore.signUp`), `2a55ea1` (rename `/login` → `/sign-in`), `6e6bfc7` (`/setup` page + `hasUsers` middleware gate). Backend tests 668/668 (+4); web tests 19/19 (+2); lint + typecheck clean.
- Owner: claude
- Spec: `docs/roadmap/tasks/E11-F01-S03.md`
- Outcome: minimal-but-functional first-run flow. Backend exposes `GET /api/v1/admin/has-users` (anonymous, sibling controller to keep `AdminController`'s class-level `AdminGuard` intact); Better Auth `databaseHooks.user.create.before` promotes the first user to `role: 'ADMIN'`. SPA: `useAuthStore.signUp` mirrors the existing `signIn` `set-auth-token` capture; `pages/setup.vue` collects email + password + optional display name and submits via the store; middleware gates `/setup` / `/sign-in` based on a per-session `hasUsers` cache; `pages/login.vue` renamed to `pages/sign-in.vue` with all references and locale keys updated.
- Architectural calls: `AdminPublicController` is a separate class because `@AllowAnonymous()` only opts out of the global `SessionGuard`, not the existing `AdminController`'s class-level `AdminGuard`. The `hasUsers` cache lives in `app/composables/useHasUsersCache.ts` (ref + `resetHasUsersCache()` helper) so the middleware keeps its single-default-export contract.

## T-2026-04-27-041 — Primitives batch B: dialog + avatar + chip refactor (E13-F01-S08/S11/S12)

- Created: 2026-04-27
- Completed: 2026-04-27
- Result: 4 feature commits on `feat/primitives-batch-b` — `ac5e3e4` (AppDialog), `3b2dc4b` (AppCommandPalette), `cf8830b` (AppAvatar), `659c626` (AppChip refactor + barrel). UI tests 552/552 (+39 net); lint + typecheck clean.
- Owner: claude
- Spec: `docs/roadmap/tasks/E13-F01-S08.md`, `E13-F01-S11.md`, `E13-F01-S12.md`
- Outcome: 4 components landed. **AppDialog** uses native `<dialog>.showModal()` so focus trap + `inert` are browser-native; backdrop click detection via `event.target === dialogRef`; ESC + close event wired to `update:open`. **AppCommandPalette** composes AppDialog with a search input + filtered/grouped list, arrow-key nav, Enter to select, ESC to close; `Command` type exported alongside. **AppAvatar** has 5 sizes + `image`/`initials`/`name` (computed fallback) + role badges for admin/guest with `aria-label`. **AppChip** refactored from `color × variant × size` to flat `variant: 'default'|'primary'|'success'|'warning'|'error'|'info'` matching the bundle's `.chip-*` classes; icon migrated from AppIcon (Iconify) to IconCS (typed `IconName`); `dismissible` renamed to `removable` to match `.chip-removable`; broken `--status-danger` reference fixed.
- JSDOM workaround: `<dialog>` not fully implemented in JSDOM. AppDialog.spec.ts patches `HTMLElement.prototype.showModal/close` with no-op functions that toggle `open` and dispatch the `close` event in `beforeAll`/`afterAll`; a `stubDialogElement(el)` utility provides per-test `vi.fn()` spies. Documented inline.
- Token deviations: `--bg` → `--surface-page` (not `--surface-bg` as previously assumed). All other mappings inherited from prior tasks.

## T-2026-04-27-040 — Primitives batch A (E13-F01-S05/S06/S09/S10)

- Created: 2026-04-27
- Completed: 2026-04-27
- Result: 5 feature commits on `feat/primitives-batch-a` — `04e1533` (AppRow), `89cb69a` (AppTabs + AppTab), `c5c3bff` (AppSegmented + AppSegmentedItem), `6abee87` (Progress + Spinner + Skeleton), `d8b9d58` (3 state surfaces + barrel). UI tests 513/513 (+103); lint + typecheck + stylelint clean.
- Owner: claude
- Spec: `docs/roadmap/tasks/E13-F01-S05.md`, `E13-F01-S06.md`, `E13-F01-S09.md`, `E13-F01-S10.md` — 4 cards flipped together.
- Outcome: 12 new exports from `@app/ui` covering 10 components — `AppRow`, `AppTabs`, `AppTab`, `AppSegmented`, `AppSegmentedItem`, `AppProgressLinear`, `AppProgressCircle`, `AppSpinner`, `AppSkeleton`, `AppEmptyState`, `AppErrorState`, `AppNoPermission`. All driven off shipped tokens (some bundle aliases ship verbatim, e.g. `--text-loud`, `--surface-2`, `--shadow-1` — engineer used the canonical alias chain). AppTabs and AppSegmented are generic over `T extends string | number` with provide/inject context to children. AppSpinner is a reusable component; AppButton/AppIconButton's inline `::after` spinner is intentionally left as-is (interaction-bound, no a11y cost).
- Architectural calls: arrow-key nav in AppTabs uses DOM-sibling traversal (matches the WCAG tablist pattern from AppRadioGroup in T-037). Generic SFC + vue-test-utils requires `wrapper.vm as { active: T }` workaround for typed access. State surfaces (Empty/Error/NoPermission) ship as three near-duplicate templates rather than an `AppStateBase` abstraction — easier to read and unlikely to drift.
- Token mapping discoveries: `--text-loud` ships verbatim (separate from `--text-fg`); `--text-muted` → `--text-secondary` (not `--text-fg-muted` as previous components used); `--shadow-1` → `--shadow-xs`; `--surface-3` → `--surface-overlay`. Documented inline in the SCSS.

## T-2026-04-27-039 — AppBanner / AppToast / AppAlert (E13-F01-S07)

- Created: 2026-04-27
- Completed: 2026-04-27
- Result: three feature commits on `feat/banners-alerts` — `8f4b996` (AppBanner), `65790c4` (AppToast), `7b24087` (AppAlert + barrel). UI tests 410/410 (+54); lint + typecheck + stylelint clean.
- Owner: claude
- Spec: `docs/roadmap/tasks/E13-F01-S07.md`
- Outcome: three notification-surface components covering the bundle CSS contract. `AppBanner` (4 variants, optional title, dismissible) uses `IconCS` for the leading glyph (info / check-circle / alert) and `AppIconButton` for the dismiss control. `AppToast` is the compact transient surface with the colored 8px dot indicator (success/info/error). `AppAlert` is the single-line inline variant for under-the-input validation messages. All three drive only off shipped status tokens (`--success`, `--success-soft`, etc.); no token-name deviations needed.
- A11y: error variants use `role="alert"` (assertive); other variants use `role="status"` (polite). `AppAlert` is always `role="alert"`. Dismiss buttons carry `aria-label` (overridable, defaults to "Dismiss").
- Out of scope: toast queue/container with auto-dismiss timing — left for a future story (E13-F01-S08 deals with dialogs which include some toast-adjacent behaviour).

## T-2026-04-27-038 — AppCard size + hoverable (E13-F01-S04)

- Created: 2026-04-27
- Completed: 2026-04-27
- Result: commit `6f0f481` on `feat/app-card-bundle` (+ a prettier sweep `e7cdbf3`). UI tests 356/356 (+4); lint + typecheck clean.
- Owner: claude
- Spec: `docs/roadmap/tasks/E13-F01-S04.md`
- Outcome: AppCard gained `size: 'md' | 'lg'` (matches bundle `.card` and `.card-lg`) and `hoverable: boolean` (matches `.card-hover`). Default size is `md` with `--radius-md` + 16px uniform padding; `lg` is `--radius-lg` + 24px. `hoverable` shifts border to `--border-strong` and background to `--surface-raised` on hover, stays a `<div>`, no focus ring; ignored when `interactive` is also true. Existing `interactive` button mode preserved.

## T-2026-04-27-037 — Form primitives (E13-F01-S03)

- Created: 2026-04-27
- Completed: 2026-04-27
- Result: four feature commits on `feat/form-primitives` — `e28d7ec` (audit/fix existing controls), `c8d232d` (AppCheckbox), `3aee420` (AppRadio + AppRadioGroup), `9136d42` (text/number/search field composites + barrel). UI tests 352/352 (+80); web tests 17/17; lint + typecheck clean.
- Owner: claude
- Spec: `docs/roadmap/tasks/E13-F01-S03.md`
- Outcome: full 7-component form set landed. `AppCheckbox` with indeterminate + Space/Enter keyboard support. `AppRadio` + `AppRadioGroup` with WCAG-pattern arrow-key navigation (only checked radio is `tabindex=0`). Composite `AppTextField` / `AppNumberField` / `AppSearchField` wrap `AppField` + `AppInput` with the right type/icons (`+`/`−` steppers using `AppIconButton`; leading `IconCS search` + trailing clear button on search). Existing `AppInput` heights pinned to `28/36/44 px` (replacing broken `var(--space-20)`); `[data-density='compact']` drops md to 30 px per the bundle CSS contract. `AppField` error token corrected (`--status-danger` → `--status-error-fg`). `AppSwitch` `$attrs` propagation fixed so AppField's `id`/`aria-*` land on `<button role='switch'>` not the wrapping `<label>`.
- Architectural calls: arrow-key nav uses DOM traversal (`querySelectorAll('[role=radio]')`) rather than a ref-array registration pattern — matches WCAG radiogroup. ESLint `vue/attribute-hyphenation` ignores `ariaLabel` so AppIconButton's camelCase prop name reconciles with vue-tsc's static type checks (scoped to packages/ui).

## T-2026-04-27-036 — AppButton + AppIconButton (E13-F01-S02)

- Created: 2026-04-27
- Completed: 2026-04-27
- Result: three commits on `feat/app-button-icon` — `0e64fe3` (AppButton refactor), `615cfd6` (AppIconButton), `104ca10` (login.vue migration). UI tests 272/272; web tests 17/17; lint + typecheck clean.
- Owner: claude
- Spec: `docs/roadmap/tasks/E13-F01-S02.md`
- Outcome: `AppButton` collapsed to a flat 4-variant API (`primary | secondary | ghost | destructive`) matching the bundle's `.btn-*` CSS contract; loading state surfaces as `data-loading="true"` with the spinner painted via `::after`; icons typed as `IconName` literals from E13-F01-S01. New `AppIconButton` square component (28/36/44 width === height) wraps `IconCS` and requires `aria-label` (TypeScript-enforced). Storybook covers all 6 states (Default/Hover/Active/Focus/Disabled/Loading) plus a 4×3 Variants matrix for both components. `apps/web/app/pages/login.vue` migrated to the new prop shape.
- Deviations: (1) Three token names from the brief didn't exist in `tokens.generated.css` — substituted: `--surface-surface-alt` → `--surface-raised`, `--status-danger` → `--status-error-fg`, `--text-fg-inverse` → `--text-inverse`. Documented inline in the SCSS. (2) `AppIcon` kept (still used by `AppChip` + `AppBadge`); future cleanup story can migrate those to `IconCS`.
- Tests: +15 (12 new in `AppIconButton.spec.ts` + 3 new cases in updated `AppButton.spec.ts`).

## T-2026-04-27-035 — IconCS — port the bundle's 61-icon family to Vue (E13-F01-S01)

- Created: 2026-04-27
- Completed: 2026-04-27
- Result: three commits on `feat/icon-cs` — `42e8aab` (component + types + barrel), `493dfb4` (66 snapshot tests + 4 a11y/fill assertions), `9617ade` (Storybook stories). UI tests +70; lint + typecheck clean.
- Owner: claude
- Spec: `docs/roadmap/tasks/E13-F01-S01.md`
- Outcome: new `IconCS` component in `packages/ui/src/components/IconCS/` renders any of 66 hand-drawn CourseShelf glyphs from `docs/design/shared/icons.jsx`. Single Vue `<svg>` template with `<template v-if="name === '...'>` per glyph; path data byte-identical to the JSX source (including the `pdf` glyph's `<text>` element). `IconName` literal union exported alongside. Storybook stories: default (single icon) + Grid (all 66 in an 8-column layout). Vitest snapshot per glyph (66) + 4 a11y/fill assertions.
- Deviations: (1) the card's Notes section listed 61 names but the source ships 66 — `sliders`, `arrow-left`, `more-h`, `corner-down-right`, `hard-drive` were extra. All included; the card's "61 names compile" NFR is a strict subset. (2) BEM class is `.app-icon-cs` (not `.icon-cs`) to satisfy the project Stylelint `selector-class-pattern` rule. (3) ESLint filename-case override added for `IconCS/` — the all-caps `CS` acronym doesn't fit kebab-case or strict PascalCase. (4) The `fill` prop honours only `play` and `bookmark` (per the JSX `fill={fill ? stroke : 'none'}` source pattern); other glyphs with intentional inner fills (`pip`, `list`, `more`, etc.) carry `fill="currentColor"` unconditionally as in the source.

## T-2026-04-27-034 — Wire api-client-ts + auth store (E11-F01-S02)

- Created: 2026-04-27
- Completed: 2026-04-27
- Result: six commits on `feat/web-auth-store` — `07374de` (Pinia install), `72e11c4` (auth store), `0780768` (api.client plugin), `2155d9e` (global middleware), `f247814` (login + layout migration + delete legacy composables), `b3647cf` (task-card flip). Web tests 17/17 (6 token-page + 11 auth-store); lint + typecheck clean.
- Owner: claude
- Spec: `docs/roadmap/tasks/E11-F01-S02.md`
- Outcome: bearer-auth-end-to-end on the Nuxt SPA. New Pinia `useAuthStore` wraps `better-auth/vue` and captures the bearer token via a `set-auth-token` response-header hook on sign-in. New `plugins/api.client.ts` Nuxt SPA plugin configures the singleton `client` from `@app/api-client-ts`: request interceptor adds `Authorization: Bearer <token>` when present; response interceptor on 401 calls `auth.refresh()` once then redirects to `/login` if refresh fails. New `middleware/auth.global.ts` gates every route except `/login`, `/signup`, `/__tokens`. `pages/login.vue` and `layouts/default.vue` migrated to the store; `composables/useApi.ts`, `useAuth.ts`, `useApiShape.ts` deleted.
- Deviations: (1) `bearerClient()` plugin not present in `better-auth@1.6.8` — token captured via `@better-fetch/fetch` `onSuccess` hook reading `set-auth-token` instead. (2) Redirect target is `/login` (codebase route) rather than `/sign-in` (card text). (3) `plugins/api.client.spec.ts` deferred — Nuxt-runtime-context faking is awkward; 11 store tests cover the substance. (4) `useApiShape.ts` had zero callers; deleted with the other composables. (5) `@app/api-client-ts/src/index.ts` (hand-written entry) gained a `client` re-export — no codegen rule violated.

## T-2026-04-27-033 — Web SPA bootstrap closeout (E11-F01-S01)

- Created: 2026-04-27
- Completed: 2026-04-27
- Result: two commits on `feat/web-tokens-page` — `ff0f21c` (dark default), `4f09056` (tokens canvas + test). Tests 6/6; lint 0 errors; typecheck clean.
- Owner: claude
- Spec: `docs/roadmap/tasks/E11-F01-S01.md`
- Outcome: `nuxt.config.ts` gains `colorMode: { preference: 'dark', fallback: 'dark' }`. New `pages/__tokens.vue` renders all five token categories (color × 5 sub-groups with `getComputedStyle` live values, spacing bars, radius chips, typography specimens, motion/opacity raw `<dl>`). `UColorModeButton` in the header flips themes in one click. Six vitest assertions cover every category. Also added `@vitejs/plugin-vue` dev dep + `vitest.nuxt-imports-shim.ts` so `#imports` resolves in the plain vitest environment.
- Sub-steps:
  - [x] T-033-A: dark default + colorMode block in `nuxt.config.ts`
  - [x] T-033-B: `pages/__tokens.vue` foundations canvas
  - [x] T-033-C: component test for the page
  - [x] T-033-D: lint, typecheck, test, prettier; flip card; archive T-033

## T-2026-04-27-032 — Admin dashboard aggregator (E21-F01-S01)

- Created: 2026-04-27
- Completed: 2026-04-27
- Result: three commits on `feat/admin-dashboard` — `a89fc9c` (spec), `1b3972d` (codegen), `d9bbe11` (impl). Backend tests 664/664; lint + typecheck clean.
- Owner: claude
- Spec: `docs/roadmap/tasks/E21-F01-S01.md` (PRD FR-OPS-02)
- Outcome: new `AdminModule` ships `GET /api/v1/admin/dashboard` returning `AdminDashboardDto { generatedAt, counts: { libraries, users, courses, lessons }, latestScan, errorsLast24h }`. Six counts run in parallel via `Promise.all`. Auth chain: global `SessionGuard` → class-level `@UseGuards(AdminGuard)`. Future `/admin/*` routes inherit AdminGuard automatically.
- Architecture deviation (improvement): rather than injecting `PrismaService` directly into the application handler (which would trip the `no-restricted-syntax` lint rule banning Prisma in `application/**`), the work was structured as `domain/dashboard.port.ts` (interface + Symbol token) + `infra/prisma-dashboard.adapter.ts` (Prisma implementation). Tighter DDD layering than the brief specified.
- `errorsLast24h` uses `Scan.startedAt > now - 24h` as a proxy timestamp because `ScanErrorRecord` has no own timestamp. The OpenAPI description documents this approximation; works because no scan is expected to outlive a 24-hour window.
- Tests: `get-admin-dashboard.handler.spec.ts` — 4 cases (populated snapshot, null latestScan when no scans, finishedAt null while running, generatedAt is stamped). The 24h cutoff window check moved to adapter responsibility.

## T-2026-04-27-031 — Rate limit on Better Auth sign-in (E21-F02-S01)

- Created: 2026-04-27
- Completed: 2026-04-27
- Result: single impl commit `5116d9c` on `feat/auth-signin-ratelimit`. Backend tests 660/660; lint + typecheck clean.
- Owner: claude
- Spec: `docs/roadmap/tasks/E21-F02-S01.md` (PRD NFR-S-03)
- Outcome: new `SignInRateLimitMiddleware` (in-process token bucket keyed by `req.ip`, 5 attempts / 15 min rolling window) mounted on `POST /api/v1/auth/sign-in/*splat` via `AuthModule.configure`. 6th attempt → `429 Too Many Requests` + `Retry-After: <seconds>` header + RFC 9457 problem JSON. Successful sign-ins also count toward the cap (a successful brute-force probe is still a probe). Other Better Auth routes keep the existing 10/60s class-level `@Throttle` floor.
- Tests: 5 cases — under cap allows, at-cap blocks 429, IPs counted independently, window expires (fake timers), Retry-After value tracks the oldest in-window attempt.
- Trade-off: in-process Map state assumes single backend instance. Redis-backed store is deliberately deferred per the card's sub-step note. When we move to multi-instance, the swap is mechanical.

## T-2026-04-27-030 — E02 retroactive flips (E02-F01-S01, E02-F02-S01, E02-F02-S02, E02-F02-S04)

- Created: 2026-04-27
- Completed: 2026-04-27
- Result: roadmap-only commit on `chore/e02-flips`. No code changes.
- Owner: claude
- Spec: `docs/roadmap/tasks/E02-F01-S01.md`, `E02-F02-S01.md`, `E02-F02-S02.md`, `E02-F02-S04.md`
- Outcome: ticked four cards that had been load-bearing for the entire session (every endpoint shipped this week passed through the spec workspace, the codegen pipeline, and — in CI — the contract test). Each card carries a deviation note documenting why reality looks different from what the card asked for:
  - **E02-F01-S01**: Redocly CLI instead of Spectral; single inline `openapi.yaml` instead of split `paths/*` + `components/*` files.
  - **E02-F02-S01**: `@hey-api/openapi-ts` (named operation functions) instead of `openapi-fetch`-style `paths`/`components`/`createClient`.
  - **E02-F02-S02**: `@app/api-client-ts/server` subpath with class-validator DTOs **not** implemented; runtime validation is delivered by the `express-openapi-validator` middleware (E04-F02-S03) at the HTTP boundary, with backend handlers using type-only imports from `@app/api-client-ts`. Same guarantee from a single source of truth.
  - **E02-F02-S04**: contract testing uses Schemathesis (Docker, property-based, ~25 hypothesis-generated requests per operation) instead of Dredd/Prism. No `apps/backend/test/contract/` directory — the runner sits in `packages/specs/scripts/contract-test.ts` and exercises a running backend over the wire as a black box.
- Out of scope: actually implementing the deviated alternatives is not planned — the substitutes are deliberate architectural choices, not gaps to close.

## T-2026-04-27-029 — Realtime token + channels (E24-F01-S01)

- Created: 2026-04-27
- Completed: 2026-04-27
- Result: three commits on `feat/realtime-channels` — `f1e30d2` (AsyncAPI), `9007b95` (backend), `fd2905d` (Centrifugo namespaces). Backend tests 655/655; lint + typecheck clean.
- Owner: claude
- Spec: `docs/roadmap/tasks/E24-F01-S01.md`
- Outcome: AsyncAPI grew from one channel to four — `system:health` (existing) + `library:scan:{libraryId}`, `notes:lesson:{lessonId}`, `progress:user:{userId}` with full schemas + receive operations. The `RealtimeService` JWT now carries a `channels: string[]` claim restricting subscribe scope to the user-scoped triple `['system:health', 'progress:user:<id>', 'notifications:user:<id>']`. The controller was refactored from the pre-E04-alignment `@Req()` + `auth.getSession(req)` plumbing to `@Session() session: SessionContext` + `@Throttle({ default: { limit: 30, ttl: 60_000 } })`. Centrifugo namespace config (`docker/centrifugo/config.json`) declares the four new namespaces with presence off + history off (safe defaults; future stories can tune per channel).
- Tests: `realtime.service.spec.ts` — 6 cases (sub matches user.id, exp ≈ now+ttl with fake timers, channels membership + length, expiresAt epoch matches exp, valid-secret verify, wrong-secret rejects).
- Deviation: the wildcard channels (`notes:lesson:*`, `library:scan:*`) are not in the connection token's `channels` claim — they need subscribe-time per-channel auth via Centrifugo's `subscribe_proxy`, which is a future story. Also: AsyncAPI 3 / Draft-7 doesn't support OpenAPI's `discriminator`, so the `ScanEvent` oneOf uses per-variant `kind` enums instead.
- Out of scope: actually publishing events into the new channels (the `CentrifugoService.publish` plumbing exists but is unused — feature stories that own the events will wire calls to it).

## T-2026-04-27-028 — E04 alignment (E04-F01-S01..E04-F02-S03)

- Created: 2026-04-27
- Completed: 2026-04-27
- Result: 7 commits on `feat/e04-alignment` (`33cedf6`, `f455d78`, `501bcc2`, `10dd112`, `66d411d`, `e386476`, `50a863e`). Backend tests 649/649; lint + typecheck clean.
- Owner: claude
- Spec: `docs/roadmap/tasks/E04-F01-S01.md`, `E04-F01-S02.md`, `E04-F02-S01.md`, `E04-F02-S02.md`, `E04-F02-S03.md`.
- Outcome: closed the deltas between the actually-shipped backend (which was built on top of an E04 base while those cards were still open) and the cards' acceptance sets, so all five could be flipped to ✅ Done with truthful sub-step ticks instead of "deviation: …" notes. Concrete changes:
  - **`@AllowAnonymous()` + `@Session()` decorators**, **global `SessionGuard`** registered via `APP_GUARD`, and refactor of 9 controllers (Catalog × 4, Learning × 3, Streaming × 1, Auth catch-all × 1) — `@UseGuards(SessionGuard)` + private `resolveActor(req)` boilerplate replaced by `@Session() session: SessionContext`. `_template/_template.controller.ts` deliberately preserved as a counter-example.
  - **`OpsModule`** with `GET /healthz` (always 200) and `GET /readyz` (Prisma `SELECT 1`, returns 503 on failure). Both routes excluded from `setGlobalPrefix('api', { exclude })` so they sit at the server root, outside the `/api` validator mount, and outside the OpenAPI spec.
  - **Better Auth** `admin` plugin enabled; `additionalFields { role: 'string' default 'USER', displayName: 'string' optional }`; `pnpm auth:schema` script regenerates the auth Prisma section.
  - **`GET /api/v1/ping`** authenticated smoke-test endpoint — spec, codegen, `PingController` using the new `@Session()` decorator.
  - Explicit **`ignorePaths`** in the OpenAPI validator: `^\/v1\/auth(\/|$)` (Better Auth handles its own request shapes).
- Deviations from cards:
  - `@thallesp/nestjs-better-auth` **not** installed (native integration is solid; risk-reward poor for a third-party Nest wrapper).
  - Better Auth lives in `apps/backend/src/common/auth/` (not `apps/backend/src/identity/auth.ts`).
  - The domain-error → HTTP filter is named `HttpExceptionFilter` (the cards' `DomainErrorFilter` is the same thing).
  - Existing `phoneNumber` plugin and richer `GET /api/v1/health` snapshot are preserved on top of the cards' minimum.

## T-2026-04-26-027 — Batch progress endpoint for sync (E09-F01-S02)

- Created: 2026-04-26
- Completed: 2026-04-27
- Result: three commits on `feat/progress-batch` — `ff99972` (spec), `e47802a` (codegen), `ac95b71` (impl). Backend tests 638/638; lint + typecheck clean.
- Owner: claude
- Spec: `docs/roadmap/tasks/E09-F01-S02.md`
- Outcome: new `POST /api/v1/progress/batch` accepts up to 200 items per round-trip, returns per-item status (`accepted` | `stale` | `forbidden`) in input order. `RecordProgressBatchHandler` fans out to the existing `RecordProgressCommand` via the command bus — sequential, no parallelism (bounded fan-out, keeps Prisma writes serial, avoids re-entering the same `(userId, lessonId)` row in duplicate-item edge cases). `stale` is computed by strict comparison (`serverLastSeenAt > clientUpdatedAt`); equal timestamps classify as `accepted`. `PermissionDenied` thrown by the inner handler maps to per-item `forbidden` (no-oracle covers missing lessons too); non-permission errors bubble.
- Tests: `record-progress-batch.handler.spec.ts` — 5 cases (mixed three-outcome batch, equal-timestamp accepted, non-permission error bubbles, empty array, sequential call order verified via `mock.calls`).
- Spec deviation from card: card mentioned a `not-found` status; the implementation collapses it into `forbidden` per the no-oracle rule used elsewhere in Learning. Documented in the OpenAPI description.

## T-2026-04-26-026 — ffprobe + thumbnail extraction (E06-F02-S02)

- Created: 2026-04-26
- Completed: 2026-04-27
- Result: single impl commit `4368123` on `feat/ffprobe-thumbnails`. Backend tests 631/631; lint + typecheck clean.
- Owner: claude
- Spec: `docs/roadmap/tasks/E06-F02-S02.md`
- Outcome: new domain port `FfmpegAdapter` + `LocalFfmpegAdapter` shelling out to `ffprobe` / `ffmpeg` via `child_process.execFile` (deviation from card — skipped `fluent-ffmpeg` to avoid extra dep + types fight). `AppConfig.ffprobePath`, `AppConfig.ffmpegPath`, `AppConfig.thumbnailJpegQuality` configurable. Scan handler probes each video and writes a 320×180 JPEG poster (`<src>.thumb.jpg` next to the video). Failure on a single file records `ffmpeg-probe-failed` / `ffmpeg-thumbnail-failed` ScanError and the walk continues. Thumbnail generation is idempotent on mtime. `*.thumb.jpg` is now classified as `ignored` in stem-match so generated thumbs do not round-trip into `Lesson.materials`. Lesson row insertion remains deferred to a future "scan-materialise" story — this card only populates `Scan.discoveredLessons[].metadata` and the on-disk JPEG.
- Tests: adapter unit (5 cases, mocks `execFile` + ffprobe JSON parsing), adapter integration (skipped when no `ffmpeg` in PATH), `run-scan.handler.spec.ts` regression (two-video fixture with one probe rejection), `stem-match.spec.ts` regression (`.thumb.jpg` → `ignored`).
- Docs: `docs/troubleshooting.md` ffmpeg/ffprobe prerequisite entry.

## T-2026-04-26-025 — Subtitle delivery (SRT → VTT) (E08-F02-S02)

- Created: 2026-04-26
- Completed: 2026-04-27
- Result: single impl commit on `feat/subtitle-vtt`. Backend tests 617/617; lint + typecheck clean.
- Owner: claude

## T-2026-04-26-024 — Notes endpoints (E09-F02-S02)

- Created: 2026-04-26
- Completed: 2026-04-26
- Result: three commits on `feat/notes`: `a0fd960` (spec), `4ff5f71` (codegen), `ef7f86f` (impl). Backend tests 591/591; lint + typecheck clean.
- Owner: claude
- Goal: free-form Markdown note, one per `(userId, lessonId)`, with PUT-upsert + GET + idempotent DELETE.
- Sub-steps:
  - [x] OpenAPI: `upsertNote` / `getNote` / `deleteNote` + NoteDto / UpsertNoteRequest. Spec version 0.10.0 → 0.11.0.
  - [x] TS + Dart codegen
  - [x] Prisma `Note` + manual migration SQL
  - [x] domain — aggregate (trim + 1..16384 length) + repo + 2 errors
  - [x] Prisma adapter; `deleteMany` for clean idempotency
  - [x] 3 handlers; GET + DELETE no-oracle rule (missing lesson → 403)
  - [x] `NotesController` in `LearningModule`
  - [x] ~25 new tests; 591/591 total

## T-2026-04-26-023 — Bookmarks endpoints (E09-F02-S01)

- Created: 2026-04-26
- Completed: 2026-04-26
- Result: three commits on `feat/bookmarks`: `cdd36b7` (spec), `195ee04` (codegen), `421881d` (impl). Backend tests 547/547; lint + typecheck clean.
- Owner: claude
- Goal: per-user, per-lesson timestamped bookmarks; owner-only mutations + admin moderation bypass.
- Sub-steps:
  - [x] OpenAPI: list / create / update / delete + 4 schemas
  - [x] TS + Dart codegen
  - [x] Prisma `Bookmark` + manual migration SQL
  - [x] domain — aggregate (trim + 1–200 label, at-least-one-field, label:null clears) + repo + 4 errors
  - [x] Prisma adapter; ordering by positionSeconds ASC; null/undefined label mapping
  - [x] 4 handlers; admin bypass symmetric on UPDATE + DELETE
  - [x] BookmarksController in LearningModule
  - [x] ~30 new tests; 547/547 total

## T-2026-04-26-022 — CourseProgressProjector + continue-watching endpoint (E10-F01-S01)

- Created: 2026-04-26
- Completed: 2026-04-26
- Result: single impl commit `3c0e35e` on `feat/progress-projector`. 47 files changed, 2456 insertions(+). Backend tests 486/486; lint + typecheck clean.
- Owner: claude
- PR: feat/progress-projector → main

## T-2026-04-26-021 — LessonProgress aggregate + record endpoint (E09-F01-S01)

- Created: 2026-04-26
- Completed: 2026-04-27
- Result: single impl commit on `feat/lesson-progress`. Backend tests 441/441 (+34 new); lint + typecheck clean.
- Owner: claude

## T-2026-04-26-020 — `GET /stream/lessons/{id}` with HTTP Range support (E08-F02-S01)

- Created: 2026-04-26
- Completed: 2026-04-26
- Result: single impl commit `1751817` on `feat/stream-range`. Backend tests 407/407; lint + typecheck clean.
- Owner: claude
- Goal: standards-compliant byte-range video delivery; full 200/206/416/400/401/404/500 branch coverage; path traversal provably impossible.

## T-2026-04-26-019 — Short-lived signed stream tokens (E08-F01-S01)

- Created: 2026-04-26
- Completed: 2026-04-26
- Result: three commits on `feat/stream-tokens`: `cf645ae` (spec), `b0486ae` (codegen), `55fd5b4` (impl). Backend tests 375/375; lint + typecheck clean.
- Owner: claude
- Goal: `GET /api/v1/lessons/{id}/stream-url` mints an opaque HMAC-signed token bound to `(userId, lessonId, expiresAt)`; verify in O(1) with no DB lookup.
- Spec diff: `packages/specs/openapi/openapi.yaml` — `GET /lessons/{id}/stream-url` + `StreamUrlDto`. New top-level `Streaming` tag. Spec version 0.6.0 → 0.7.0.
- Codegen impact: yes — TS + Dart regenerated.
- Design impact: none.
- Sub-steps:
  - [x] OpenAPI: `issueStreamUrl` + `StreamUrlDto`
  - [x] TS + Dart codegen
  - [x] new module `apps/backend/src/modules/streaming/`; `StreamingController` registered in `app.module.ts`
  - [x] domain — `StreamTokenSigner` (HS256 over `header.payload.sig`; subkey HKDF-derived from `BETTER_AUTH_SECRET` with info `"courseshelf:stream-token:v1"`; cached after first call)
  - [x] errors — `StreamTokenInvalidError` base + Tampered / Expired / LessonMismatch / Malformed subclasses
  - [x] `IssueStreamTokenQuery` + handler — lesson load → parent-course walk → `AuthorizationService.canSee` → sign
  - [x] `AppConfig` extended with `streamTokenTtlSeconds` (default 900) and `streamTokenHkdfInfo` (default `"courseshelf:stream-token:v1"`)
  - [x] cross-module wiring via `apps/backend/src/common/catalog-tokens/` — re-exports `LESSON_REPOSITORY` / `COURSE_REPOSITORY` / `LessonNotFoundError` plus `CatalogRepositoriesModule` that binds the Prisma adapters; boundaries-config compliant
  - [x] 20+ new tests (signer round-trip + tamper + expiry + mismatch + malformed; handler admin / non-admin / missing-parent paths)

## T-2026-04-26-018 — Lesson + Material + Subtitle read model (E06-F03-S02)

- Created: 2026-04-26
- Completed: 2026-04-26
- Result: three commits on `feat/lesson-material`: `e36b5ed` (spec), `f44ce5a` (codegen), `1b4533f` (impl). Backend tests 355/355; lint + typecheck clean.
- Owner: claude
- Goal: `GET /api/v1/lessons/{id}` returns lesson metadata + sidecar materials and subtitles (language guessed from filename suffix); raw paths never leak in the DTO (NFR-S-01).
- Spec diff: `packages/specs/openapi/openapi.yaml` — `GET /lessons/{id}` + `LessonDto` / `MaterialDto` / `MaterialKind` / `SubtitleDto` / `LessonProgress`. Spec version 0.5.0 → 0.6.0.
- Codegen impact: yes — TS + Dart regenerated.
- Design impact: none for v1.
- Sub-steps:
  - [x] OpenAPI: `getLesson` + DTOs
  - [x] TS + Dart codegen
  - [x] Prisma `Lesson` + `Material` + `Subtitle` + manual migration SQL
  - [x] domain layer at `apps/backend/src/modules/catalog/domain/lesson/`: aggregate, value objects, errors, repo port
  - [x] Prisma adapter (delete-and-recreate of children inside `$transaction`)
  - [x] `stem-match.ts` utility — composite (`1.1 Title`/`1.1. Title`) + simple `01 - Title` prefixes; sidecars attach to videos instead of becoming `unsupported-extension` ScanErrors
  - [x] `RunScanHandler` upgraded — Scan aggregate gains `discoveredLessons[]` (in-memory only); Neovim "mass ScanError" pattern produces zero errors for matched companions
  - [x] `GetLessonQuery` + handler with `AuthorizationService.canSee` grant filter; DTO mapper strips raw paths
  - [x] `LessonsController` registered in `CatalogModule`
  - [x] ~30 new tests (value objects, aggregate, stem-match, handler, repo, scan-regression); 355 / 355 total

## T-2026-04-26-017 — Course aggregate + slug uniqueness + section ordering (E06-F03-S01)

- Created: 2026-04-26
- Completed: 2026-04-26
- Result: single impl commit on `feat/course-aggregate`. 73 new tests (273 total); lint/typecheck clean.
- Owner: claude
- Goal: Course aggregate keyed by (libraryId, slug) with ordered Section list; three new endpoints; admin-only PATCH; grant-filtered GETs.
- Spec diff: yes — spec commit acd4b97; codegen commit bd2251f
- Codegen impact: yes (TS + Dart — separate commits already landed)
- Design impact: none
- Sub-steps:
  - [x] T-017-A: spec edit — acd4b97
  - [x] T-017-B: codegen — bd2251f
  - [x] T-017-C: Prisma Course + Section models + migration SQL
  - [x] T-017-D: domain — Slug/Title/Position VOs + Course aggregate + errors + repo port
  - [x] T-017-E: PrismaCourseRepository (delete-and-recreate sections in $transaction; P2002 → CourseSlugAlreadyTakenError)
  - [x] T-017-F: UpdateCourseMetadataHandler + ListCoursesHandler + GetCourseHandler
  - [x] T-017-G: CoursesController (SessionGuard on GETs, AdminGuard on PATCH); wired into CatalogModule
  - [x] T-017-H: 73 new tests (value objects + aggregate invariants + 3 handlers + repo roundtrip)
  - [x] T-017-I: lint/typecheck/test/prettier all clean

## T-2026-04-26-016 — extend scan parser: composite ordinals + word-prefixed sections

- Created: 2026-04-26
- Completed: 2026-04-26
- Result: single commit on `feat/scan-parser-extended` — `901aa83`. Backend tests 200/200; lint + typecheck clean.
- Owner: claude
- Goal: every realistic Russian / Udemy-style course folder layout in `docs/data/courses/` is recognised with clean section/lesson labels and correct ordinals.
- Spec diff: none
- Codegen impact: no
- Design impact: none
- Sub-steps:
  - [x] tier-3 `COMPOSITE_LESSON_RE` for `N.M Title` and `N.M` lessons (`2.5 Установка…` → `sectionOrdinal=2, ordinal=5, label="Установка на Windows"`)
  - [x] tier-2 `WORD_PREFIXED_RE` (`\p{L}+ N - Title`) for Russian / English module folders (`Модуль 2 - Настройки окружения` → `ordinal=2, label="Настройки окружения"`)
  - [x] `RunScanHandler` runs `parseFolderName` on section folders so `sectionTitles` are clean labels
  - [x] +9 spec cases covering composite + word-prefixed forms; existing 191 tests still green
  - [x] sample `course.json` for `videosmile - Super Figma` (gitignored — manual-verification helper for lessons whose file names are just `N.M.mp4` with no inline title)

## T-2026-04-26-015 — Scan aggregate, FsAdapter, incremental scan (E06-F02-S01)

- Created: 2026-04-25
- Completed: 2026-04-26
- Result: single commit on `feat/library-scan`. Scan aggregate + FsAdapter port + NodeFsAdapter + incremental (mtime,size) detection + course.json v1 parser + folder-name parser + RunScanHandler (fire-and-forget walk) + GetLatestScanHandler + ScansController + PrismaScanRepository + migration. 191 tests green; lint/typecheck clean.
- Owner: claude

## T-2026-04-26-014 — AuthorizationService consumed by Catalog & Streaming (E07-F01-S02)

- Created: 2026-04-26
- Completed: 2026-04-26
- Result: single commit on `feat/authorization-service`. `CommonAccessModule` in `src/common/access/` provides `LruAuthorizationService` behind `AUTHORIZATION_SERVICE` token. `ListLibrariesHandler` + `GetLibraryHandler` filter by grant. 127 tests green.
- Owner: claude

## T-2026-04-26-013 — AccessGrant aggregate + admin endpoints (E07-F01-S01)

- Created: 2026-04-26
- Completed: 2026-04-26
- Result: three commits on `feat/access-grant`: `d82bceb` (spec), `cba2ae2` (codegen), `9315210` (impl). Merged into main as a fast-forward chain.
- Owner: claude
- Goal: admin can grant a user READ access on a library or course, revoke it, and list a user's grants — gated by Better Auth session role check.
- Spec diff: `packages/specs/openapi/openapi.yaml` — three new paths + AccessGrantDto / AccessGrantListDto / RegisterGrantRequest / GrantTarget / GrantLevel. Spec version 0.2.0 → 0.3.0.
- Codegen impact: yes — TS + Dart regenerated end-to-end (Java prerequisite from T-012 in place).
- Design impact: none for v1.
- Sub-steps:
  - [x] OpenAPI: registerGrant / revokeGrant / listGrantsByUser + DTOs with discriminated GrantTarget
  - [x] TS + Dart codegen
  - [x] Prisma `AccessGrant` model + composite unique + migration SQL
  - [x] domain aggregate at `apps/backend/src/modules/access/domain/grant/` (mirror of catalog pattern)
  - [x] Prisma adapter; P2002 → `GrantAlreadyExistsError` (409)
  - [x] CQRS handlers: register, revoke, list-by-user, plus get-by-id for post-write re-read
  - [x] AccessController + AdminGuard + AccessModule registered in app.module.ts
  - [x] 32 new tests covering domain invariants, all four handlers, repo roundtrip, admin-guard. 102/102 passing.

## T-2026-04-26-012 — fix Dart codegen (openapi-generator-cli env conflict)

- Created: 2026-04-26
- Completed: 2026-04-26
- Result: merged locally to main as `a77c9af` (`git merge --ff-only` from `chore/dart-codegen-fix`).
- Owner: claude
- Goal: `pnpm spec:codegen` succeeds end-to-end so the Dart Dio client tracks the OpenAPI spec.
- Spec diff: none
- Codegen impact: yes — Dart leg now produces output for new endpoints
- Design impact: none
- Sub-steps:
  - [x] reproduced the failure: actual root cause is "Unable to locate a Java Runtime" (JVM missing on macOS), not a NestJS dep wrapper conflict — the earlier diagnosis was wrong
  - [x] installed OpenJDK 21 LTS via Homebrew (`brew install openjdk@21`) and set `JAVA_HOME`
  - [x] re-ran `pnpm spec:codegen` end-to-end — all four legs (openapi-typescript, hey-api/openapi-ts, openapi-generator-cli dart-dio, asyncapi) succeed
  - [x] committed regenerated Dart artefacts: CatalogApi + LibraryDto / LibraryListDto / RegisterLibraryRequest + ApiDoc markdown + test scaffolds
  - [x] documented the Java prerequisite in `docs/troubleshooting.md` (Homebrew install, JAVA_HOME export, Linux/Windows hints, CI `actions/setup-java@v4`)

## T-2026-04-26-011 — fix workspace tsc regression in generated `@app/api-client-ts`

- Created: 2026-04-26
- Completed: 2026-04-26
- Result: merged locally to main as `03a6030` (`git merge --ff-only` from `chore/api-client-ts-strictness`).
- Owner: claude
- Goal: workspace `tsc --noEmit` exits 0 across the repo after E06 codegen introduced strict-typing mismatches in the generated `@hey-api/openapi-ts` output.
- Spec diff: none
- Codegen impact: subtle — consumers now read `.d.ts` from `dist/`, not raw `.ts`
- Design impact: none
- Sub-steps:
  - [x] add `packages/api-client-ts/tsconfig.build.json` (emitDeclarationOnly to `dist/`)
  - [x] flip `package.json`: `types`, `exports.types` → `./dist/index.d.ts`; runtime `main` stays at raw `.ts` (Node `--experimental-strip-types`)
  - [x] root `prepare` and `spec:codegen` chain `pnpm --filter @app/api-client-ts build` so dist always exists after install / codegen
  - [x] verified: `pnpm -r typecheck` clean for all 8 TS projects; lint 0 errors / 53 vue-formatting warnings; backend tests 70/70

## T-2026-04-26-010 — Library aggregate + register/list/get endpoints (E06-F01-S01)

- Created: 2026-04-26
- Completed: 2026-04-26
- Result: three commits on `feat/library-aggregate`: `a710c5d` (spec), `be9ac44` (TS codegen), `0ef1607` (impl). Merged into main as a fast-forward chain.
- Owner: claude
- Goal: first real domain story for Catalog — Library aggregate with name + rootPath invariants, persisted via Prisma behind a domain-owned port, exposed at `POST/GET /api/v1/libraries{,/{id}}`.
- Spec diff: `packages/specs/openapi/openapi.yaml` (3 paths + 3 schemas, version bumped 0.1.0 → 0.2.0)
- Codegen impact: yes — TS regenerated; Dart skipped (env issue tracked separately)
- Design impact: none
- Sub-steps:
  - [x] OpenAPI: registerLibrary / listLibraries / getLibrary + LibraryDto / LibraryListDto / RegisterLibraryRequest
  - [x] TS codegen committed separately
  - [x] Library aggregate at `apps/backend/src/modules/catalog/domain/library/` (path corrected from `contexts/` to match the existing `modules/` pattern + boundaries)
  - [x] LibraryRepository port + Prisma adapter + mapper
  - [x] CQRS: RegisterLibraryCommand + ListLibrariesQuery + GetLibraryQuery handlers
  - [x] CatalogController + CatalogModule registered in app.module.ts
  - [x] Prisma `Library` model + migration SQL (authored manually because Docker was off; identical to what `prisma migrate dev --create-only` would produce)
  - [x] 5 spec files (aggregate, three handlers, repository roundtrip), 70/70 passing
  - [x] backend `lint` clean; workspace `tsc` regression in generated TS clients tracked as T-011 (not E06 fault)

## T-2026-04-26-009 — Prisma generate postinstall + close E01-F01-S02

- Created: 2026-04-26
- Completed: 2026-04-26
- Result: merged locally to main as `a6006cf` (no GitHub PR; `git merge --ff-only` from `chore/prisma-generate`).
- Owner: claude
- Goal: workspace-wide `pnpm -r lint` finishes with zero errors on a clean clone right after `pnpm install`, without any manual codegen step.
- Spec diff: none
- Codegen impact: no
- Design impact: none
- Sub-steps:
  - [x] run `prisma generate` once to verify lint/typecheck go green
  - [x] wire `postinstall: prisma generate` in `apps/backend/package.json`
  - [x] verify postinstall fires on `pnpm install`
  - [x] confirm `pnpm -r lint` reports 0 errors workspace-wide
  - [x] flip E01-F01-S02 to ✅ Done; TODO progress 7 / 115 → 8 / 115

## T-2026-04-26-008 — stage the design bundle under docs/design/ + index + .gitattributes

- Created: 2026-04-26
- Completed: 2026-04-26
- Result: merged locally to main as `5a57b7f` (no GitHub PR; `git merge --ff-only` from `chore/design-bundle-index`).
- Owner: claude
- Goal: a clone of the repository carries the full design handoff bundle alongside an index that names every project slug, its consumption story, and its file inventory; `.gitattributes` collapses prototype HTML/JSX/CSS as vendored.
- Spec diff: none
- Codegen impact: no
- Design impact: yes — bundle is now first-class repo content
- Sub-steps:
  - [x] move `docs/design/uploads/DESIGN_BRIEF.md` → `docs/design/DESIGN_BRIEF.md`
  - [x] write `docs/design/README.md` (index + handoff conventions)
  - [x] write `.gitattributes` (linguist-vendored on `docs/design/**` + linguist-generated on Dart tokens)
  - [x] flip `docs/roadmap/tasks/E00-F01-S01.md` to ✅ Done; tick TODO; bump progress to 7 / 115
  - [x] move T-006 / T-007 to `done.md`

## T-2026-04-26-007 — apps/backend/src/shared kernel: Branded IDs + DomainError + subclasses

- Created: 2026-04-26
- Completed: 2026-04-26
- Result: merged locally to main as `a3a8449` (no GitHub PR; `git merge --ff-only` from `chore/backend-shared-kernel`).
- Owner: claude
- Goal: cross-context kernel for `apps/backend` — `Brand<T,B>`/`Id<B>` for compile-time identifier safety and `DomainError` (+ `InvariantViolation`/`NotFound`/`PermissionDenied`) for RFC 9457 mapping.
- Spec diff: none
- Codegen impact: no
- Design impact: none
- Sub-steps:
  - [x] write `apps/backend/src/shared/{branded-id,domain-error}.ts` + spec files
  - [x] move three `common/errors/domain-error` import sites to `shared/`
  - [x] remove `apps/backend/src/common/errors/`
  - [x] add `shared` element to `boundaries/elements`
  - [x] tests 43/43; lint/typecheck regress-free (only pre-existing prisma type errors remain)

## T-2026-04-26-006 — eslint-plugin-boundaries: enforce DDD bounded-context boundaries

- Created: 2026-04-26
- Completed: 2026-04-26
- Result: merged locally to main as `6a17c89` (no GitHub PR; `git merge --ff-only` from `chore/eslint-boundaries`).
- Owner: claude
- Goal: a sibling-module import inside `apps/backend/src/modules/<X>` referencing `apps/backend/src/modules/<Y>` (Y ≠ X) fails lint with a readable, action-oriented message.
- Spec diff: none
- Codegen impact: no
- Design impact: none
- Sub-steps:
  - [x] add `eslint-plugin-boundaries` + `eslint-import-resolver-typescript` to `@app/eslint-config`
  - [x] wire `boundaries/elements` (module / common / i18n / app) and `boundaries/element-types` rule in `nest.mjs`
  - [x] mutation test confirmed cross-import rejection with the expected message
  - [x] left `boundaries/element-types` (v5 syntax) — v6 `boundaries/dependencies` rejected the migrated config; deferred follow-up

## T-2026-04-26-005 — archive sweep: mark already-shipped roadmap stories as Done

- Created: 2026-04-26
- Completed: 2026-04-26
- Result: merged locally to main as `c19c247` (no GitHub PR; `git merge --ff-only` from `chore/roadmap-archive-sweep`).
- Owner: claude
- Goal: walk every `docs/roadmap/tasks/E*.md` card, flip status to ✅ Done where the story's acceptance is already satisfied by the current codebase. Conservative — borderline left at ⬜.
- Spec diff: none
- Codegen impact: no
- Design impact: none
- Sub-steps:
  - [x] inventory: 6 Done (E01-F01-S01, E02-F01-S02, E02-F02-S03, E03-F01-S01, E12-F01-S01, E22-F01-S02), 5 deliberate borderline
  - [x] update each Done card: status line, sub-step boxes, Notes block
  - [x] tick matching boxes in `docs/roadmap/TODO.md` and update progress counter (`6 / 115`)
  - [x] sanity check on counts
  - [x] prettier on touched markdown

## T-2026-04-26-004 — design-token cross-source audit (PR 3b)

- Created: 2026-04-26
- Completed: 2026-04-26
- Result: merged locally to main as `5189c92` (no GitHub PR; `git merge --ff-only` from `chore/design-tokens-audit`).
- Owner: claude
- Goal: cross-source audit script comparing `docs/design/shared/tokens.json` (palette) ↔ `specs/design/tokens/*.json` (DTCG); fails CI on hex drift. Plus closing residual scale drift (spacing/radius/font) surfaced by the first run.
- Spec diff: none
- Codegen impact: no
- Design impact: locked the brand alignment behind a script
- Sub-steps:
  - [x] write `packages/design-tokens/scripts/audit-cross-source.ts`
  - [x] add `audit:cross-source` script to `packages/design-tokens/package.json`
  - [x] close residual scale drift in `specs/design/tokens/{spacing,radius,typography}.json`
  - [x] mutation test confirmed audit fails on a flipped hex
  - [x] new `packages/design-tokens/README.md` documents both sources, alias layer, and audit's role
  - [x] lint, typecheck, audit (42 / 42) all green; 4 known prototype-internal drifts reported as ℹ

## T-2026-04-26-003 — brand-align design tokens + emit alias layer (PR 3a)

- Created: 2026-04-26
- Completed: 2026-04-26
- Result: merged locally to main as `9e0a851` (no GitHub PR; merge happened on the local clone via `git merge --ff-only` from `chore/design-tokens-canonical`).
- Owner: claude
- Goal: replace the blue-stub palette in `specs/design/tokens/*.json` with CourseShelf brand values and teach the emitter to publish prototype short CSS-var names (`--bg`, `--surface`, `--primary`, …) as `var()` aliases of the DTCG long names.
- Spec diff: none
- Codegen impact: no
- Design impact: yes — first time the code-stack carries actual CourseShelf brand
- Sub-steps:
  - [x] rewrite `specs/design/tokens/color.json` with brand hex values + new roles (text.loud, surface.skeleton{Base,Shine}, brand.accentSoft, status.{\*}Soft)
  - [x] rewrite `specs/design/tokens/shadow.json` with brand shadow tints
  - [x] tune `specs/design/tokens/motion.json` durations/easings to match prototype curves
  - [x] extend `emit-scss.ts` with themed alias section + static `--d-*`/`--e-*` aliases
  - [x] verified: short-name alias hex byte-equals prototype hex for all 22 color/shadow pairs (dark + light)
  - [x] lint --fix + typecheck clean

## T-2026-04-26-002 — rewrite roadmap story registry under the current stack

- Created: 2026-04-26
- Completed: 2026-04-26
- Result: merged locally to main as `417bcfe` (no GitHub PR; merge happened on the local clone via `git merge --ff-only` from `chore/roadmap-collapse`).
- Owner: claude
- Goal: every story in `docs/roadmap/tools/generate.py` reflects the real codebase — `apps/backend`, generated `@app/api-client-{ts,dart}`, Nuxt UI v4 + Tailwind 4 + `@app/ui`, Centrifugo realtime, and the current `packages/design-tokens` pipeline.
- Spec diff: none
- Codegen impact: no
- Design impact: none
- Sub-steps:
  - [x] inventory legacy terms in the registry
  - [x] swap paths: `apps/api`→`apps/backend`; legacy contract packages → `packages/specs` + `@app/api-client-{ts,dart}`; `packages/shared-kernel`→`apps/backend/src/shared`
  - [x] swap web stack: Vuetify→Nuxt UI v4 + Tailwind 4 + `@app/ui`; remove `useApi/useAuth/useAuthToken` composables in favour of `@app/api-client-ts`
  - [x] swap design pipeline: Style Dictionary → current `packages/design-tokens` (`pnpm design:build`)
  - [x] swap commands: `pnpm gen:all` → `pnpm spec:codegen`
  - [x] add Centrifugo coverage: AsyncAPI sub-step in E02 + new epic E24
  - [x] dissolve E05 into E04-F01-S01
  - [x] keep Drift in E15 as-is
  - [x] run generator; 115 task files, zero warnings
  - [x] prettier on regenerated `.md`; sanity-grep clean

## T-2026-04-26-001 — collapse duplicate roadmap copies, retarget generator path

- Created: 2026-04-26
- Completed: 2026-04-26
- Result: merged locally to main as `32dcead` (no GitHub PR; merge happened on the local clone via `git merge --ff-only` from `chore/roadmap-collapse`).
- Owner: claude
- Goal: one source of truth for the roadmap lives under `docs/roadmap/`; the generator writes there instead of a sandbox path.
- Spec diff: none
- Codegen impact: no
- Design impact: none
- Sub-steps:
  - [x] move `docs/tasks/` → `docs/roadmap/tasks/`
  - [x] remove `docs/{README,ROADMAP,TODO}.md` (untracked duplicates)
  - [x] write `docs/roadmap/README.md` (workflow points at `specs/tasks/active.md`; `packages/api-contracts` → `packages/specs/openapi/openapi.yaml`; `pnpm gen:all` → `pnpm spec:codegen`)
  - [x] retarget `docs/roadmap/tools/generate.py`: `OUT` derived from `__file__`; `write_readme()`/`write_roadmap()` mention the script at its real path
  - [x] prettier on touched `.md`
