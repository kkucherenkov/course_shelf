/**
 * WHY this file exists:
 * Unit tests for SignInRateLimitMiddleware covering:
 *   - Up to MAX_ATTEMPTS (5) calls per IP are passed through.
 *   - The 6th attempt is blocked with 429 + Retry-After header.
 *   - IPs are tracked independently.
 *   - After the 15-minute window elapses the bucket is pruned and requests pass through again.
 *   - Retry-After reflects the time until the oldest attempt falls out of the window.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { SignInRateLimitMiddleware } from './sign-in-rate-limit.middleware';

import type { NextFunction, Request, Response } from 'express';

type TestResponse = Response & {
  _statusCode?: number;
  _body?: unknown;
  _headers: Record<string, string>;
};

function makeReq(ip: string): Request {
  return { ip, socket: { remoteAddress: ip } } as unknown as Request;
}

function makeRes(): TestResponse {
  const headers: Record<string, string> = {};
  const res: TestResponse = {
    _headers: headers,
    setHeader(name: string, value: string) {
      headers[name] = value;
    },
    status(code: number) {
      res._statusCode = code;
      return res;
    },
    json(body: unknown) {
      res._body = body;
      return res;
    },
  } as unknown as TestResponse;
  return res;
}

describe('SignInRateLimitMiddleware', () => {
  let middleware: SignInRateLimitMiddleware;

  beforeEach(() => {
    middleware = new SignInRateLimitMiddleware();
  });

  it('allows up to MAX_ATTEMPTS within the window', () => {
    const next: NextFunction = vi.fn();
    for (let i = 0; i < 5; i++) {
      middleware.use(makeReq('1.2.3.4'), makeRes() as Response, next);
    }
    expect(next).toHaveBeenCalledTimes(5);
  });

  it('blocks the 6th attempt with 429 + Retry-After', () => {
    const ip = '1.2.3.4';
    for (let i = 0; i < 5; i++) {
      middleware.use(makeReq(ip), makeRes() as Response, vi.fn());
    }
    const next = vi.fn();
    const res = makeRes();
    middleware.use(makeReq(ip), res as unknown as Response, next);
    expect(next).not.toHaveBeenCalled();
    expect(res._statusCode).toBe(429);
    expect(res._headers['Retry-After']).toMatch(/^\d+$/);
    expect(res._body).toMatchObject({
      type: 'about:blank',
      status: 429,
    });
  });

  it('counts IPs independently', () => {
    const next = vi.fn();
    for (let i = 0; i < 5; i++) {
      middleware.use(makeReq('1.2.3.4'), makeRes() as Response, next);
    }
    middleware.use(makeReq('5.6.7.8'), makeRes() as Response, next); // not blocked
    expect(next).toHaveBeenCalledTimes(6);
  });

  it('resets after the window elapses', () => {
    vi.useFakeTimers();
    try {
      const ip = '1.2.3.4';
      for (let i = 0; i < 5; i++) {
        middleware.use(makeReq(ip), makeRes() as Response, vi.fn());
      }
      vi.advanceTimersByTime(15 * 60 * 1000 + 1000); // 15 min + 1s
      const next = vi.fn();
      middleware.use(makeReq(ip), makeRes() as Response, next);
      expect(next).toHaveBeenCalledOnce();
    } finally {
      vi.useRealTimers();
    }
  });

  it('Retry-After reflects time until the oldest attempt expires', () => {
    vi.useFakeTimers();
    try {
      const ip = '1.2.3.4';
      for (let i = 0; i < 5; i++) {
        middleware.use(makeReq(ip), makeRes() as Response, vi.fn());
        vi.advanceTimersByTime(1000); // 1 second between each attempt
      }
      // 5 seconds elapsed since first attempt; window is 900 s — Retry-After ≈ 895s.
      const res = makeRes();
      middleware.use(makeReq(ip), res as unknown as Response, vi.fn());
      const retryAfter = Number.parseInt(res._headers['Retry-After'] ?? '0', 10);
      expect(retryAfter).toBeGreaterThanOrEqual(890);
      expect(retryAfter).toBeLessThanOrEqual(900);
    } finally {
      vi.useRealTimers();
    }
  });
});
