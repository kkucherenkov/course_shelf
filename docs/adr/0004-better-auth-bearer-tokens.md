# 0004 — Better Auth, with bearer tokens for both clients

- **Status:** accepted
- **Date:** 2026-08-29
- **Deciders:** @kkucherenkov
- **Tags:** backend, frontend, mobile, security

> Recorded retroactively. Implemented in E04-F01 and revisited during the
> 2026-08-28 audit, which found the recovery flows stubbed (fixed in `#187`).

## Context

Two clients need the same sessions. A browser SPA can hold an HTTP-only cookie;
a Flutter app cannot — it has no cookie jar the platform manages for it, and the
API may live on a different origin entirely. Building the session store, the
password hashing, the email-OTP flow and the admin role model by hand is a large
surface where mistakes are silent and expensive.

## Decision

Use **Better Auth**, mounted as a catch-all under `/api/v1/auth/*` inside the
NestJS versioning prefix, with the Prisma adapter over the same database. The
`bearer` plugin is enabled, and **both** clients authenticate with a bearer
token:

- `apps/web` — `createAuthClient` from `better-auth/vue`, token persisted in
  `localStorage` under `cs.web.bearer` from the server's `set-auth-token`
  header (`app/stores/auth.ts`).
- `apps/mobile` — `flutter_secure_storage` via `TokenStorage`, attached by a Dio
  interceptor as `Authorization: Bearer …` (`shared/network/api_client.dart`).

Plugins are exactly `admin`, `bearer` and `emailOTP` — asserted by a test that
fails if a fourth appears (`auth.service.spec.ts`).

## Consequences

### Positive

- One session model, one user table, one set of flows for both clients. A change
  to password policy or verification does not have to be made twice.
- Bearer everywhere means the mobile and web auth paths are the same code path
  on the server, so a bug cannot exist on one client only.
- The plugin allowlist test makes the auth surface an explicit, reviewed thing
  rather than whatever accumulated.

### Negative

- `localStorage` is readable by any script on the origin, so the web token is
  XSS-exfiltratable in a way an HTTP-only cookie is not. This is the real cost of
  the decision and is mitigated by CSP at the proxy, not eliminated.
- `/api/v1/auth/*` is deliberately absent from `openapi.yaml` — Better Auth owns
  those routes and their shapes. That is a documented hole in
  [ADR-0002](0002-spec-first-openapi.md)'s guarantee: the contract does not
  cover auth, and only integration tests do.
- Upgrading Better Auth can move route shapes underneath both clients at once.

### Neutral

- `cookieAuth` is still declared as a security scheme alongside `bearerAuth`, and
  the web client sends `credentials: 'include'` for same-origin dev. Cookies are
  a working fallback, not the primary path.

## Alternatives considered

### Option A — hand-rolled JWT + Passport

Rejected. Sessions, refresh, email verification, OTP and an admin role model are
a lot of security-sensitive surface to own for no differentiating benefit.

### Option B — cookie-only sessions, mobile via a proxy

Rejected. It makes the mobile client's auth a different code path from the web
client's, which is the class of asymmetry that produces "works on web" bugs.

### Option C — an external IdP (Keycloak, Auth0)

Rejected for a self-hosted single-instance product: it doubles the operational
footprint for a deployment whose whole appeal is one compose file.

## Related

- [ADR-0002](0002-spec-first-openapi.md) — auth routes are the documented
  exception to the spec-first rule.
