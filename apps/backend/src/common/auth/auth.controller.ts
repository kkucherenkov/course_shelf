import { All, Controller, Req, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

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
 */
@AllowAnonymous()
@Throttle({ default: { limit: 10, ttl: 60_000 } })
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
