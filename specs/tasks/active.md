# Active tasks

## T-2026-08-30-001 — B4 whisper transcription

- Created: 2026-08-30
- Owner: claude
- Spec: [docs/superpowers/specs/2026-08-29-b4-transcription-design.md](../../docs/superpowers/specs/2026-08-29-b4-transcription-design.md)
- Plan: [docs/superpowers/plans/2026-08-29-b4-transcription.md](../../docs/superpowers/plans/2026-08-29-b4-transcription.md)
- Goal: transcribe a library with whisper.cpp as a resumable, skipping run; serve results as subtitle tracks.
- Spec diff: openapi.yaml — 5 transcription routes, `SubtitleDto.generated`
- Codegen impact: yes
- Sub-steps:
  - [ ] 1. config + derived volume + whisper binary in the image
  - [ ] 2. derived path resolver
  - [ ] 3. ffmpeg audio extraction
  - [ ] 4. whisper adapter
  - [ ] 5. schema + migration
  - [ ] 6. Transcription aggregate
  - [ ] 7. skip rule
  - [ ] 8. OpenAPI + codegen
  - [ ] 9. run handler + controller + wiring
  - [ ] 10. subtitle route serves generated tracks
  - [ ] 11. scan: thumbnails to derived volume + orphan cleanup
  - [ ] 12. admin card
  - [ ] 13. docs
- Status: in-progress
- Blockers: —
