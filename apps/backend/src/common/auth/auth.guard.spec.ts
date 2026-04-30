/**
 * WHY this file exists:
 * Unit tests for the updated SessionGuard covering:
 *   - AllowAnonymous shortcut (no auth.getSession call).
 *   - Successful session resolution (req.session populated, req.userId set).
 *   - Missing session throws UnauthorizedException.
 */
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import { ALLOW_ANONYMOUS_KEY } from './decorators/allow-anonymous.decorator';
import { SessionGuard } from './auth.guard';

function makeI18n() {
  return { t: vi.fn().mockReturnValue('Session required') };
}

function makeAuth(
  user: { id: string; role?: string; displayName?: string } | null,
  sessionId?: string,
) {
  return {
    getSession: vi
      .fn()
      .mockResolvedValue(
        user === null ? null : { user, session: sessionId ? { id: sessionId } : undefined },
      ),
  };
}

function makeReflector(isAnonymous: boolean) {
  return {
    getAllAndOverride: vi.fn().mockReturnValue(isAnonymous),
  };
}

function makeContext(
  req: Record<string, unknown> = {},
  metadata: Record<string, unknown> = {},
): ExecutionContext {
  return {
    getHandler: () => metadata,
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => req,
    }),
  } as unknown as ExecutionContext;
}

describe('SessionGuard', () => {
  describe('when route is marked @AllowAnonymous()', () => {
    it('returns true without calling auth.getSession', async () => {
      const auth = makeAuth({ id: 'u1', role: 'user' });
      const reflector = makeReflector(true);

      const guard = new SessionGuard(auth as never, makeI18n() as never, reflector as never);
      const ctx = makeContext();
      ctx.getHandler = vi.fn().mockReturnValue({ [ALLOW_ANONYMOUS_KEY]: true });

      const result = await guard.canActivate(ctx);

      expect(result).toBe(true);
      expect(auth.getSession).not.toHaveBeenCalled();
    });
  });

  describe('when session resolves successfully', () => {
    it('attaches req.userId and req.session, returns true', async () => {
      const req: Record<string, unknown> = {};
      const auth = makeAuth({ id: 'user-42', role: 'admin', displayName: 'Alice' }, 'sess-abc');
      const reflector = makeReflector(false);

      const guard = new SessionGuard(auth as never, makeI18n() as never, reflector as never);
      const result = await guard.canActivate(makeContext(req));

      expect(result).toBe(true);
      expect(req['userId']).toBe('user-42');
      const session = req['session'] as {
        user: { id: string; role: string; displayName?: string };
        sessionId: string;
      };
      expect(session.user.id).toBe('user-42');
      expect(session.user.role).toBe('admin');
      expect(session.user.displayName).toBe('Alice');
      expect(session.sessionId).toBe('sess-abc');
    });

    it('populates sessionId as empty string when session row is absent', async () => {
      const req: Record<string, unknown> = {};
      const auth = makeAuth({ id: 'user-42', role: 'user' });
      const reflector = makeReflector(false);

      const guard = new SessionGuard(auth as never, makeI18n() as never, reflector as never);
      await guard.canActivate(makeContext(req));

      const session = req['session'] as { sessionId: string };
      expect(session.sessionId).toBe('');
    });

    it('falls back role to "user" when role is missing from session', async () => {
      const req: Record<string, unknown> = {};
      // role not present on user object
      const auth = makeAuth({ id: 'user-99' });
      const reflector = makeReflector(false);

      const guard = new SessionGuard(auth as never, makeI18n() as never, reflector as never);
      await guard.canActivate(makeContext(req));

      const session = req['session'] as { user: { role: string } };
      expect(session.user.role).toBe('user');
    });
  });

  describe('when session is null', () => {
    it('throws UnauthorizedException', async () => {
      const auth = makeAuth(null);
      const reflector = makeReflector(false);

      const guard = new SessionGuard(auth as never, makeI18n() as never, reflector as never);

      await expect(guard.canActivate(makeContext())).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });
});
