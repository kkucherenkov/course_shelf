# Active tasks

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
