import { ExecutionContext, createParamDecorator } from '@nestjs/common';

export interface SessionUser {
  id: string;
  role: string;
  displayName?: string;
}

export interface SessionContext {
  user: SessionUser;
  /** Better Auth session row id — stable for the lifetime of the token. */
  sessionId: string;
}

export const Session = createParamDecorator<unknown, SessionContext>(
  (_data, ctx: ExecutionContext): SessionContext => {
    const req = ctx.switchToHttp().getRequest<{ session?: SessionContext }>();
    if (!req.session) {
      throw new Error(
        '@Session() called on an unauthenticated route. Mark it @AllowAnonymous() or remove the @Session() parameter.',
      );
    }
    return req.session;
  },
);
