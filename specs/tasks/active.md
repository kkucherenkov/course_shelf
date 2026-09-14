# Active tasks

## T-2026-09-14-generated-subtitle-abs-path — a generated transcript is unreachable at the wire

- Created: 2026-09-14
- Owner: claude
- Spec: none — found on the maintainer's live NAS after a full transcription
  run of «Физика на кончиках пальцев» produced 48/48 transcripts that the
  player never showed
- Goal: `GET /stream/lessons/{id}/subtitles/{language}` serves the generated
  track instead of answering 500 `derived-path-escaped`.
- Root cause: `Lesson.videoPath` is stored absolute (the scan records what it
  walked), but `derivedTranscriptPath` documents it as library-relative.
  `run-transcription.handler.ts:369` resolves-then-relativises before writing
  the `.srt`; `lesson-file-locator.ts` passed the stored value raw, so
  `path.resolve` dropped the derived root and the traversal guard refused our
  own file. The locator's specs used a relative fixture, so the suite never
  saw it.
- Sub-steps:
  - [x] failing test: absolute `videoPath` resolves to the written path
  - [x] test that the guard still refuses an absolute path outside the root
  - [x] normalise in `locateGeneratedSubtitle`, mirroring the writer
  - [x] gates: backend unit tests, typecheck, lint
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
