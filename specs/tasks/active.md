# Active tasks

## T-2026-09-14-transcription-recovery — stale `running` recovery + real detected language

- Created: 2026-09-14
- Owner: claude
- Spec diff: `packages/specs/openapi/openapi.yaml` — `TranscriptionStatus` gains
  `interrupted`. Nothing else in the contract changes.
- Codegen impact: yes (enum member only)
- Goal: Closes #525 (a killed transcription run stays `running` forever and
  blocks every future run) and #501 (every generated transcript is filed as
  `und` instead of the language whisper actually detected).
- Design:
  - #525: `AppConfig.bootId` — a random id generated once per process start
    (not env-derived, so it lives on `AppConfig` as a computed field rather
    than a new provider). Stamped on `Transcription.start()`. At boot,
    `TranscriptionRecoveryService` (`OnApplicationBootstrap`) finds every
    `status: running` row whose `bootId` differs from the current process's
    — which is every row from before this boot, by construction — and
    transitions each to a new terminal status `interrupted` via
    `Transcription.interrupt()`. Chose boot id over a heartbeat: no staleness
    window to guess: it is a single equality check, decidable rather than
    guessed. Per-lesson `Transcript` rows are untouched; the skip rule makes
    a plain re-run cheap, so no separate "resume" endpoint.
  - #501: `LocalWhisperAdapter` parses whisper's
    `auto-detected language: <tag>` line from stdout+stderr when invoked with
    `-l auto`; a new pure fn `resolveDetectedLanguage` constrains the result
    to `en`/`ru`, else falls back to the deployment's configured language.
    The walk determines each lesson's final language AFTER whisper returns
    (detection happens inside whisper.cpp, per file) — the working `.srt` is
    written to a placeholder bucket first, then renamed to match the final
    language, because `LessonFileLocator.locateGeneratedSubtitle` recomputes
    the file path from the DB's `language` column and trusts no stored path.
    The pre-run "does a current transcript already exist" lookup gains an
    any-language variant (`findAnyGeneratedForLessons`) for auto-mode runs,
    since the run no longer knows the language up front — needed so a
    resumed auto run still skips what it already transcribed.
    `GetLessonHandler`'s generated-track union switches from guessing the
    language off `AppConfig` to reading the real persisted value.
- Sub-steps:
  - [x] plan
  - [x] prisma schema: `TranscriptionStatus.interrupted`, `Transcription.bootId`
  - [x] domain: `Transcription.interrupt()`, `resolveDetectedLanguage`
  - [x] ports: `TranscriptionRepository.findStaleRunning`,
        `TranscriptRepository.findAnyGeneratedForLessons`
  - [x] infra: Prisma adapters, `LocalWhisperAdapter` stdout parsing
  - [x] application: `TranscriptionRecoveryService`, walk changes,
        `GetLessonHandler` read-path
  - [x] `AppConfig.bootId`
  - [x] openapi + codegen
  - [x] unit tests (all touched handlers/adapters/domain fns)
  - [x] integration test proving `findStaleRunning` selects a row a previous
        boot left behind, against a real Postgres, self-skipping if none is
        reachable (mirrors `local-ffmpeg.adapter.integration.spec.ts`)
  - [x] docs/architecture.md §8 data model paragraph
  - [x] lint/format/typecheck/test gates
  - [x] PR
- Status: in-progress
- Blockers: —
- Known follow-ups (not in this PR): `apps/web/app/components/admin/AdminLibraryRow.vue:50`
  hand-rolls the status union and will not know about `interrupted` — a
  frontend-lane task. `Scan` has the identical stale-`running` shape; fixing
  it is out of scope per the lane brief unless it falls out of this mechanism
  for free, which it does not (separate table, separate repository) — open a
  follow-up task instead of widening this PR.

## T-2026-09-14-document-union-merge — the working agreement names only half the union-merged files

- Created: 2026-09-14
- Owner: claude
- Spec: none — `#522`, found by hitting the same conflict three times in one
  wave of parallel lanes
- Goal: `.claude/CLAUDE.md` says `done.md` is union-merged like `active.md`,
  states the resolution, and says which neighbouring file is NOT in that
  category.
- Sub-steps:
  - [x] name both files, state the resolution (keep both sides, newest first)
  - [x] warn that every conflict region must be resolved, not only the first
  - [x] rule `docs/roadmap/TODO.md` out, with the reason
- Status: in-progress
- Blockers: —

## T-2026-09-14-stepik-scraper — a Stepik course fills itself from the open catalog API

- Created: 2026-09-14
- Owner: claude
- Spec: none — measured live against `stepik.org/api/courses/181875`; nothing
  about the wire contract changes
- Goal: a `stepik.org/course/{id}` URL fills the metadata editor from Stepik's
  own keyless API instead of recovering one field through the json-ld
  fallback.
- Sub-steps:
  - [x] `StepikScraper` + recorded fixtures
  - [x] registry wiring (unconditional — no key, like Coursera)
  - [x] tests
  - [x] card `E30-F02-S02`, `TODO.md` row, `docs/user-guide.md`

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
