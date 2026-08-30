# Active tasks

Four v2 lanes run in parallel, one Orca worktree each. This file is owned by
the coordinator for the duration of the run — the lane workers do not edit it,
because four LIFO pushes to the same file is a guaranteed conflict. Each worker
keeps its own card under `docs/roadmap/tasks/` and its row in
`docs/roadmap/TODO.md` current instead.

Depth is four rather than the usual three on purpose: the lanes touch disjoint
surfaces (specs+prisma, web player, web settings, Flutter) and were started
together.

## T-2026-08-30-004 — E31-F01-S03 fix the duplicated offline bookmark

- Created: 2026-08-30
- Owner: claude (lane L5, worktree `e31-offline-bookmark`)
- Spec: [E31-F01-S03](../../docs/roadmap/tasks/E31-F01-S03.md) · GitHub #241
- Goal: a bookmark created offline stops appearing twice after the outbox drains.
- Spec diff: none
- Codegen impact: no
- Sub-steps:
  - [ ] Drift schema migration for the local→server id map
  - [ ] Write the mapping on outbox settlement
  - [ ] Reconcile on fetch
  - [ ] Remove the Known-limits row from `docs/user-guide.md`
- Status: in-progress
- Blockers: —

## T-2026-08-30-003 — E31-F02-S01/S02 withdraw the promises

- Created: 2026-08-30
- Owner: claude (lane L4, worktree `e31-withdraw-promises`)
- Spec: [E31-F02-S01](../../docs/roadmap/tasks/E31-F02-S01.md), [E31-F02-S02](../../docs/roadmap/tasks/E31-F02-S02.md) · GitHub #242, #243
- Goal: remove the dead SSO path and the three non-functional Settings controls, and the doc claims behind both.
- Spec diff: conditional — `ssoProviders` leaves the instance-config contract only if nothing reads it
- Codegen impact: conditional
- Sub-steps:
  - [ ] Trace every `ssoProviders` reader, remove the dead path
  - [ ] Remove avatar upload / email change / account deletion from Settings
  - [ ] Update the Settings page spec to assert absence
  - [ ] Remove both Known-limits rows
- Status: in-progress
- Blockers: —
- Note: tuxedo 11 asked for the opposite (wire `AppSsoBlock` up). The card wins; tuxedo 11 is closed against it.

## T-2026-08-30-002 — E26-F01-S01 render the subtitle tracks in the web player

- Created: 2026-08-30
- Owner: claude (lane L3, worktree `e26-subtitle-tracks`)
- Spec: [E26-F01-S01](../../docs/roadmap/tasks/E26-F01-S01.md) · GitHub #223
- Goal: subtitles have never worked on the web — the page renders no `<track>`. Wire the tracks the backend has served since E08.
- Spec diff: none
- Codegen impact: no
- Sub-steps:
  - [ ] `buildSubtitleUrl` + unit spec
  - [ ] `<track>` per `LessonDto.subtitles[]`, locale-matching `default`
  - [ ] Manual verification against the running stack
- Status: in-progress
- Blockers: —

## T-2026-08-30-001 — E25-F03-S01/F02-S01 transcription contract and schema

- Created: 2026-08-30
- Owner: claude (lane L1, worktree `e25-contract-schema`)
- Spec: [E25-F03-S01](../../docs/roadmap/tasks/E25-F03-S01.md), [E25-F02-S01](../../docs/roadmap/tasks/E25-F02-S01.md) · GitHub #217, #214
- Goal: the contract and the Prisma models every other E25 story is blocked on. Contract only — no handlers, no whisper adapter.
- Spec diff: openapi.yaml — 5 transcription routes, 5 schemas, `SubtitleDto.generated`
- Codegen impact: yes
- Sub-steps:
  - [ ] Schemas and paths in `openapi.yaml`
  - [ ] `spec:validate && spec:bundle && spec:codegen`, artefacts in their own commit
  - [ ] Prisma models and enums, migration SQL reviewed for an accidental FK
  - [ ] `typecheck` green
- Status: in-progress
- Blockers: —
