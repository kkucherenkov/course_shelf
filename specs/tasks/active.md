# Active tasks

## T-2026-08-30-001 — E25 transcription domain + ffmpeg audio extraction

- Created: 2026-08-30
- Owner: claude
- Cards: [E25-F02-S02](../../docs/roadmap/tasks/E25-F02-S02.md) (#215),
  [E25-F02-S03](../../docs/roadmap/tasks/E25-F02-S03.md) (#216),
  [E25-F01-S03](../../docs/roadmap/tasks/E25-F01-S03.md) (#212)
- Spec: [B4 transcription design](../../docs/superpowers/specs/2026-08-29-b4-transcription-design.md) §5, §6
- Goal: the pure pieces the transcription run is built from — the run aggregate,
  the skip rule that makes a re-run cheap, and the whisper-shaped audio extraction
  on the existing ffmpeg port.
- Spec diff: none (routes already landed in E25-F03-S01)
- Codegen impact: no
- Sub-steps:
  - [ ] `transcription.errors.ts` — the two errors these three cards need
  - [ ] `transcription.ts` aggregate + spec (E25-F02-S02)
  - [ ] `skip-rule.ts` + table-driven spec (E25-F02-S03)
  - [ ] `AudioExtractRequest` + `extractAudio` on `FfmpegAdapter`, implementation
        and spec in `LocalFfmpegAdapter` (E25-F01-S03)
  - [ ] gates: lint / typecheck / test / format
  - [ ] card bookkeeping + PR
- Status: in-progress
- Blockers: —
