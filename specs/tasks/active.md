# Active tasks

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
- Status: in-progress (awaiting PR merge)
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
