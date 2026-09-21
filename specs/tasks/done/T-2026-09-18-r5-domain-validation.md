## T-2026-09-18-r5-domain-validation — validate flashcard sourceCueId ownership and Material/Subtitle paths

- Created: 2026-09-18
- Owner: claude
- Spec: tuxedo 208, tuxedo 174 (domain-validation wave)
- Goal: the domain rejects two kinds of trusted-but-unverified input instead of
  silently accepting them — a flashcard's `sourceCueId` that does not belong to
  the lesson's transcript, and a `Material`/`Subtitle` filesystem path that is
  absolute (same class of bug as #554's `Lesson.videoPath`).
- Acceptance:
  - Creating a flashcard with a `sourceCueId` pointing at a cue from a
    different lesson (or a nonexistent id) fails with a domain error, not a
    silently saved row.
  - Creating a flashcard with a `sourceCueId` that genuinely belongs to the
    lesson's transcript still succeeds.
  - `Material.fromFile` / `Subtitle.fromFile` reject an absolute path outside
    `libraryRoot` the same way `LibraryRelativePath.from` already does for
    `Lesson.videoPath`.
  - `LessonFileLocator.locateMaterial` / `locateSubtitle` resolve absolute
    paths via the VO, not a manual `path.resolve` on a raw string.
- Spec diff: none (validation only, no wire-shape change)
- Codegen impact: no
- Design impact: none
- Tests: unit — `create-flashcard.handler.spec.ts` (foreign/missing cue
  rejected, own cue accepted), `material.spec.ts` / `subtitle.spec.ts`
  (absolute path outside root rejected), `lesson-file-locator.spec.ts`
  (traversal guard still exercised through the VO-based fixture shape),
  `prisma-lesson.repository.spec.ts` roundtrip.
- Sub-steps:
  - [x] `TranscriptRepository.cueBelongsToLesson` port + Prisma adapter
  - [x] `FlashcardSourceCueInvalidError` + `CreateFlashcardHandler` check
  - [x] `Material.path` / `Subtitle.path` → `LibraryRelativePath`
  - [x] `LessonFileLocator` uses `absolutePath(libraryRoot)`
  - [x] update all call sites + specs
  - [x] `pnpm format`
  - [x] PR review (#752): NAS `material`/`subtitle` are 100% absolute paths
        (316/316, 1883/1883) — validation alone would 500 every read after
        deploy. Added `20260918220000_material_subtitle_path_relative`
        (backfill, same shape as `20260915120000_lesson_video_path_relative`)
        in this PR, riding with the validation so `prisma migrate deploy` at
        container start never applies one without the other.
  - [x] verified backfill against a throwaway Postgres: strips the absolute
        prefix, leaves already-relative rows untouched, second run is
        `UPDATE 0` on every table (idempotent), and a decoy row under a
        `rootPath` containing `_` proves the `left()` comparison doesn't fall
        into the `LIKE`-wildcard trap a naive pattern match would
- Status: done
- Blockers: —
- Completed: 2026-09-21
- Result: https://github.com/kkucherenkov/course_shelf/pull/752
