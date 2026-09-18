## T-2026-09-15-lesson-path-convention — `Lesson.videoPath` is stored absolute although every reader treats it as library-relative

- Created: 2026-09-15
- Completed: 2026-09-15
- Owner: claude
- Spec: none — no wire contract change. Closes #554, #555.
- Goal (#554): pick one convention for `Lesson.videoPath` (library-relative —
  survives a library root move; matches what `Material.path`/`Subtitle.path`/
  `Transcript.sourcePath` already claim in their own doc comments) and make a
  value object carry it so a future write site cannot regress to absolute by
  mistake. Migrate existing rows. Remove the call-site normalisations
  (`run-transcription.handler.ts`, `lesson-file-locator.ts`'s
  `locateGeneratedSubtitle`) that #529 added to compensate for the bug —
  they become dead code once the model itself enforces the convention.
- Goal (#555): backfill `language` on `Transcript` rows generated before #501
  taught `LocalWhisperAdapter` to record whisper's real detection (~1945 rows
  stuck at `und`, shown as "Unknown" in the CC menu) by classifying each row's
  own cue text, restricted to `en`/`ru` with a configurable default for
  anything else. Must rename the row's derived `.srt` file on disk BEFORE
  updating the DB row — `run-scan.handler.ts` re-derives `language` from the
  filename on every scan, and `LessonFileLocator` recomputes the expected path
  from the DB column, so updating one without the other reproduces the #529
  failure (locator expects a file that is not there).
- Order: #554 first — the backfill renames files using the library-relative
  path convention #554 fixes; reversing the order builds the rename on the
  bug this task is closing.
- Design (#554): `LibraryRelativePath` value object
  (`domain/shared-vo/library-relative-path.ts`), modelled on this module's
  `LanguageTag`/`EntitySlug` — `.from(raw, libraryRoot)` normalises an
  absolute-or-relative input against a root (throws
  `LibraryRelativePathEscapedError` if it would escape), `.reconstitute(value)`
  trusts a persisted row. `Lesson.create`/`Lesson.reconstitute` require it for
  `videoPath` (was a raw `string`) — the type is what makes passing an
  absolute path a compile error, not a comment. `Lesson.videoPath` getter
  keeps returning `string` (dozens of untouched call sites treat it as one);
  new `Lesson.absoluteVideoPath(libraryRoot)` replaces the manual
  `path.resolve(library.rootPath, lesson.videoPath)` idiom duplicated across
  `run-transcription.handler.ts` and `lesson-file-locator.ts`. `run-scan.handler.ts`
  keeps its internal walk in absolute-path space (untouched — it is also what
  `Material`/`Subtitle` sidecars do, and rewriting that too is out of this
  card's scope) and converts to `LibraryRelativePath` only at the
  `Lesson.create()` boundary; `existingLessonByVideoPath`'s keys flip from
  trusting the stored value raw to `lesson.absoluteVideoPath(rootPath)` so
  they stay in the same (absolute) space as everything else the walk matches
  against. Hand-written SQL migration strips each lesson's own library's
  `rootPath` prefix via `lesson -> section -> course -> library` — could not
  run it against a live DB (no `course_shelf` compose stack on this machine;
  said so plainly in the PR).
- Design (#555): pure classifier over concatenated cue text
  (`domain/transcription/classify-cue-language.ts`), reusing the `en`/`ru`
  restriction `resolveDetectedLanguage` (#501) already established rather
  than inventing a second one. A new `TranscriptRepository.findGeneratedByLanguage`
  / `.reclassifyGenerated` pair (adapter resolves `libraryId` via
  `lessonId -> Lesson.courseId -> Course.libraryId`, no FK on Transcript to
  join through) backs a `BackfillTranscriptLanguageCommand`/`Handler`, driven
  by `src/backfill-transcript-language.ts` — built the way `src/seed.ts` runs
  (not `--experimental-strip-types` directly, and not under `scripts/` either
  — #480 killed the last two scripts that tried the same DI-heavy shape from
  there) — dry-run by default, idempotent (only touches `language: 'und'`,
  `origin: 'generated'` rows), renames the derived `.srt` before writing the
  row. Sidecar-origin `und` rows are left alone (no filename tag to derive
  from, ever — not a bug). Tests run on fixtures; the real 1945-row NAS
  backfill was not executed from here — said so plainly in the PR.
- Sub-steps:
  - [x] `LibraryRelativePath` VO + `LibraryRelativePathEscapedError` + spec
  - [x] `Lesson` domain: typed `videoPath`, `absoluteVideoPath()`
  - [x] `prisma-lesson.repository.ts` reconstitute
  - [x] `run-scan.handler.ts` write/read-side fix (5 sites)
  - [x] `run-transcription.handler.ts` + `lesson-file-locator.ts`: drop the
        #529 normalisations, use `lesson.videoPath`/`absoluteVideoPath()`
  - [x] SQL migration for existing absolute rows (hand-written, unrun — no
        live DB on this machine)
  - [x] update every touched test (unit specs construct `Lesson` via the VO
        now) — `run-scan.handler.spec.ts` was the big one (~30 sites)
  - [x] #555: language classifier + spec
  - [x] #555: `TranscriptRepository` port additions + Prisma adapter
  - [x] #555: `BackfillTranscriptLanguageCommand`/`Handler` + spec
  - [x] #555: `src/backfill-transcript-language.ts` CLI + package.json script + eslint override (mirrors `main.ts`/`seed.ts`) — confirmed it loads
        under the real Nest DI container via a compiled `dist/` smoke run
        (fails only on missing `DATABASE_URL`, which is expected here)
  - [x] docs: none of `docs/` asserted the old (absolute) convention — no
        stale claim to fix
  - [x] lint/format/typecheck/test gates — `turbo run lint test typecheck
--filter=@app/backend` green, `pnpm --filter @app/backend build` green,
        2143 backend tests passing
  - [x] open PR with `Closes #554`, `Closes #555`
- Status: done
- Result: [#560](https://github.com/kkucherenkov/course_shelf/pull/560) — CI and
  E2E smoke both green (not yet merged). The E2E smoke workflow's real Postgres
  proved the migration applies cleanly via the backend image's own
  `migrate deploy` entrypoint, but on a freshly-seeded DB with no pre-existing
  absolute `videoPath` rows to actually rewrite — the maintainer's production
  data still needs a real `migrate deploy` to confirm the `UPDATE` itself. The
  real ~1945-row #555 backfill was not executed anywhere (no `course_shelf`
  compose stack on this machine to hold that data).
