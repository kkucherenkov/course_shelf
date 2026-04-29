import { existsSync } from 'node:fs';
import path from 'node:path';

import { Logger } from '@nestjs/common';
import express from 'express';
import * as OpenApiValidator from 'express-openapi-validator';

import type { INestApplication } from '@nestjs/common';

function resolveSpecPath(): string | null {
  const candidates = [
    path.join(process.cwd(), 'dist/specs/openapi.json'),
    path.join(process.cwd(), '../../packages/specs/dist/openapi.json'),
    path.join(__dirname, '../../specs/openapi.json'),
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

export function registerOpenApiValidator(app: INestApplication, nodeEnv: string): void {
  const logger = new Logger('OpenApiValidator');
  const apiSpec = resolveSpecPath();

  if (!apiSpec) {
    logger.warn(
      'OpenAPI bundle not found — skipping runtime validation. Run `pnpm --filter @app/specs bundle`.',
    );
    return;
  }

  // Express 5 + NestJS 11 do not auto-mount a JSON body parser before our
  // app-level `app.use()` middlewares run, so the openapi-validator sees
  // `req.body === undefined` for every JSON POST/PATCH/PUT and rejects with
  // "request must have required property 'body'". Mount express.json() at
  // the same `/api` prefix as the validator so the body is parsed first.
  // The Better Auth catch-all (`/api/v1/auth/*`) re-stringifies `req.body`
  // before forwarding to its handler — pre-parsing here is compatible with
  // that path. The `/v1/stream/lessons/` endpoints stream binary and never
  // carry a JSON request body.
  app.use('/api', express.json({ limit: '1mb' }));

  app.use(
    '/api',
    OpenApiValidator.middleware({
      apiSpec,
      validateRequests: true,
      validateResponses:
        nodeEnv === 'production'
          ? false
          : {
              onError: (err) => {
                logger.warn(`response schema mismatch: ${err.message}`);
                err.status = 400;
                throw err;
              },
            },
      // Auth is enforced by Better Auth + app-level guards/services so the body is
      // localised (RFC 9457 problem+json, nestjs-i18n). Letting the validator check
      // cookieAuth/bearerAuth would both (a) crash on missing `req.cookies` and
      // (b) return a generic, non-localised 401. The spec still documents the
      // schemes for clients and generated code.
      validateSecurity: false,
      // Better Auth owns its own wire protocol — the validator has no OpenAPI
      // schema for these routes and must not reject them. `/api/v1/auth` is
      // mounted inside URI versioning so the namespace is consistent.
      //
      // `/v1/stream/lessons/` is also exempt: the response is raw binary video
      // bytes (not JSON), so the OpenAPI validator has no schema to validate
      // against and must not intercept these requests.
      //
      // The pattern is intentionally non-anchored so it matches both the
      // mount-relative form (`/v1/auth/...`) and the absolute form
      // (`/api/v1/auth/...`). Express 5's behaviour for the path passed to
      // `express-openapi-validator`'s ignorePaths matcher includes the `/api`
      // mount prefix, while older Express versions stripped it — handling
      // both keeps this resilient.
      // `/v1/stream/materials/` is also exempt: same rationale as the video
      // stream endpoint — raw binary response with no OpenAPI JSON schema.
      ignorePaths: /\/v1\/(?:auth(?:\/|$)|stream\/lessons\/|stream\/materials\/)/,
    }),
  );

  logger.log(`OpenAPI validator armed with spec: ${apiSpec}`);
}
