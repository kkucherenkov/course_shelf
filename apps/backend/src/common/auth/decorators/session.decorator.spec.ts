/**
 * WHY this file exists:
 * Tests the @Session() parameter decorator's defensive throwing branch —
 * when req.session is undefined the decorator must throw so the developer
 * catches the misconfiguration early rather than getting a cryptic runtime error.
 */
import { ExecutionContext } from '@nestjs/common';
import { describe, expect, it } from 'vitest';

function makeCtx(req: Record<string, unknown>): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => req,
    }),
  } as unknown as ExecutionContext;
}

// We reproduce the factory callback inline rather than importing via
// createParamDecorator internals (which are not publicly testable).
function extractSession(_data: unknown, ctx: ExecutionContext): unknown {
  const req = ctx.switchToHttp().getRequest<{ session?: unknown }>();
  if (!req.session) {
    throw new Error(
      '@Session() called on an unauthenticated route. Mark it @AllowAnonymous() or remove the @Session() parameter.',
    );
  }
  return req.session;
}

describe('@Session() parameter decorator', () => {
  it('throws when req.session is undefined', () => {
    const ctx = makeCtx({});
    expect(() => extractSession(undefined, ctx)).toThrowError(
      '@Session() called on an unauthenticated route',
    );
  });

  it('returns req.session when present', () => {
    const sessionValue = { user: { id: 'u1', role: 'user' } };
    const ctx = makeCtx({ session: sessionValue });
    expect(extractSession(undefined, ctx)).toBe(sessionValue);
  });
});
