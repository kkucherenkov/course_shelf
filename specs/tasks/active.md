# Active tasks

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
- Status: in-progress
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
- Status: in-progress — PR open: https://github.com/kkucherenkov/course_shelf/pull/313, CI running. Move to done.md on merge.
- Blockers: —

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
- Status: PR open, awaiting review — see PR description for #281/#277/#305 disposition (#277 not closed, see sub-step above)
- Blockers: —
