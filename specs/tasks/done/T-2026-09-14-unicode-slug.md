## T-2026-09-14-unicode-slug — a non-Latin course title must not delete the course

- Created: 2026-09-14
- Owner: claude
- Spec: [docs/roadmap/tasks/E32-F01-S05.md](../../docs/roadmap/tasks/E32-F01-S05.md)
  — defect found by diffing the maintainer's disk against his database after a
  clean 1.2.0 import (`tuxedo` 132)
- Goal: a course whose title contains no Latin letters imports under a slug
  derived from that title, and two courses that legitimately want the same
  slug both import with the collision recorded as a `ScanError`.
- Spec diff: `openapi.yaml` — `CourseSlug.pattern`, `EntitySlug.pattern`, and
  the `displayName.pattern` of the three upsert requests
- Codegen impact: yes (doc comments only; no type change)
- Sub-steps:
  - [x] verify how `express-openapi-validator`'s ajv compiles `\p{L}` in a
        JSON Schema `pattern` (the `u` flag is not guaranteed) — ajv 8.18.0,
        `unicodeRegExp` defaults to true, so `\p{…}` goes in the spec as-is
  - [x] widen the slug charset to Unicode letters/digits/marks in
        `openapi.yaml`, `course/slug.ts`, `shared-vo/entity-slug.ts`
  - [x] NFC-normalise before slugging so two encodings of one title collide
        on the `@@unique([libraryId, slug])` constraint
  - [x] `toSlug` in `run-scan.handler.ts` delegates to `slugify` — one
        algorithm, two empty-input behaviours
  - [x] widen the three `displayName` patterns the old charset had constrained,
        without which a Cyrillic instructor is still rejected by the validator
  - [x] a slug collision gets a deterministic folder-derived discriminator
        and a `ScanError` instead of a silent `continue`
  - [x] tests, including one that reads the pattern out of `openapi.yaml`
  - [x] regen clients
- Status: done
- Blockers: —
- Completed: 2026-09-14
- Result: [PR #473](https://github.com/kkucherenkov/course_shelf/pull/473) ·
  [issue #472](https://github.com/kkucherenkov/course_shelf/issues/472)
