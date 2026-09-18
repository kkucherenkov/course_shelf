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
  - [x] fix `apps/web` fallout: `AdminTranscriptionCard.vue`'s
        `Record<TranscriptionStatus, string>` needed the new member — CI's
        `nuxt typecheck` caught it, not `AdminLibraryRow.vue` (that one's
        status prop is `AdminLibraryListItem`'s Scan status, a different type
        that never touches `interrupted` — an earlier note here named the
        wrong file)
  - [x] PR
- Status: done
- Completed: 2026-09-14
- Blockers: —
- Known follow-ups (not in this PR): `Scan` has the identical stale-`running`
  shape; fixing it is out of scope per the lane brief unless it falls out of
  this mechanism for free, which it does not (separate table, separate
  repository) — open a follow-up task instead of widening this PR.
