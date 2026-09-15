/**
 * Tests for HttpExceptionFilter.
 *
 * Two concerns, both exercised through the real filter and a real Nest app
 * rather than deduced from reading the source:
 *
 * 1. Errors raised *outside* the Nest pipeline. `express-openapi-validator`
 *    is mounted with `app.use('/api', …)`, so it runs ahead of the Nest
 *    router and rejects an unknown path / a method the path does not define
 *    by calling `next(err)` with its own `HttpError`. Nest's express error
 *    handler funnels that into the global filter, where it used to miss both
 *    the `DomainError` and the `HttpException` branch and come out as a 500.
 *
 * 2. A Nest `HttpException` built from an object (`new BadRequestException({
 *    code, detail })`, the shape every controller in this codebase uses).
 *    `HttpException.getResponse()` returns that object verbatim — Nest does
 *    not add `message`/`error`/`statusCode` to a caller-supplied object — but
 *    the filter used to read only `obj.message` / `obj.error`, so `code` and
 *    `detail` were silently dropped and the response came out as a bare
 *    `about:blank` 400 (#479).
 *
 * The test boots the real middleware against a small inline document rather
 * than the bundled spec: `packages/specs/dist/openapi.json` is a build
 * artefact and is not committed, so depending on it would make this suite
 * order-dependent on `pnpm spec:bundle`.
 */
import {
  ArgumentsHost,
  BadRequestException,
  Controller,
  Get,
  INestApplication,
  Logger,
  VersioningType,
} from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import express from 'express';
import * as OpenApiValidator from 'express-openapi-validator';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { Request, Response } from 'express';

import { LibraryUpdateEmptyError } from '../../modules/catalog/domain/library/library.errors';

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
    '/api/v1/things/bad-request': { get: jsonOk },
    '/api/v1/things/domain-bad-request': { get: jsonOk },
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

  // Mirrors `courses.controller.ts`'s rating-fields-must-be-paired check —
  // the exact shape (#479) that lost `code`/`detail` on the way out.
  @Get('bad-request')
  badRequest(): never {
    throw new BadRequestException({
      code: 'rating-fields-must-be-paired',
      detail: 'ratingAverage and ratingCount must be supplied together (or both omitted).',
    });
  }

  // A real `DomainError` at the same 400 status, for comparison: this one
  // never lost its `code`/`detail` — the bug was specific to the
  // `HttpException` branch.
  @Get('domain-bad-request')
  domainBadRequest(): never {
    throw new LibraryUpdateEmptyError();
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

describe('HttpExceptionFilter — HttpException built from an object (#479)', () => {
  it('a BadRequestException built from an object keeps code and detail', async () => {
    app = await buildApp();

    const res = await request(app.getHttpServer()).get('/api/v1/things/bad-request');

    expect(res.status).toBe(400);
    expect(res.headers['content-type']).toContain('application/problem+json');
    expect(res.body).toMatchObject({
      status: 400,
      title: 'Bad Request',
      code: 'rating-fields-must-be-paired',
      detail: 'ratingAverage and ratingCount must be supplied together (or both omitted).',
    });
  });

  it('matches the shape of a real DomainError at the same 400 status', async () => {
    app = await buildApp();

    const httpExceptionRes = await request(app.getHttpServer()).get('/api/v1/things/bad-request');
    const domainErrorRes = await request(app.getHttpServer()).get(
      '/api/v1/things/domain-bad-request',
    );

    expect(domainErrorRes.body).toMatchObject({
      status: 400,
      title: 'Bad Request',
      code: 'library-update-empty',
      detail: 'At least one of `name` must be provided.',
    });
    // Both carry `code` and `detail` alongside the RFC 9457 baseline —
    // the client can no longer tell a controller-thrown BadRequestException
    // apart from a DomainError by which fields are missing.
    expect(Object.keys(httpExceptionRes.body).toSorted()).toEqual(
      Object.keys(domainErrorRes.body).toSorted(),
    );
  });
});

function fakeHost(response: Partial<Response>, request: Partial<Request>): ArgumentsHost {
  return {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => request,
    }),
  } as unknown as ArgumentsHost;
}

// #556 — a browser aborting a range request mid-stream (a seek, a tab close)
// surfaces as ERR_STREAM_PREMATURE_CLOSE after the stream route has already
// sent status + headers. The filter used to write to that response anyway
// and throw ERR_HTTP_HEADERS_SENT on top. Exercised directly against
// `catch()` — booting a real streaming route just to abort it mid-flight
// buys nothing a mocked `Response` doesn't already prove.
describe('HttpExceptionFilter — response already closed (#556)', () => {
  it('does not write to a response whose headers are already sent, and logs "client disconnected"', () => {
    const filter = new HttpExceptionFilter();
    const setHeader = vi.fn();
    const status = vi.fn();
    const type = vi.fn();
    const send = vi.fn();
    const response: Partial<Response> = {
      headersSent: true,
      setHeader: setHeader as unknown as Response['setHeader'],
      status: status.mockReturnThis() as unknown as Response['status'],
      type: type.mockReturnThis() as unknown as Response['type'],
      send: send as unknown as Response['send'],
    };
    const request: Partial<Request> = {
      method: 'GET',
      originalUrl: '/api/v1/stream/lessons/abc123',
      url: '/api/v1/stream/lessons/abc123',
    };

    const warnSpy = vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    const errorSpy = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

    filter.catch(new Error('ERR_STREAM_PREMATURE_CLOSE'), fakeHost(response, request));

    expect(setHeader).not.toHaveBeenCalled();
    expect(status).not.toHaveBeenCalled();
    expect(type).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledExactlyOnceWith(expect.stringContaining('client disconnected'));

    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });
});
