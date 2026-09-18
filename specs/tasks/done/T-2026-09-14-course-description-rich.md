## T-2026-09-14-course-description-rich — a course description cannot hold real detail

- Created: 2026-09-14
- Owner: claude
- Spec: none — `#517`, measured against Stepik course 181875 (description
  2044 + acquired_skills 1734 + target_audience 339 + requirements 69 +
  workload 17 = 4203 chars, over the 4000 wire cap; an ordinary paid course
  page, not an outlier)
- Goal: `CourseDto.description` / `UpdateCourseRequest.description` fit a real
  course page, and `CourseHero` no longer collapses a multi-paragraph
  description (with a 29-bullet "what you'll learn" list) into one unbroken
  block.
- Spec diff: openapi.yaml — `maxLength` 4000 → 8000 on both schemas
- Codegen impact: none (maxLength isn't encoded in the generated TS types;
  ran `spec:bundle`/`spec:codegen` anyway — no diff)
- Sub-steps:
  - [x] raise the wire cap, justify the number in a spec comment
  - [x] `description-lead.ts` — the one rule for where the hero's lead ends
  - [x] `CourseHero` shows the capped lead only
  - [x] `CourseDescription` — full text below the fold, `white-space: pre-line`
        (no markdown renderer/sanitiser — see PR body for why)
  - [x] i18n keys (en/ru), tests, gates
- Status: done
- Completed: 2026-09-14
- Result: https://github.com/kkucherenkov/course_shelf/pull/527
