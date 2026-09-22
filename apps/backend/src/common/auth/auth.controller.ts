import { All, Controller, Req, Res } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';

import { AllowAnonymous } from './decorators';
import { AuthService } from './auth.service';

import type { Request, Response } from 'express';

/**
 * Better Auth catch-all controller. Better Auth owns its own wire protocol, so
 * we hand every `/api/v1/auth/*` request to `auth.handler(Request)` and stream
 * the resulting Web `Response` back through the Express `res` object.
 *
 * The path `auth/{*rest}` (NestJS v10+ catch-all syntax) resolves to
 * `/api/v1/auth/*` via `setGlobalPrefix('api')` + `enableVersioning({ URI, defaultVersion: '1' })`.
 * No `VERSION_NEUTRAL` — we deliberately live under `v1`.
 *
 * No `@Throttle` here: the budget for this whole subtree used to be a
 * literal `@Throttle({ default: { limit: 10, ttl: 60_000 } })`, which meant
 * `get-session` (called once by every cold SPA load) shared a 10-req/60s
 * bucket with sign-in's brute-force surface — a few tabs or a shared NAT
 * could burn it on session reads alone and the app would silently
 * anonymise itself (#777). `AUTH_DEFAULT_THROTTLER` /
 * `AUTH_SESSION_THROTTLER` (`auth-throttle.ts`, wired in `app.module.ts`)
 * now split the two by request path instead; `@SkipThrottle({ default:
 * true })` just opts this controller out of the *global* 'default' budget
 * so it doesn't also stack on top of them.
 */
@AllowAnonymous()
@SkipThrottle({ default: true })
@Controller({ path: 'auth/{*rest}', version: '1' })
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @All()
  async handle(@Req() req: Request, @Res() res: Response): Promise<void> {
    const host = req.get('host') ?? 'localhost';
    const protocol = req.protocol || 'http';
    const url = new URL(req.originalUrl || req.url, `${protocol}://${host}`);

    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (typeof value === 'string') headers.set(key, value);
      else if (Array.isArray(value)) headers.set(key, value.join(','));
    }

    const init: RequestInit = { method: req.method, headers };
    if (
      req.method !== 'GET' &&
      req.method !== 'HEAD' &&
      req.body !== undefined &&
      req.body !== null &&
      typeof req.body === 'object' &&
      Object.keys(req.body as Record<string, unknown>).length > 0
    ) {
      init.body = JSON.stringify(req.body);
    }

    const request = new Request(url.toString(), init);
    const response = await this.auth.auth.handler(request);

    for (const [key, value] of response.headers.entries()) {
      res.setHeader(key, value);
    }
    res.status(response.status);
    const buffer = Buffer.from(await response.arrayBuffer());
    res.send(buffer);
  }
}
