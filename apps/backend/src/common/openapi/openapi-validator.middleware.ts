import { existsSync, statSync } from 'node:fs';
import path from 'node:path';

import { Logger } from '@nestjs/common';
import express from 'express';
import * as OpenApiValidator from 'express-openapi-validator';

import type { INestApplication } from '@nestjs/common';

/**
 * Picks the freshest spec by mtime instead of the first candidate that
 * exists. `apps/backend/dist/specs/openapi.json` is a build artefact — a
 * `nest build` copies it there from `packages/specs/dist/openapi.json`, but
 * `vitest run` never runs that copy, so it goes stale the moment the source
 * bundle is regenerated (#500). Comparing mtime also sidesteps the case
 * where a root-owned dev-container build left that copy behind: a
 * non-root developer can't delete or overwrite it, but the resolver just
 * reads past it once a newer bundle exists elsewhere.
 */
export function pickNewestSpec(candidates: string[]): { specPath: string; stale: string[] } | null {
  const found = candidates
    .filter(existsSync)
    .map((specPath) => ({ specPath, mtimeMs: statSync(specPath).mtimeMs }))
    // stable sort: equal mtimes keep the candidates' original priority order
    .toSorted((a, b) => b.mtimeMs - a.mtimeMs);
  const [newest, ...rest] = found;
  if (!newest) return null;
  return { specPath: newest.specPath, stale: rest.map((f) => f.specPath) };
}

function resolveSpecPath(): { specPath: string; stale: string[] } | null {
  return pickNewestSpec([
    path.join(process.cwd(), 'dist/specs/openapi.json'),
    path.join(process.cwd(), '../../packages/specs/dist/openapi.json'),
    path.join(__dirname, '../../specs/openapi.json'),
  ]);
}

export function registerOpenApiValidator(app: INestApplication, nodeEnv: string): void {
  const logger = new Logger('OpenApiValidator');
  const resolved = resolveSpecPath();

  if (!resolved) {
    logger.warn(
      'OpenAPI bundle not found — skipping runtime validation. Run `pnpm --filter @app/specs bundle`.',
    );
    return;
  }
  const { specPath: apiSpec, stale } = resolved;

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
      // Without this the validator defaults to ajv-formats' `fast` mode, where
      // `date` is the bare regex `\d{4}-\d{2}-\d{2}`: `2024-13-01` is a valid
      // request date and month 13 goes into the database. It then comes back
      // out of `GET /api/v1/admin/identify-tasks`, where the response schema
      // says `format: date` and a stricter reader disagrees — the contract run
      // caught exactly that once seeded ids let it reach the operation, on a
      // scraped fragment an admin had posted. `full` validates the calendar
      // date, so the request is rejected at the boundary instead of poisoning a
      // list endpoint for every later reader. It costs a real date parse per
      // `date`/`date-time` field, which is not a budget anyone is watching.
      ajvFormats: { mode: 'full' },
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
      // `/v1/admin/backups/<id>/download` is exempt for the same reason:
      // an opaque `application/octet-stream` body. Note the alternative is
      // written to match only the download sub-route — `POST /v1/admin/backups`
      // itself IS in the spec and must stay validated.
      // `/v1/courses/<id>/poster` (#496) is exempt for the same reason: an
      // image byte body, no JSON schema — the 5th route in the #278 family.
      // `/v1/lessons/<id>/export` and `/v1/courses/<id>/export` (E28-F01-S01)
      // are exempt for the same reason: the response is a streamed ZIP
      // (`application/zip`), no JSON schema to validate against.
      ignorePaths:
        /\/v1\/(?:auth(?:\/|$)|stream\/lessons\/|stream\/materials\/|admin\/backups\/[^/]+\/download|courses\/[^/]+\/(?:poster|export)(?:\?|$)|lessons\/[^/]+\/export(?:\?|$))/,
    }),
  );

  logger.log(
    `OpenAPI validator armed with spec: ${apiSpec}` +
      (stale.length > 0 ? ` (newer than stale copy at: ${stale.join(', ')})` : ''),
  );
}
