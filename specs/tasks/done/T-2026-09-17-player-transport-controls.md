## T-2026-09-17-player-transport-controls — familiar transport controls and a readable transcript

- Created: 2026-09-17
- Owner: claude
- Spec: [docs/superpowers/plans/2026-09-17-player-transport-and-transcript.md](../../docs/superpowers/plans/2026-09-17-player-transport-and-transcript.md)
- Goal: the lesson player behaves like a video player people have used before,
  and the transcript gets the width it needs to be read.
- Spec diff: none
- Codegen impact: no
- Sub-steps:
  - [x] raise the page-spec timeout so a loaded runner stops reporting false reds (tuxedo 231)
  - [x] add 15s skip buttons and a play target over the picture (tuxedo 222)
  - [x] show the subtitles and fullscreen toggles as pressed (tuxedo 223)
  - [x] replace the speed cycle with a menu (tuxedo 224)
  - [x] move the transcript below the video at full column width (tuxedo 216)
- Status: done
- Blockers: —
- Completed: 2026-09-17
- Result: https://github.com/kkucherenkov/course_shelf/pull/707
