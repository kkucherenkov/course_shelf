/**
 * WHY this file exists:
 * Unit tests for AdminGuard verifying the allow / deny branch per role.
 * AuthService and I18nService are mocked to avoid real HTTP / DB calls.
 */
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import { PermissionDenied } from '../../shared/domain-error';
import { AdminGuard } from './admin.guard';

function makeI18n() {
  return {
    t: vi.fn().mockReturnValue('Forbidden'),
  };
}

function makeAuth(role: string | undefined | null) {
  return {
    getSession: vi.fn().mockResolvedValue(role === null ? null : { user: { id: 'user-1', role } }),
  };
}

function makeContext(req: object = {}): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => req,
    }),
  } as unknown as ExecutionContext;
}

describe('AdminGuard', () => {
  describe('when user has admin role', () => {
    it('returns true and stamps req.userId', async () => {
      const req: Record<string, unknown> = {};
      const guard = new AdminGuard(makeAuth('admin') as never, makeI18n() as never);

      const result = await guard.canActivate(makeContext(req));

      expect(result).toBe(true);
      expect(req['userId']).toBe('user-1');
    });
  });

  describe('when user has a non-admin role', () => {
    it('throws PermissionDenied', async () => {
      const guard = new AdminGuard(makeAuth('user') as never, makeI18n() as never);

      await expect(guard.canActivate(makeContext())).rejects.toBeInstanceOf(PermissionDenied);
    });

    it('PermissionDenied has status 403', async () => {
      const guard = new AdminGuard(makeAuth('user') as never, makeI18n() as never);

      const error = await guard.canActivate(makeContext()).catch((error_: unknown) => error_);

      expect((error as PermissionDenied).status).toBe(403);
      expect((error as PermissionDenied).code).toBe('permission-denied');
    });
  });

  describe('when session is null', () => {
    it('throws UnauthorizedException', async () => {
      const guard = new AdminGuard(makeAuth(null) as never, makeI18n() as never);

      await expect(guard.canActivate(makeContext())).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });
});
