import { existsSync } from 'node:fs';
import path from 'node:path';

import { Logger } from '@nestjs/common';
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
      // `ignorePaths` is tested against `req.path`, which is relative to the
      // middleware mount point (`/api`), so the `/api` prefix must be omitted.
      //
      // `/v1/stream/lessons/` is also exempt: the response is raw binary video
      // bytes (not JSON), so the OpenAPI validator has no schema to validate
      // against and must not intercept these requests.
      ignorePaths: /\/v1\/auth(\/|$)|\/v1\/stream\/lessons\//,
    }),
  );

  logger.log(`OpenAPI validator armed with spec: ${apiSpec}`);
}
