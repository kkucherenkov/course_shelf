# Active tasks

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
  - [x] T1 — `packages/ui/src/components/*` primitives (37 decls, 21 files) —
        PR #685, green, awaiting review/merge
  - [ ] T2 — reader surfaces: lesson-player, course-detail, home, search (~50)
  - [ ] T3 — admin surfaces (~70, dense tables stay put)
  - [ ] T4 — remaining pages: auth, settings, libraries, dev (~80), closes #658
- Status: in-progress
- Blockers: T2-T4 branched from `main` pre-T1 merge — reader components
  consumed here (AppLessonRow, AppSectionHeader, CourseCard) render at their
  OLD sizes until PR #685 lands; re-verify visually once it merges.
