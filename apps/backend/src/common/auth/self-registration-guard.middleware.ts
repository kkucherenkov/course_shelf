/**
 * WHY this file exists:
 * `AUTH_SELF_REGISTRATION=false` (surfaced as `AppConfig.instance.selfRegistration`)
 * used to only hide the sign-up CTA in the SPA (`GET /admin/instance`) — the
 * server still happily created accounts via `POST /sign-up/email`. That is an
 * access-control hole, not a UI nicety (#283).
 *
 * Better Auth's routes are public as soon as the plugin is registered
 * (see the `disableSignUp` comment in `auth.service.ts`), so the block sits
 * on the mount in `AuthModule`, ahead of `AuthController.handle()` handing
 * the request to `auth.handler`. It matches every path under `/sign-up/*`
 * — not only the email provider the issue names — so a future auth provider
 * (SSO, username, …) does not silently reopen the hole.
 *
 * Throws the shared `PermissionDenied` domain error via `next(err)` so
 * `HttpExceptionFilter` renders the same RFC 9457 `application/problem+json`
 * shape as every other 403 in this API — the filter already funnels Express
 * `next(err)` errors through the same `DomainError` branch (see its doc
 * comment on `ExternalHttpError`).
 *
 * First-run setup is exempt. An empty user table means there is no admin to
 * "add users from the Users page" yet, so enforcing the toggle there would
 * brick a fresh install — and the recommended NAS deployment ships
 * `AUTH_SELF_REGISTRATION=false` in its .env. The probe is the same
 * `count({ take: 1 })` the first-user-is-admin hook in `auth.service.ts`
 * already runs, so the two agree by construction: the one account this lets
 * through is exactly the one that gets promoted to ADMIN.
 */
import { Injectable } from '@nestjs/common';

import { PermissionDenied } from '../../shared/domain-error';
import { AppConfig } from '../config/app-config';
import { PrismaService } from '../prisma/prisma.service';

import type { NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

@Injectable()
export class SelfRegistrationGuardMiddleware implements NestMiddleware {
  constructor(
    private readonly config: AppConfig,
    private readonly prisma: PrismaService,
  ) {}

  async use(_req: Request, _res: Response, next: NextFunction): Promise<void> {
    if (this.config.instance.selfRegistration) {
      next();
      return;
    }

    if ((await this.prisma.user.count({ take: 1 })) === 0) {
      next();
      return;
    }

    next(
      new PermissionDenied(
        'Self-registration is disabled on this instance.',
        'self-registration-disabled',
      ),
    );
  }
}
