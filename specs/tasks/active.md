# Active tasks

## T-2026-09-14-catalog-integrity — stop the walk descending into junk, stop orphaning transcripts, stop pointing continue-watching at a deleted lesson

- Created: 2026-09-14
- Owner: claude
- Spec: none — three independent defects found on the maintainer's live
  library (#506, #502, #497 / tuxedo 128, 126, 127)
- Goal: a library scan does not treat a course's own sample-code dependency
  tree as thousands of spurious errors; deleting a library leaves no
  `Transcript`/`TranscriptCue` behind; continue-watching never returns a
  `lastSeenLessonId` for a lesson that no longer exists.
- Acceptance:
  - scanning a course folder containing `node_modules` (or `__pycache__`,
    `vendor`, `bower_components`) produces no `unsupported-extension` errors
    for anything under it
  - deleting a library removes every `Transcript` row (and cues, via FK
    cascade) for its lessons — verified by count, not eyeballed
  - continue-watching omits an item whose `lastSeenLessonId` lesson was
    deleted, rather than returning a dangling id
- Spec diff: none — no wire shape changed
- Codegen impact: no
- Design impact: none
- Tests: unit — `node-fs-adapter.spec.ts` (real temp-dir walk),
  `prisma-library.repository.spec.ts` (transcript cascade + derivedPath
  unlink), `get-continue-watching.handler.spec.ts` (#497 resolution)
- Sub-steps:
  - [x] `NodeFsAdapter.walk` skips `IGNORED_DIRECTORY_NAMES`, no descent
  - [x] `PrismaLibraryRepository.removeWithCascade` deletes `Transcript` rows
        for the library's lessons (step 6) and unlinks `derivedPath` best-effort
  - [x] `LessonRepository.existsByIds` + `GetContinueWatchingHandler` drops
        items whose `lastSeenLessonId` lesson is gone
  - [x] gates: lint --fix, format, test, typecheck all green
- Status: in-progress
- Blockers: —

## T-2026-09-14-fix-centrifugo-namespaces — declare the namespaces the contract uses

- Created: 2026-09-14
- Owner: claude
- Spec: none — the AsyncAPI contract was already correct; found while
  debugging a live NAS deployment whose scan progress never moved
- Goal: every Centrifugo namespace used by a channel in
  `packages/specs/asyncapi/centrifugo.yaml` must be declared in every
  Centrifugo configuration, and stay that way.
- Sub-steps:
  - [x] add `scans` and `maintenance` to dev, prod and release configs
  - [x] `scripts/check-realtime-namespaces.ts` deriving the required set from
        the contract
  - [x] wire it as `pnpm check:realtime` and a CI step
- Status: in-progress
- Blockers: —
