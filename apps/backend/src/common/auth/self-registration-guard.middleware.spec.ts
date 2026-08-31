/**
 * WHY this file exists:
 * Unit tests for SelfRegistrationGuardMiddleware (#283) — pins that
 * AUTH_SELF_REGISTRATION=false actually rejects the request instead of only
 * hiding the sign-up CTA in the SPA, and that a fresh instance can still
 * create its owner account.
 *
 * That the middleware is *reachable* at all is covered end-to-end in
 * `test/auth.e2e-spec.ts` — it was mounted on the wrong path for its whole
 * life, so these unit tests passed while the guard never ran (#266).
 */
import { describe, it, expect, vi } from 'vitest';

import { PermissionDenied } from '../../shared/domain-error';
import { SelfRegistrationGuardMiddleware } from './self-registration-guard.middleware';

import type { AppConfig } from '../config/app-config';
import type { PrismaService } from '../prisma/prisma.service';
import type { NextFunction, Request, Response } from 'express';

function makeConfig(selfRegistration: boolean): AppConfig {
  return { instance: { selfRegistration } } as unknown as AppConfig;
}

function makePrisma(userCount: number): PrismaService {
  return {
    user: { count: vi.fn().mockResolvedValue(userCount) },
  } as unknown as PrismaService;
}

describe('SelfRegistrationGuardMiddleware', () => {
  it('passes through when self-registration is enabled', async () => {
    const middleware = new SelfRegistrationGuardMiddleware(makeConfig(true), makePrisma(3));
    const next: NextFunction = vi.fn();

    await middleware.use({} as Request, {} as Response, next);

    expect(next).toHaveBeenCalledWith();
  });

  it('rejects with PermissionDenied when self-registration is disabled', async () => {
    const middleware = new SelfRegistrationGuardMiddleware(makeConfig(false), makePrisma(1));
    const next: NextFunction = vi.fn();

    await middleware.use({} as Request, {} as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = (next as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
    expect(err).toBeInstanceOf(PermissionDenied);
    expect((err as PermissionDenied).status).toBe(403);
    expect((err as PermissionDenied).code).toBe('self-registration-disabled');
  });

  it('lets the very first account through even with self-registration disabled', async () => {
    // Otherwise a fresh install with AUTH_SELF_REGISTRATION=false — which is
    // what the NAS deployment guide ships — has no way to create its owner.
    const middleware = new SelfRegistrationGuardMiddleware(makeConfig(false), makePrisma(0));
    const next: NextFunction = vi.fn();

    await middleware.use({} as Request, {} as Response, next);

    expect(next).toHaveBeenCalledWith();
  });
});
