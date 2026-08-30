/**
 * Tests for HttpExceptionFilter's handling of errors raised *outside* the Nest
 * pipeline.
 *
 * `express-openapi-validator` is mounted with `app.use('/api', …)`, so it runs
 * ahead of the Nest router and rejects an unknown path / a method the path does
 * not define by calling `next(err)` with its own `HttpError`. Nest's express
 * error handler funnels that into the global filter, where it used to miss both
 * the `DomainError` and the `HttpException` branch and come out as a 500.
 *
 * The test boots the real middleware against a three-route inline document
 * rather than the bundled spec: `packages/specs/dist/openapi.json` is a build
 * artefact and is not committed, so depending on it would make this suite
 * order-dependent on `pnpm spec:bundle`.
 */
import { Controller, Get, INestApplication, VersioningType } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import express from 'express';
import * as OpenApiValidator from 'express-openapi-validator';
import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';

import { HttpExceptionFilter } from './http-exception.filter';

const jsonOk = {
  responses: { '200': { description: 'ok', content: { 'application/json': {} } } },
};

const API_SPEC = {
  openapi: '3.0.3',
  info: { title: 'test', version: '1.0.0' },
  paths: {
    '/api/v1/things': { get: jsonOk },
    '/api/v1/things/boom': { get: jsonOk },
  },
};

@Controller({ path: 'things', version: '1' })
class ThingsController {
  @Get()
  list(): { ok: true } {
    return { ok: true };
  }

  @Get('boom')
  boom(): never {
    throw new Error('kaboom');
  }
}

let app: INestApplication;

async function buildApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    controllers: [ThingsController],
    providers: [{ provide: APP_FILTER, useClass: HttpExceptionFilter }],
  }).compile();

  const created = moduleRef.createNestApplication();
  created.setGlobalPrefix('api');
  created.enableVersioning({ type: VersioningType.URI });
  created.use('/api', express.json());
  created.use(
    '/api',
    OpenApiValidator.middleware({
      apiSpec: API_SPEC as never,
      validateRequests: true,
      validateResponses: false,
      validateSecurity: false,
    }),
  );
  await created.init();
  return created;
}

afterEach(async () => {
  await app.close();
});

describe('HttpExceptionFilter — express-openapi-validator errors', () => {
  it('a path the spec does not describe answers 404 problem+json', async () => {
    app = await buildApp();

    const res = await request(app.getHttpServer()).get('/api/v1/instance/config');

    expect(res.status).toBe(404);
    expect(res.headers['content-type']).toContain('application/problem+json');
    expect(res.body).toMatchObject({
      status: 404,
      title: 'Not Found',
      instance: '/api/v1/instance/config',
    });
  });

  it('a method the path does not define answers 405 problem+json with Allow', async () => {
    app = await buildApp();

    const res = await request(app.getHttpServer()).post('/api/v1/things').send({});

    expect(res.status).toBe(405);
    expect(res.headers['content-type']).toContain('application/problem+json');
    expect(res.headers['allow']).toContain('GET');
    expect(res.body).toMatchObject({ status: 405, title: 'Method Not Allowed' });
  });

  it('a known route still answers normally', async () => {
    app = await buildApp();

    await request(app.getHttpServer()).get('/api/v1/things').expect(200, { ok: true });
  });

  it('an error without an HTTP status is still a 500 — the narrowing must not over-match', async () => {
    app = await buildApp();

    const res = await request(app.getHttpServer()).get('/api/v1/things/boom');

    expect(res.status).toBe(500);
    expect(res.body).toMatchObject({ status: 500, title: 'Internal Server Error' });
  });
});
