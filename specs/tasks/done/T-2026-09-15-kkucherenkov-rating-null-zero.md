## T-2026-09-15-kkucherenkov-rating-null-zero — `ratingCount: null` means 0, not 422; fix `updateCourse` description drift

- Created: 2026-09-15
- Completed: 2026-09-15
- Owner: claude
- Spec: `packages/specs/openapi/openapi.yaml` — `UpdateCourseRequest` field
  descriptions + `PATCH /courses/{id}` operation description. Closes #512
  and #493.
- Goal (#512): a lone `null` on `ratingAverage`/`ratingCount`, with its
  sibling carrying a real value, reads as 0 instead of throwing
  `CourseRatingInvalidError` → 422. Both `null` still clears. Maintainer-
  approved rule (2026-09-15): "if at least one of the two fields is
  non-null, the other `null` reads as 0; both `null` is still a clear."
  No new "average without ratings" validation — rejected in favor of the
  shorter rule.
- Goal (#493): `PATCH /courses/{id}`'s operation `description` claims only
  3 of 14 patchable fields exist and that "OpenAPI cannot express
  at-least-one" — both false; `UpdateCourseRequest` already carries
  `minProperties: 1` across all 14 and `express-openapi-validator` enforces
  it pre-handler.
- Design: fix lands in `UpdateCourseMetadataHandler` (not
  `Course.setRating`) — mirrors how the same handler already resolves
  `*Ids` null-semantics (leave/clear/replace) before calling the domain
  setter; `setRating`'s own `number | undefined` contract and its
  provided-XOR-undefined guard are untouched, so a real pairing bug (one
  side truly absent) still throws instead of silently defaulting.
- Sub-steps:
  - [x] handler: null-as-0 branch + updated inline comment
  - [x] `Course.setRating` JSDoc: document the pairing-XOR-throw explicitly
        and point at the handler for the null-to-0 resolution
  - [x] openapi.yaml: `UpdateCourseRequest` pairing paragraph +
        `ratingAverage`/`ratingCount` descriptions; `updateCourse` path
        description rewritten against the real schema
  - [x] `schemathesis.toml` comment/expected-statuses for `updateCourse` —
        verified against a live stack (spun up `cs-rnz` project, seeded,
        minted an admin bearer): `{"language":"0"}` still 422s
        (`course-language-invalid`), `{"ratingAverage":0,"ratingCount":null}`
        now 200s `(0,0)`. Comment narrowed to the one surviving invariant;
        422 stays in `expected-statuses`.
  - [x] unit tests for every row of the truth table — confirmed failing
        (`CourseRatingInvalidError`) against the pre-fix handler, passing
        after
  - [x] `pnpm spec:validate && pnpm spec:bundle && pnpm spec:codegen`
  - [x] lint/format/typecheck/test gates — backend 194 files / 2113 tests
        green, specs lint+typecheck clean
  - [x] PR with `Closes #512` and `Closes #493` —
        [#551](https://github.com/kkucherenkov/course_shelf/pull/551), CI
        green (10/10 checks)
- Result: [#551](https://github.com/kkucherenkov/course_shelf/pull/551)
