# Active tasks

## T-2026-08-30-001 — E25-F04-S02 transcription card in admin library screen

- Created: 2026-08-30
- Owner: claude (frontend-engineer, lane L3)
- Spec: [docs/roadmap/tasks/E25-F04-S02.md](../../docs/roadmap/tasks/E25-F04-S02.md)
- Goal: idle/running/terminal transcription card on `admin/libraries/[id].vue` — Start
  (with force checkbox), Cancel, live counters + error list over the Centrifugo channel
  the scan card already subscribes to.
- Spec diff: none — `@app/api-client-ts` already has the three transcription routes.
- Codegen impact: no
- Sub-steps:
  - [ ] `AdminTranscriptionCard.vue` + spec
  - [ ] `useTranscriptionProgress` composable (new file) + spec
  - [ ] Page wiring on `admin/libraries/[id].vue`
  - [ ] Locale keys (`admin.transcription.*`) in `en` and `ru`
- Status: in-progress
- Blockers: —
