# Active tasks

## T-2026-04-27-031 — Rate limit on Better Auth sign-in (E21-F02-S01)

- Created: 2026-04-27
- Owner: claude
- Spec: `docs/roadmap/tasks/E21-F02-S01.md`. PRD NFR-S-03 caps sign-in attempts at 5 per 15 min per IP. Currently `AuthController` carries a class-level `@Throttle({ default: { limit: 10, ttl: 60_000 } })` covering **every** `/api/v1/auth/*` route — too generous on the brute-force surface (sign-in) and ignores routine session-refresh entirely.
- Goal: a dedicated rate-limit gate on sign-in attempts only. 5/15min per-IP. 6th attempt → `429` with `Retry-After`. Other Better Auth routes (sign-up, get-session, sign-out, refresh) keep the existing 10/60s class-level throttle.
- Acceptance:
  - New `SignInRateLimitMiddleware` (Nest middleware) mounted on `POST /api/v1/auth/sign-in*` (Better Auth uses path patterns like `/sign-in/email`, `/sign-in/phone-number`, etc.).
  - In-memory token-bucket keyed by client IP; window is rolling 15 minutes; cap is 5 attempts.
  - 6th request inside the window: respond `429 Too Many Requests` with `Retry-After: <seconds>` header where seconds is the time until the oldest attempt in the window expires. Body: RFC 9457 problem JSON.
  - IPv4 and IPv6 both work — the bucket key is `req.ip`, which Express resolves correctly when `trust proxy` is set (already configured to `'loopback'` in `main.ts`).
  - Successful sign-in still counts toward the cap (a successful login is also a successful brute-force probe — counting only failures would let an attacker pre-test against known good accounts to dodge the limit). Documented in code.
  - Bucket cleanup: on each request, prune expired entries from that IP's bucket before deciding allow/block.
- Spec diff: none.
- Codegen impact: no.
- Design impact: none.
- Tests:
  - Under cap: 5 sequential calls all `next()`.
  - At cap: 6th call rejects with 429 + `Retry-After`.
  - Different IPs counted independently.
  - After window expires (advance fake timers 15+ min), cap resets.
  - `Retry-After` value matches the time until the oldest in-window attempt expires.
- Sub-steps:
  - [ ] T-031-A: middleware + in-memory bucket store + tests
  - [ ] T-031-B: wire via `MiddlewareConsumer` in `AuthModule.configure`
  - [ ] T-031-C: lint, typecheck, test, prettier; flip card; archive T-031
- Status: in-progress
- Blockers: —
