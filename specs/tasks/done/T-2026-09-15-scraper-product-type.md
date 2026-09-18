## T-2026-09-15-scraper-product-type — JSON-LD extractor drops the whole block for `Product`-typed pages

- Created: 2026-09-15
- Completed: 2026-09-15
- Owner: claude
- Spec: none — `ScrapedCourseFragment` is internal, no wire contract change. Closes #505.
- Goal: `HtmlMetadataExtractor.fromJsonLd` accepts `Product` alongside `Course`/
  `VideoObject` (Stepik types its course JSON-LD as `Product`, carrying
  `name`/`description`/`image`/`aggregateRating` that were previously
  discarded entirely), and the array form of `@type` checks membership
  against the same accepted-type list as the scalar form (a `["VideoObject",
"Thing"]` array was rejected while scalar `"VideoObject"` passed — same
  root cause, one list instead of three ad-hoc comparisons).
- `aggregateRating` (`ratingValue`/`ratingCount`) mapping already existed and
  needed no change — confirmed by reading `fromJsonLd` end to end before
  editing.
- Sub-steps:
  - [x] plan
  - [x] failing tests first (Product w/ 5 fields, array-form VideoObject,
        array-form Product, Course-scalar regression)
  - [x] unify accepted-type check via existing `asArray` helper
  - [x] lint/format/typecheck/test gates
  - [x] open PR with `Closes #505` —
        [#549](https://github.com/kkucherenkov/course_shelf/pull/549)
- Result: [#549](https://github.com/kkucherenkov/course_shelf/pull/549), CI green
