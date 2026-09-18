## T-2026-09-18-feat-card-progress-ring — course cards use AppProgressBadge instead of hand-rolled progress affordances

- Created: 2026-09-18
- Owner: claude
- Goal: `CoursePosterCard` and `CourseWideCard` stop hand-rolling a hairline
  strip, a completed badge, and a locked scrim; they consume
  `AppProgressBadge` (`variant="ring"`), which already computes state from
  `completed`/`total`. Completed → 28px circle with a check; in-progress →
  32px ring with the percent; 0% → nothing, by construction (badge only
  renders when `pct > 0`); locked → scrim over the whole cover, corner stays
  empty because `useCourseProgress` forces `pct` to 0 for `locked`, not
  because of a per-state template branch.
- Spec diff: none (packages/ui only)
- Codegen impact: no
- Sub-steps:
  - [x] `AppProgressBadge` ring: 28px size for `completed` (was fixed 32px)
  - [x] `CoursePosterCard`: replace badge/strip with `AppProgressBadge`
  - [x] `CourseWideCard`: replace strip with `AppProgressBadge` + add locked scrim
  - [x] update colocated specs for both cards
  - [x] regenerate Storybook visual baselines via CI workflow (they move)
  - [x] open PR, `Closes #675`
- Status: done
- Blockers: —
- Completed: 2026-09-18
- Result: https://github.com/kkucherenkov/course_shelf/pull/716
