import type { ExecutionContext } from '@nestjs/common';

/**
 * Name of the throttler that governs media streaming. Configured in
 * `app.module.ts` from `AppConfig.rateLimit`, applied only to the paths this
 * predicate matches.
 *
 * WHY this exists: `StreamingController` used to fall under the global
 * `default` budget of 60 requests / 60 s alongside every other route. Byte-range
 * streaming is many requests per single view by construction — the player
 * issues one per range, and each seek issues another — so watching a lesson
 * spent the same allowance that serves the catalogue. Measured before the fix:
 * 429 on the 61st request with `Retry-After: 53`, the home page costing 11
 * requests and a lesson page 11 + 2, which put roughly six navigations a minute
 * at the limit. Past it the catalogue of 68 courses vanished entirely, because
 * `GET /courses` was answered 429 like anything else (#792).
 *
 * This is #777's defect in a different place: a limit is right, a *shared*
 * limit is not. Seeking through a video is not suspicious activity and must not
 * consume the budget that protects the rest of the API.
 *
 * The budget here is deliberately generous rather than absent. Throttling by
 * request count is a poor fit for range requests — bytes or concurrent sessions
 * would measure the real cost — but `@nestjs/throttler` counts requests, so a
 * high count is the honest approximation rather than a number tuned to feel
 * safe.
 */
export const STREAM_THROTTLER = 'stream';

/** True for every `/api/v1/stream/*` route: video ranges, subtitle tracks, materials. */
export function isStreamRequest(context: ExecutionContext): boolean {
  if (context.getType() !== 'http') return false;
  const request = context.switchToHttp().getRequest<{ url?: string }>();
  const path = (request.url ?? '').split('?')[0] ?? '';
  return path.includes('/stream/');
}
