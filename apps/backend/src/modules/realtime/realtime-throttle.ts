import type { ExecutionContext } from '@nestjs/common';

/**
 * Name of the throttler that governs realtime-token minting. Configured in
 * `app.module.ts` from `AppConfig.rateLimit`, applied only to the route this
 * predicate matches.
 */
export const REALTIME_TOKEN_THROTTLER = 'realtimeToken';

/**
 * True for `POST /api/v1/realtime/token`.
 *
 * The budget used to be a literal in `@Throttle` on the controller. That put it
 * out of reach of `AppConfig`, so raising the global limit for the CI stack
 * left this route at 30/min and `spec:contract-test` kept getting 429s from it
 * — including one it mislabelled as "API accepted schema-violating request",
 * because the guard runs before auth and 429 is not in schemathesis's list of
 * valid rejections.
 */
export function isRealtimeTokenRequest(context: ExecutionContext): boolean {
  if (context.getType() !== 'http') return false;
  const request = context.switchToHttp().getRequest<{ method?: string; url?: string }>();
  if (request.method !== 'POST') return false;
  const path = (request.url ?? '').split('?')[0] ?? '';
  return path.endsWith('/realtime/token');
}
