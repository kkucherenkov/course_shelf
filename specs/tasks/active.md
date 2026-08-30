# Active tasks

## T-2026-08-30-005 — backend: error mapping + subtitle track identity/label

- Created: 2026-08-30
- Owner: claude (lane L4, worktree `agent-a144a2781c8088411`)
- Branch: `kkucherenkov/backend-error-and-subtitle-fixes`
- Cards: none — three defects found outside a roadmap card (GitHub #289, #291, #286)
- Goal: unknown routes answer 404/405 as problem+json; one subtitle track per
  language, labelled with the language rather than the video file name.
- Spec diff: none — `SubtitleDto.label` already documents `"English"`, and
  `/api/v1/stream/lessons/{id}/subtitles/{language}` keeps its shape.
- Codegen impact: no
- Sub-steps:
  - [ ] `HttpExceptionFilter`: map any error carrying a numeric HTTP status
        (express-openapi-validator `HttpError`) to problem+json; keep `Allow`
        on 405 (#289)
  - [ ] unit spec covering 404 (unknown route) and 405 (disallowed method)
  - [ ] scan collapses several files of one language into a single subtitle
        row, `.vtt` preferred over `.srt` (#291)
  - [ ] `Subtitle.label` derived from the language code via `Intl.DisplayNames`
        instead of the video basename (#286)
  - [ ] gates: lint --fix, typecheck, test, format
- Status: in-progress
- Blockers: —
