# T-2026-09-22-stream-throttle-budget

- Created: 2026-09-22
- Owner: claude
- Spec: none — found by the second pre-release audit pass, filed as #792
- Goal: watching a lesson stops consuming the budget that serves the catalogue.
- Context: `streaming.controller.ts` carries no `@SkipThrottle`, so every
  byte-range request for video, every subtitle track and every material
  download counts against the global `default` budget of 60 requests / 60 s.
  Measured by the auditor: 429 on the 61st request with `Retry-After: 53`;
  the home page costs 11 requests, a lesson page 11 + 2, and each video seek
  one more — so roughly six navigations a minute exhaust it, after which the
  catalogue of 68 courses disappears entirely. Observed live.
- Why it is the same defect as #777: there, `sign-in` (a brute-force surface
  that deserves a tight budget) shared a bucket with `get-session` (something
  the browser does on every cold load). Here the catalogue shares a bucket
  with byte-range streaming, which is many requests per single view by
  construction. A limit is right; a _shared_ limit is not.
- Pre-existing: `streaming.controller.ts` last changed 2026-08-30, so 1.8.4
  ships this too. Not a 1.9.0 regression.
- Fix: a named throttler for `/api/v1/stream/*` with its own config-driven
  budget, following `realtime-throttle.ts` and `auth-throttle.ts` exactly —
  `skipIf` scopes it to those paths, and the controller carries
  `@SkipThrottle({ default: true })` so the two budgets do not stack.
- Spec diff: none — rate limiting, not the contract's shape
- Codegen impact: no
- Design impact: none
- Tests: predicate unit tests (stream paths in, everything else out) and a
  config test for the new defaults.
- Sub-steps:
  - [x] `stream-throttle.ts` with the predicate, mirroring auth-throttle.ts
  - [x] `AppConfig.rateLimit` gains the stream budget + `.env.example`
  - [x] Register in `app.module.ts`, `@SkipThrottle({ default: true })` — on the
        three stream **methods**, not the class: `StreamingController` is
        `@Controller({ path: '' })` and also serves `lessons/:id/stream-url`
        and `.../download-url`, which are ordinary JSON and must keep the
        global budget. A class-level decorator would have un-throttled those
        two silently.
  - [x] Specs — `stream-throttle.spec.ts`, 10 cases, including both `*-url`
        routes asserted NOT to match
  - [x] `pnpm --filter @app/backend test` — 2453 passed, 235 files; typecheck
        and lint clean
  - [ ] PR with `Closes #792`, wait for the five required contexts by name
- Status: in-progress
- Blockers: —
