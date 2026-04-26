/**
 * WHY this file exists:
 * Lightweight guard that combines session resolution with an admin-role check.
 * Better Auth's `admin` plugin stores the role on `session.user.role`; we check
 * for the string `'admin'` and throw a domain-level PermissionDenied so the
 * HttpExceptionFilter renders a 403 application/problem+json (not a NestJS
 * ForbiddenException with a different shape).
 *
 * Usage:
 *   @UseGuards(AdminGuard)
 *   @Post()
 *   async create(...) { ... }
 *
 * The guard also stamps `req.userId` so downstream code can read the actor id
 * without calling getSession again.
 */
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { I18nContext, I18nService } from 'nestjs-i18n';

import { PermissionDenied } from '../../shared/domain-error';
import { AuthService } from './auth.service';

import type { AuthenticatedRequest } from './auth.guard';
import type { Request } from 'express';

@Injectable()
export class AdminGuard implements CanActivate {
  private readonly logger = new Logger(AdminGuard.name);

  constructor(
    private readonly auth: AuthService,
    private readonly i18n: I18nService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest & Request>();

    const session = await this.auth.getSession(req);

    if (!session?.user) {
      const lang = I18nContext.current()?.lang;
      throw new UnauthorizedException(
        this.i18n.t('auth.sessionRequired', lang ? { lang } : undefined),
      );
    }

    req.userId = session.user.id;

    // Better Auth admin plugin stores the role on session.user.role.
    // Cast through unknown because the inferred type is narrowed away in the
    // createInstance wrapper (TS2742 workaround in auth.service.ts).
    const role = (session.user as unknown as Record<string, unknown>)['role'];

    if (role !== 'admin') {
      throw new PermissionDenied('Admin role required.');
    }

    return true;
  }
}
