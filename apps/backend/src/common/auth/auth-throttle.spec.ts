/**
 * WHY this file exists:
 * Unit tests for the `/api/v1/auth/*` throttle split (#777) — the predicates
 * that decide whether a request is `get-session` (loose budget) or every
 * other auth route (tight, sign-in-adjacent budget). Wrong here means either
 * budget silently leaks onto the wrong requests app-wide, since both
 * throttlers are registered globally and rely on these `skipIf` checks to
 * stay scoped to `/auth/*`.
 */
import { describe, it, expect } from 'vitest';

import { isAuthNonSessionRequest, isAuthSessionRequest } from './auth-throttle';

import type { ExecutionContext } from '@nestjs/common';

function makeContext(type: 'http' | 'rpc', method?: string, url?: string): ExecutionContext {
  return {
    getType: () => type,
    switchToHttp: () => ({ getRequest: () => ({ method, url }) }),
  } as unknown as ExecutionContext;
}

describe('isAuthSessionRequest', () => {
  it('is true for GET .../auth/get-session', () => {
    expect(isAuthSessionRequest(makeContext('http', 'GET', '/api/v1/auth/get-session'))).toBe(true);
  });

  it('ignores a query string', () => {
    expect(isAuthSessionRequest(makeContext('http', 'GET', '/api/v1/auth/get-session?x=1'))).toBe(
      true,
    );
  });

  it('is false for POST to the same path', () => {
    expect(isAuthSessionRequest(makeContext('http', 'POST', '/api/v1/auth/get-session'))).toBe(
      false,
    );
  });

  it('is false for a different auth route', () => {
    expect(isAuthSessionRequest(makeContext('http', 'GET', '/api/v1/auth/sign-in/email'))).toBe(
      false,
    );
  });

  it('is false outside an http context', () => {
    expect(isAuthSessionRequest(makeContext('rpc'))).toBe(false);
  });
});

describe('isAuthNonSessionRequest', () => {
  it('is true for sign-in', () => {
    expect(isAuthNonSessionRequest(makeContext('http', 'POST', '/api/v1/auth/sign-in/email'))).toBe(
      true,
    );
  });

  it('is false for get-session — that request belongs to the other throttler', () => {
    expect(isAuthNonSessionRequest(makeContext('http', 'GET', '/api/v1/auth/get-session'))).toBe(
      false,
    );
  });

  it('is false for a route outside /auth/ — the tight budget must not leak app-wide', () => {
    expect(isAuthNonSessionRequest(makeContext('http', 'GET', '/api/v1/courses'))).toBe(false);
  });

  it('is false outside an http context', () => {
    expect(isAuthNonSessionRequest(makeContext('rpc'))).toBe(false);
  });
});
