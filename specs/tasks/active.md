# Active tasks

## T-2026-09-14-transcription-state-ui — fix transcription realtime state

- Created: 2026-09-14
- Owner: claude
- Spec: `packages/specs/asyncapi/centrifugo.yaml` — `scans:user:{userId}`
  now documents `transcription-started` / `-progress` / `-finished`
- Goal: a running transcription no longer renders as a finished scan, the
  contract documents every kind the backend actually publishes on
  `scans:user:{userId}`, and the transcription panel survives a failed
  initial fetch without a page reload.
- Issues: #508, #516, #511 (`tuxedo` 135, 148, 134)
- Sub-steps:
  - [x] document `transcription-*` events + `scopeCourseId`/`scopeCourseName`
        in `centrifugo.yaml`; `spec:validate && spec:bundle && spec:codegen`
  - [ ] `scanLifecycle` store ignores kinds it does not own (runtime guard,
        not compile-time narrowing); audit other channel subscribers
  - [ ] `useTranscriptionProgress` polls every 2s while running and retries
        on a failed fetch, mirroring `useLatestScan`
  - [ ] tests for both fixes; gates; PR
- Status: in-progress
- Blockers: —

## T-2026-09-14-fix-centrifugo-namespaces — declare the namespaces the contract uses

- Created: 2026-09-14
- Owner: claude
- Spec: none — the AsyncAPI contract was already correct; found while
  debugging a live NAS deployment whose scan progress never moved
- Goal: every Centrifugo namespace used by a channel in
  `packages/specs/asyncapi/centrifugo.yaml` must be declared in every
  Centrifugo configuration, and stay that way.
- Sub-steps:
  - [x] add `scans` and `maintenance` to dev, prod and release configs
  - [x] `scripts/check-realtime-namespaces.ts` deriving the required set from
        the contract
  - [x] wire it as `pnpm check:realtime` and a CI step
- Status: in-progress
- Blockers: —
