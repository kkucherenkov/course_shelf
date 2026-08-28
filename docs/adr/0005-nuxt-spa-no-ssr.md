# 0005 — Nuxt as an SPA (`ssr: false`), not server-rendered

- **Status:** accepted
- **Date:** 2026-08-29
- **Deciders:** @kkucherenkov
- **Tags:** frontend, infra

> Recorded retroactively. `ssr: false` has been in `apps/web/nuxt.config.ts`
> since the app was scaffolded (E12).

## Context

CourseShelf is a self-hosted library for a logged-in user. Every meaningful page
— home, browse, course detail, player, settings, admin — is behind
authentication and personalised. There is no public catalogue, nothing to index,
and no first-paint-sensitive landing page.

Server rendering buys SEO and a faster first contentful paint for anonymous
visitors. This product has no anonymous visitors.

## Decision

`ssr: false`. Nuxt 4 builds a static SPA; `nuxt generate` emits assets that
nginx serves, and every data fetch goes to `/api/v1/*` from the browser.

## Consequences

### Positive

- The web deployment is a static bundle behind nginx. No Node process to run,
  supervise, restart or leak — one fewer moving part in a self-hosted stack.
- No dual-environment code. Nothing has to be written to survive running on both
  the server and the client, which removes an entire class of hydration bugs.
- The bearer token in `localStorage` ([ADR-0004](0004-better-auth-bearer-tokens.md))
  works without a server-side session bridge, because there is no server.

### Negative

- No SEO, permanently. If a public course catalogue is ever wanted, this decision
  has to be revisited, not worked around.
- First paint waits for the JS bundle. Acceptable for an authenticated app on a
  LAN; it would not be for a marketing site.
- Nuxt's SSR-oriented ecosystem is partly unavailable, and `ssr: false` puts the
  app on a less-travelled path — `@nuxt/schema` hard-resolves
  `experimental.payloadExtraction` to `false` and then warns about it, an
  upstream wart documented inline in `nuxt.config.ts`.

### Neutral

- The nginx `proxy` service folds the SPA and the API onto one origin
  (`:8080`), so the browser sees same-origin requests and neither CORS nor CORP
  has to be configured for the normal path.

## Alternatives considered

### Option A — Nuxt with SSR

Rejected: it adds a Node server to the deployment to render pages that are all
behind a login.

### Option B — a plain Vite + Vue SPA

Reasonable, and lighter. Rejected because Nuxt's file-system routing, layouts,
auto-imports and the `@nuxt/ui` + `@nuxtjs/i18n` module wiring are used
throughout, and hand-assembling those is work with no upside.

## Related

- [ADR-0007](0007-storybook-and-widgetbook.md) — how components are developed
  outside the app shell.
