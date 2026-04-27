import { HttpStatus, Injectable } from '@nestjs/common';

import type { NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;

/**
 * In-memory token bucket keyed by client IP. The bucket stores the absolute
 * timestamps of recent sign-in attempts; on each call we prune timestamps
 * older than now - WINDOW_MS, then count.
 *
 * Both successful and failed sign-ins count toward the cap — a successful
 * brute-force probe is still a probe.
 *
 * V1: in-process Map. Single backend instance assumption — the deployment
 * is a single container today.
 *
 * V2 note: swap the Map for a Redis sorted-set adapter behind a port interface
 * once horizontal scaling is required (multi-instance or edge deployment).
 * The Map is a memory-leak vector if traffic comes from a huge IP range, but
 * at v1 scale (single-instance, internal users) it is acceptable.
 */
@Injectable()
export class SignInRateLimitMiddleware implements NestMiddleware {
  private readonly attempts = new Map<string, number[]>();

  use(req: Request, res: Response, next: NextFunction): void {
    const ip = this.resolveIp(req);
    const now = Date.now();
    const cutoff = now - WINDOW_MS;

    const bucket = this.attempts.get(ip) ?? [];
    const fresh = bucket.filter((t) => t > cutoff);

    if (fresh.length >= MAX_ATTEMPTS) {
      // fresh.length >= MAX_ATTEMPTS guarantees at least one entry exists.
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- guarded by length check above
      const oldest = fresh[0]!;
      const retryAfterSeconds = Math.max(1, Math.ceil((oldest + WINDOW_MS - now) / 1000));
      res.setHeader('Retry-After', String(retryAfterSeconds));
      res.status(HttpStatus.TOO_MANY_REQUESTS).json({
        type: 'about:blank',
        title: 'Too Many Requests',
        status: HttpStatus.TOO_MANY_REQUESTS,
        detail: `Too many sign-in attempts from this IP. Try again in ${String(retryAfterSeconds)} seconds.`,
      });
      // Persist the pruned bucket — blocked attempts still consume budget.
      this.attempts.set(ip, fresh);
      return;
    }

    // Count this attempt (success or failure — both count).
    fresh.push(now);
    this.attempts.set(ip, fresh);
    next();
  }

  /**
   * Express resolves req.ip honoring `trust proxy`. Fallback to socket address
   * if Express somehow returns undefined (defensive — should not happen with
   * the current trust-proxy config set to 'loopback' in main.ts).
   */
  private resolveIp(req: Request): string {
    return req.ip ?? req.socket.remoteAddress ?? 'unknown';
  }

  /** Test hook — flushes all buckets. */
  reset(): void {
    this.attempts.clear();
  }
}
