/**
 * WHY this file exists:
 * Unit tests for SelfRegistrationGuardMiddleware (#283) — pins that
 * AUTH_SELF_REGISTRATION=false actually rejects the request instead of only
 * hiding the sign-up CTA in the SPA.
 */
import { describe, it, expect, vi } from 'vitest';

import { PermissionDenied } from '../../shared/domain-error';
import { SelfRegistrationGuardMiddleware } from './self-registration-guard.middleware';

import type { AppConfig } from '../config/app-config';
import type { NextFunction, Request, Response } from 'express';

function makeConfig(selfRegistration: boolean): AppConfig {
  return { instance: { selfRegistration } } as unknown as AppConfig;
}

describe('SelfRegistrationGuardMiddleware', () => {
  it('passes through when self-registration is enabled', () => {
    const middleware = new SelfRegistrationGuardMiddleware(makeConfig(true));
    const next: NextFunction = vi.fn();

    middleware.use({} as Request, {} as Response, next);

    expect(next).toHaveBeenCalledWith();
  });

  it('rejects with PermissionDenied when self-registration is disabled', () => {
    const middleware = new SelfRegistrationGuardMiddleware(makeConfig(false));
    const next: NextFunction = vi.fn();

    middleware.use({} as Request, {} as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = (next as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
    expect(err).toBeInstanceOf(PermissionDenied);
    expect((err as PermissionDenied).status).toBe(403);
    expect((err as PermissionDenied).code).toBe('self-registration-disabled');
  });
});
