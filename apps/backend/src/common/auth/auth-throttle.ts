import type { ExecutionContext } from '@nestjs/common';

/**
 * Splits `/api/v1/auth/*` into two independently-budgeted named throttlers
 * (registered in `app.module.ts`, applied by `auth.controller.ts`).
 *
 * `AuthController` used to carry a single `@Throttle({ default: { limit: 10,
 * ttl: 60_000 } })` for its whole catch-all handler — sign-in (a brute-force
 * surface that deserves a tight budget) and `get-session` (a call every cold
 * SPA load makes once, ordinary traffic) shared the same 10-req/60s bucket.
 * A few tabs, a shared NAT, or a second parallel audit sweep from the same
 * IP could exhaust it purely on session reads; `auth.global.ts` then passes
 * navigation through with `user === null` and the app quietly anonymises
 * itself (#777). Pre-existing precedent for this pattern is
 * `realtime-throttle.ts`'s `REALTIME_TOKEN_THROTTLER`.
 *
 * Both predicates key off the request path rather than which controller
 * matched it, because `AuthController` is a single `@All()` handler for the
 * whole `/auth/*` subtree — there is no per-route decorator to hang a
 * different budget off. Scoping by `/auth/` is safe because Better Auth owns
 * that entire URL space; no other controller can match it.
 */

export const AUTH_DEFAULT_THROTTLER = 'authDefault';
export const AUTH_SESSION_THROTTLER = 'authSession';

function requestPath(context: ExecutionContext): string | null {
  if (context.getType() !== 'http') return null;
  const request = context.switchToHttp().getRequest<{ url?: string }>();
  return (request.url ?? '').split('?')[0] ?? '';
}

/** True for `GET /api/v1/auth/get-session`. */
export function isAuthSessionRequest(context: ExecutionContext): boolean {
  const path = requestPath(context);
  if (path === null) return false;
  const request = context.switchToHttp().getRequest<{ method?: string }>();
  return request.method === 'GET' && path.endsWith('/get-session');
}

/** True for every other `/api/v1/auth/*` route (sign-in, sign-up, sign-out, forgot/reset-password, ...). */
export function isAuthNonSessionRequest(context: ExecutionContext): boolean {
  const path = requestPath(context);
  if (path === null) return false;
  return path.includes('/auth/') && !isAuthSessionRequest(context);
}
