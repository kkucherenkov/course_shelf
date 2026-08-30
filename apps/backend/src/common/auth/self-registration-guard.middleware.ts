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
 */
import { Injectable } from '@nestjs/common';

import { PermissionDenied } from '../../shared/domain-error';
import { AppConfig } from '../config/app-config';

import type { NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

@Injectable()
export class SelfRegistrationGuardMiddleware implements NestMiddleware {
  constructor(private readonly config: AppConfig) {}

  use(_req: Request, _res: Response, next: NextFunction): void {
    if (!this.config.instance.selfRegistration) {
      next(
        new PermissionDenied(
          'Self-registration is disabled on this instance.',
          'self-registration-disabled',
        ),
      );
      return;
    }
    next();
  }
}
