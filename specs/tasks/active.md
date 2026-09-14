# Active tasks

## T-2026-09-14-outline-transcript-flag — outline row shows whether a lesson has a transcript

- Created: 2026-09-14
- Owner: claude
- Spec: `packages/specs/openapi/openapi.yaml` — add `hasTranscript: boolean`
  (required) to `LessonOutlineItem`, mirroring the existing `hasMaterials`
  field. Chose a boolean over a language list: the issue only asks for "a
  sign" of presence, `hasMaterials` is the exact existing precedent for this
  DTO, and a boolean sidesteps Lane A's in-flight change to what language a
  generated transcript is filed under (today `und`) — nothing to hard-code.
  Semantics: true when the lesson has a sidecar `Subtitle` row OR a generated
  `Transcript` row in the instance's configured transcription language — the
  same union `GetLessonHandler` already uses to build `LessonDto.subtitles`
  (i.e. exactly the sidebar-tab signal the issue points at).
- Goal: Closes #514 — the course outline gives no sign of which lessons
  already have a transcript.
- Sub-steps:
  - [x] spec: `hasTranscript` on `LessonOutlineItem` + codegen
  - [x] backend: extract `resolveTranscriptionLanguage` helper (dedupe the
        `auto` → `und` fallback, currently only in `get-lesson.handler.ts`)
  - [x] backend: `GetCourseOutlineHandler` batches
        `findGeneratedForLessons` once for the whole course and derives
        `hasTranscript` per row (no per-lesson query)
  - [x] backend unit tests for the new derivation (sidecar-only,
        generated-only, neither, batching)
  - [x] web: `AppLessonRow` gets a `transcript` prop (mirrors `materials`)
        rendering the existing `subtitles` icon; spec + story
  - [x] wire `hasTranscript` in `CourseSectionsList.vue` and
        `PlayerSectionsTab.vue`; i18n keys in `en.ts`/`ru.ts`
  - [x] gates: lint, stylelint, format, test, typecheck, check:i18n
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
