# Active tasks

## T-2026-08-31-003 — mobile: Android emulator in CI + integration tests for offline playback, sync and the download queue

- Created: 2026-08-31
- Owner: claude (lane L3)
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
- Status: in-review
- Blockers: — (no emulator on the dev host; CI is the first execution)

## T-2026-08-31-004 — backfill GitHub issue mirroring for E00–E14 / E21–E24

- Created: 2026-08-31
- Owner: claude
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
- Status: in-review
- Blockers: —

## T-2026-08-31-002 — override props for the hard-coded `@app/ui` strings (web half)

- Created: 2026-08-31
- Owner: claude (frontend-engineer, lane L2)
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
- Status: in-review
- Blockers: —

## T-2026-08-31-001 — distinguish the two unique constraints behind P2002 in PrismaCourseRepository.save

- Created: 2026-08-31
- Owner: claude
- Spec: [GH #326](https://github.com/kkucherenkov/course_shelf/issues/326)
- Goal: a section position collision surfaces as its own 409 instead of masquerading
  as a slug clash, which `run-scan.handler` skips silently.
- Spec diff: none
- Codegen impact: no
- Sub-steps:
  - [x] match `P2002.meta.target` against the two constraints the save tx writes under
  - [x] rethrow unrecognised P2002 unchanged
  - [x] cover all three branches in `prisma-course.repository.spec.ts`
- Status: in-review
- Blockers: —
