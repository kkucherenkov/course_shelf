# Security, observability, accessibility, performance

## Security

- **Secrets never in VCS.** `.env.example` ships with placeholders; real secrets in `.env` (gitignored) or secret manager. Flag any hardcoded secret immediately.
- **Defense in depth** — already wired: `helmet()`, `@nestjs/throttler` (60 req/min global, tighten per auth route), `ValidationPipe({ whitelist, forbidNonWhitelisted })` + `express-openapi-validator`. Never disable these.
- **Auth boundaries.** Every route touching user data requires `@UseGuards(BetterAuthGuard)` unless explicitly public — confirm with a test.
- **CORS.** Origins from `CORS_ORIGINS` env via `AppConfig`. Never `origin: true` or `*` with `credentials: true`.
- **No `eval` / `new Function` / dangerous template interpolation.**
- **OWASP top 10** review checklist: injection, broken auth, sensitive data exposure, XXE, broken access control, misconfiguration, XSS, insecure deserialisation, vulnerable deps, insufficient logging.

### CI security gates

- `pnpm audit --audit-level=high` — blocks on high/critical CVEs.
- TruffleHog secret scanning — `--only-verified` on branch diff.
- License check — allow only `MIT;ISC;Apache-2.0;BSD-2-Clause;BSD-3-Clause;0BSD;CC0-1.0;Unlicense`.

## Observability

- **Logging.** `Logger` in Nest, structured Pino on web, `developer.log` on Flutter. Never `console.log` / `print()`.
- **Request correlation.** Every HTTP request gets `x-request-id` from `RequestIdMiddleware` — log it on every line.
- **Never log PII** — emails, phones, addresses, tokens, passwords, full names. Log stable user IDs only. Scrub third-party payloads before logging.
- **Error visibility.** 5xx responses logged with stack trace by `HttpExceptionFilter`. 4xx are noise — don't log by default.
- **Metrics & tracing.** None ship today — OpenTelemetry was removed on
  2026-09-18 as unused. If it comes back, wire it through the SDK rather than
  hand-rolling counters.

## Accessibility (web)

- Every interactive element has a label. Icon-only buttons need `aria-label` via prop.
- Focus order follows reading order. No trapped focus outside modals.
- `:focus-visible` must be styled — never `outline: none`.
- Keyboard: every mouse interaction has a keyboard equivalent (Enter/Space on custom controls).
- Contrast ≥ AA (4.5:1 text, 3:1 large / non-text). Don't rely on colour alone.
- Storybook stories: `@storybook/addon-a11y` panel — stories with violations don't merge.

## Performance

- **Bundle budget (web).** Initial chunk ≤ 250 KB gzip. Route chunks ≤ 150 KB gzip. `pnpm bundle-budget` runs in CI after build.
- **LCP target** ≤ 2.5s on mid-range mobile, cold cache. Pages that fetch on mount show a skeleton.
- **Prisma.** Anti-N+1 rules in `handbook.md`. Every list endpoint supports pagination.
- **Flutter.** Prefer `const` constructors. Use `ListView.builder` for lists >20 items. Avoid rebuilding above the changing widget.
