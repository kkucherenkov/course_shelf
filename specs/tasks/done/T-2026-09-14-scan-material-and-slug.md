## T-2026-09-14-scan-material-and-slug — course material is not a scan error, slug is not the folder's identity

- Created: 2026-09-14
- Owner: claude
- Spec: none — two defects in `run-scan.handler.ts` found on the
  maintainer's live library after PR #519 (#523, tuxedo 153) and reported by
  the scoped-rescan lane (#504, tuxedo 125)
- Goal: a course folder's non-video files (slides, archives, sample code) no
  longer become a `ScanError` just for having no sibling video; a
  library-wide scan recognises an already-imported folder by the folder
  itself, not by a slug an operator may have edited through the API.
- Acceptance:
  - a course folder holding slides, an archive and source code alongside its
    videos produces zero `ScanError`s for them
  - `ffmpeg-probe-failed` and its kin still fire — genuine failures are
    unaffected
  - a second library-wide scan after the course's slug was edited through the
    API leaves one course, not two, and does not duplicate its lessons
- Spec diff: none — no wire shape changed
- Codegen impact: no
- Sub-steps:
  - [x] #523 — video-less stem group silently skipped, not `unsupported-extension`
  - [x] #504 — library-wide "already imported" check matched on the folder
        (from an existing lesson's `videoPath`), not on the derived slug
  - [x] unit tests: video-less junk (zero errors), slug-edited-then-rescanned
        (one course, same lesson id)
  - [x] updated pre-existing tests whose fixture asserted the old
        `unsupported-extension` behaviour for `broken.txt`
  - [x] gates: lint --fix, format, test, typecheck all green
- Status: done
- Blockers: —
- Completed: 2026-09-14
- Result: [PR #526](https://github.com/kkucherenkov/course_shelf/pull/526)
