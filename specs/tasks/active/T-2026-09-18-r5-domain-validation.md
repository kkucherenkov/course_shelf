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
- Status: in-progress
- Blockers: — (awaiting PR)
