# Active tasks

## T-2026-09-17-kkucherenkov-audit-backend — 1.8.0 pre-release audit: backend fixes

- Created: 2026-09-17
- Owner: claude
- Spec: #693, #694, #698, #699
- Goal: fix four defects the 1.8.0 pre-release audit found — instance-wide rate
  limiting (`trust proxy` misconfigured), course-level access grants ignored by
  four read handlers, a missing subtitle file answering 500 instead of the
  documented 404, and a scan with thousands of errors reporting `succeeded`.
- Spec diff: openapi.yaml — new scan status value for #699 (partial success)
- Codegen impact: yes (own commit)
- Sub-steps:
  - [x] #693 — pin the docker network subnet, trust it by CIDR (not a hop
        count — unsafe with :3000 published), fix the two lying comments/text
  - [x] #694 — course grants: make `evaluate()` honour them on every course
        read path, one coherent model
  - [x] #698 — 404 for a missing subtitle file, both `.vtt` and `.srt` forms,
        fixed in `lesson-file-locator.ts`
  - [ ] #699 — spec-first: new scan status for "completed with errors"
- Status: in-progress
- Blockers: —

## T-2026-09-16-typography-roles — raise text roles one step (#658)

- Created: 2026-09-16
- Owner: claude
- Spec: https://github.com/kkucherenkov/course_shelf/issues/658
- Goal: raise the two bottom-heavy text steps (`--text-xs` 78% of usage) by
  exactly one existing scale step per role — no new scale steps, no
  mechanical grep-replace. Course title (`--text-2xl`) stays.
  - body copy: `--text-sm` → `--text-base`
  - lesson row / section heading: `--text-sm` → `--text-md`
  - meta / caption: `--text-xs` → `--text-sm`
  - deliberately dense surfaces (admin tables, tight rows): left alone
- Baseline (re-measured on 6bb6fee5): 282 `font-size: var(--text-*)` decls,
  82 files, `apps/web/app` + `packages/ui/src`.
- Codegen impact: no (design tokens only, no new scale steps)
- Sub-steps:
  - [ ] T1 — `packages/ui/src/components/*` primitives (~80 decls)
  - [ ] T2 — reader surfaces: lesson-player, course-detail, home, search (~50)
  - [ ] T3 — admin surfaces (~70, dense tables stay put)
  - [ ] T4 — remaining pages: auth, settings, libraries, dev (~80), closes #658
- Status: in-progress
- Blockers: —

## T-2026-09-16-kkucherenkov-flashcards-domain — flashcard + SM-2 domain and API

- Created: 2026-09-16
- Owner: claude
- Spec: [docs/roadmap/tasks/E29-F01-S01.md](../../docs/roadmap/tasks/E29-F01-S01.md), [docs/roadmap/tasks/E29-F01-S02.md](../../docs/roadmap/tasks/E29-F01-S02.md)
- Goal: Flashcard aggregate with a pure SM-2 scheduler and review-queue query (S01), then CRUD + due-queue + grade endpoints over it (S02). Issues #232, #233, umbrella #250.
- Spec diff: openapi.yaml — flashcard routes (create/list per lesson, due queue, update, delete, grade)
- Codegen impact: yes
- Sub-steps:
  - [x] Prisma schema + migration for `Flashcard`
  - [x] `ReviewSchedule` pure SM-2 function + table-driven tests
  - [x] `Flashcard` aggregate + repository port + Prisma adapter
  - [x] Migration verified against real Postgres — [PR #684](https://github.com/kkucherenkov/course_shelf/pull/684)
  - [ ] OpenAPI routes + codegen (own commit)
  - [ ] Commands/queries + controller + handler specs
- Status: in-progress
- Blockers: —
