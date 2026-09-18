## T-2026-09-14-scan-name-parsing — fix three filename-parsing gaps, surface the silent fallback

- Created: 2026-09-14
- Owner: claude
- Spec: none — bugs found by running the parser against the maintainer's live library (issues #499, #498, #503)
- Goal: `folder-name.parser.ts` and `stem-match.ts` stop silently mis-reading
  three real filename shapes, and a course whose lesson order fell back to
  walk order becomes findable by query instead of invisible.
- Sub-steps:
  - [x] #499 — marker-introduced ordinal (`Лекция #9`) recognised
  - [x] #498 — calendar-date basename keeps its year, no bogus ordinal
  - [x] #503 — subtitle language suffix validated against a real language set
  - [x] course-level `course-order-unreliable` ScanError when a lesson falls
        back to no ordinal
  - [x] unit tests for all four
  - [x] lint/format/test/typecheck green
- Status: done
- Completed: 2026-09-14
- Result: https://github.com/kkucherenkov/course_shelf/pull/520
