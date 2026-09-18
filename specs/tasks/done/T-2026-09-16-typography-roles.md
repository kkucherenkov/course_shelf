## T-2026-09-16-typography-roles — raise text roles one step (#658)

- Created: 2026-09-16
- Status: done
- Completed: 2026-09-16
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
  82 files, `apps/web/app` + `packages/ui/src`. 111 declarations changed
  across 4 PRs — the remaining ~171 stayed put by role (form-control chrome,
  dense admin rows/tables, byline/subtitle text, reference-page specimens).
- Codegen impact: no (design tokens only, no new scale steps)
- Result:
  - T1 — `packages/ui/src/components/*` primitives (37 decls, 21 files):
    https://github.com/kkucherenkov/course_shelf/pull/685
  - T2 — reader surfaces: lesson-player, course-detail, home, search
    (26 decls, 9 files): https://github.com/kkucherenkov/course_shelf/pull/687
  - T3 — admin surfaces (11 decls, 4 pages; dense row/table components left
    untouched): https://github.com/kkucherenkov/course_shelf/pull/688
  - T4 — remaining pages: auth, settings, course-edit, dev/foundations
    (15 decls, 7 files), closes #658:
    https://github.com/kkucherenkov/course_shelf/pull/689
- All four PRs green (lint/typecheck/test/CI/CodeQL/Storybook+e2e visual
  regression) and live docker-verified surface by surface, per the issue's
  explicit instruction to go by surface rather than by grep. `mergeable`
  shows CONFLICTING between the four branches on `specs/tasks/active.md` /
  `done.md` only (each branched from `main` independently) — resolve as a
  union on merge, oldest (T1) first.
