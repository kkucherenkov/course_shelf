import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
  mixin,
  UnauthorizedException,
  type Type,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { I18nContext, I18nService } from 'nestjs-i18n';

import { PrismaService } from '../prisma/prisma.service';

import { ALLOW_ANONYMOUS_KEY } from './decorators/allow-anonymous.decorator';
import { AuthService } from './auth.service';

import type { SessionContext } from './decorators/session.decorator';
import type { Request } from 'express';

/** Attach the authenticated userId and session to the request so downstream code can read them. */
export interface AuthenticatedRequest extends Request {
  userId: string;
  session?: SessionContext;
}

@Injectable()
export class SessionGuard implements CanActivate {
  private readonly logger = new Logger(SessionGuard.name);

  constructor(
    private readonly auth: AuthService,
    private readonly i18n: I18nService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isAnonymous = this.reflector.getAllAndOverride<boolean>(ALLOW_ANONYMOUS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isAnonymous) return true;

    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const session = await this.auth.getSession(req);
    if (!session?.user) {
      const lang = I18nContext.current()?.lang;
      throw new UnauthorizedException(
        this.i18n.t('auth.sessionRequired', lang ? { lang } : undefined),
      );
    }

    req.userId = session.user.id;

    // Build the structured session context attached to `req.session` so
    // the @Session() parameter decorator can read it without re-resolving.
    const raw = (session.user as unknown as Record<string, unknown>)['role'];
    const role = typeof raw === 'string' ? raw : 'user';
    const displayNameRaw = (session.user as unknown as Record<string, unknown>)['displayName'];
    const sessionUser: import('./decorators/session.decorator').SessionUser = {
      id: session.user.id,
      role,
    };
    if (typeof displayNameRaw === 'string') {
      sessionUser.displayName = displayNameRaw;
    }

    req.session = { user: sessionUser };

    return true;
  }
}

/**
 * Factory guard that additionally checks the caller's role.
 * Includes session resolution so it can be used as the sole guard on a route.
 *
 * Replace `role: string` with your domain role enum when you add one.
 */
export function RoleGuard(requiredRole: string): Type<CanActivate> {
  @Injectable()
  class MixinRoleGuard implements CanActivate {
    readonly logger: Logger;
    readonly auth: AuthService;
    readonly prisma: PrismaService;
    readonly i18n: I18nService;

    constructor(auth: AuthService, prisma: PrismaService, i18n: I18nService) {
      this.auth = auth;
      this.prisma = prisma;
      this.i18n = i18n;
      this.logger = new Logger(MixinRoleGuard.name);
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
      const req = context.switchToHttp().getRequest<AuthenticatedRequest>();

      // Resolve session
      const session = await this.auth.getSession(req);
      if (!session?.user) {
        const lang = I18nContext.current()?.lang;
        throw new UnauthorizedException(
          this.i18n.t('auth.sessionRequired', lang ? { lang } : undefined),
        );
      }
      req.userId = session.user.id;

      // TODO: Implement role check using your domain UserProfile model.
      // Example:
      // const profile = await this.prisma.userProfile.findUnique({
      //   where: { userId: session.user.id },
      //   select: { role: true },
      // });
      // if (profile?.role !== requiredRole) { ... }

      void requiredRole; // placeholder — remove when implementing

      const lang = I18nContext.current()?.lang;
      throw new ForbiddenException(this.i18n.t('auth.forbidden', lang ? { lang } : undefined));
    }
  }

  return mixin(MixinRoleGuard);
}
