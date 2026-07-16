# Active tasks

## T-2026-07-16-004 — patch CRITICAL websocket-driver advisory (CI security gate)

- Created: 2026-07-16
- Owner: claude
- Goal: CI "Dependency vulnerability scan" failed on `CRITICAL websocket-driver@0.7.4` (GHSA-xv26-6w52-cph6 / CVE-2026-54466 — WebSocket length-header integer-precision parsing flaw, fixed in 0.7.5). Pulled in transitively: `firebase-admin@13.8.0 → @firebase/database → faye-websocket@0.11.4 → websocket-driver`. No direct dep to bump.
- Spec diff: none
- Codegen impact: no
- Sub-steps:
  - [x] traced the chain with `pnpm why`; confirmed patched version 0.7.5 via the advisory (affected `<0.7.5`; faye-websocket requires `>=0.5.1`, so satisfied)
  - [x] added `pnpm.overrides` entry `"websocket-driver": ">=0.7.5"` (open-ended, matching the `shell-quote`/`next` security-remediation idiom); regenerated lockfile — 0.7.5 only, zero 0.7.4
  - [x] reproduced the exact CI scan locally (`ghcr.io/google/osv-scanner:v2.3.8`, same jq gate): CRITICAL/HIGH list empty → gate passes; histogram LOW:7 MODERATE:34 (was CRITICAL:1 MODERATE:35)
  - [x] `pnpm install --frozen-lockfile` in sync
  - [ ] commit + push
- Status: in-progress
- Blockers: —

## T-2026-07-16-003 — de-flake timezone-coupled outbox ordering test (E15-F02-S01)

- Created: 2026-07-16
- Owner: claude
- Spec: [docs/roadmap/tasks/E15-F02-S01.md](../../docs/roadmap/tasks/E15-F02-S01.md)
- Goal: `progress_outbox pending is chronological across mixed local/UTC writes` (added under T-2026-07-16-002 / I1) hard-coded `DateTime(2026,7,15,23)` and a comment asserting "this machine's local zone is UTC+04:00". True on the dev box (+0400), false on CI (`/home/runner`, TZ=UTC), where `earlyLocal` becomes 23:00Z — genuinely _later_ than `laterUtc` 21:00Z — so `pending()` correctly returns `['late','early']` and the assertion fails. A real test defect, not a runtime bug: `_normalizeUtc` is correct and independently proven by the zone-independent `isUtc` test.
- Spec diff: none
- Codegen impact: no
- Sub-steps:
  - [x] reproduced: `TZ=UTC flutter test …` fails `['late','early']`; ambient `+0400` passes
  - [x] derive the local fixture from a fixed instant (`DateTime.utc(2026,7,15,19).toLocal()`) so "early is earlier" holds in any ambient zone, while still exercising the local-write path (`isUtc == false`)
  - [x] rewrote the comment to explain the zone-independence; kept the reversed insertion order that guards `ORDER BY`
  - [x] `flutter analyze` clean; full file green under TZ=UTC, America/New_York (−5), Asia/Dubai (+4)
  - [ ] commit + PR
- Status: in-progress
- Blockers: —
- Notes:
  - Did NOT run `dart format` on the file — local Dart 3.12 tall-style reflowed every `test(...)` callback, but CI pins Flutter 3.44.4 (Dart 3.9, old style) and runs no `dart format` gate. Kept the edit in the committed style; diff is the one comment block + one line.
