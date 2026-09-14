/**
 * Controller-level tests for GET /api/v1/courses/:id/poster (#496).
 *
 * Boots a minimal NestJS test module mounting only CoursesController, with
 * CommandBus/QueryBus/CoursePosterLocator/CoursePosterTokenSigner replaced by
 * vi.fn() stubs — same approach as streaming.controller.spec.ts for the
 * sibling binary routes.
 *
 * Scenarios:
 *   1. 200 — Content-Type, Content-Length, CORP, body matches the fixture.
 *   2. 401 — token query param absent.
 *   3. 401 — CoursePosterTokenSigner.verify() throws (tampered/expired/mismatch).
 *   4. 404 — CoursePosterLocator.locate() throws CourseNotFoundError.
 *   5. 404 — CoursePosterLocator.locate() throws CoursePosterNotFoundError.
 */
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import type { IncomingMessage } from 'node:http';
import type supertest from 'supertest';
import os from 'node:os';
import path from 'node:path';

import {
  CanActivate,
  ExecutionContext,
  INestApplication,
  Injectable,
  VersioningType,
} from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { CommandBus, CqrsModule, QueryBus } from '@nestjs/cqrs';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { HttpExceptionFilter } from '../../common/filters/http-exception.filter';
import { AuthService } from '../../common/auth/auth.service';
import { AdminGuard } from '../../common/auth/admin.guard';
import { CoursesController } from './courses.controller';
import { CoursePosterLocator } from './domain/course/course-poster-locator';
import { CoursePosterTokenSigner } from './domain/course/course-poster-token';
import {
  CoursePosterNotFoundError,
  CoursePosterTokenTamperedError,
  CourseNotFoundError,
} from './domain/course/course.errors';

// ---------------------------------------------------------------------------
// Fixture
// ---------------------------------------------------------------------------

let FIXTURE_DIR: string;
let FIXTURE_PATH: string;
const FIXTURE_BYTES = Buffer.from('fake-jpeg-bytes');

beforeAll(() => {
  FIXTURE_DIR = mkdtempSync(path.join(os.tmpdir(), 'poster-fixtures-'));
  FIXTURE_PATH = path.join(FIXTURE_DIR, 'poster.jpg');
  writeFileSync(FIXTURE_PATH, FIXTURE_BYTES);
});

afterAll(() => {
  rmSync(FIXTURE_DIR, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// Pass-through guard — injects a fake session for @Session()-decorated routes.
// ---------------------------------------------------------------------------

@Injectable()
class PassThroughGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<Record<string, unknown>>();
    req['session'] = { user: { id: 'user-1', role: 'user' } };
    return true;
  }
}

// ---------------------------------------------------------------------------
// Stub factories
// ---------------------------------------------------------------------------

function makeSignerStub(): CoursePosterTokenSigner {
  return {
    sign: vi.fn(),
    signUrl: vi.fn(),
    verify: vi.fn().mockReturnValue({ expiresAt: new Date(Date.now() + 60_000) }),
  } as unknown as CoursePosterTokenSigner;
}

function makeLocatorStub(): CoursePosterLocator {
  return {
    locate: vi
      .fn()
      .mockResolvedValue({ absolutePath: FIXTURE_PATH, sizeBytes: FIXTURE_BYTES.length }),
  } as unknown as CoursePosterLocator;
}

async function buildApp(
  signerStub: CoursePosterTokenSigner,
  locatorStub: CoursePosterLocator,
): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [CqrsModule],
    controllers: [CoursesController],
    providers: [
      { provide: APP_FILTER, useClass: HttpExceptionFilter },
      { provide: APP_GUARD, useClass: PassThroughGuard },
      { provide: CoursePosterTokenSigner, useValue: signerStub },
      { provide: CoursePosterLocator, useValue: locatorStub },
      { provide: AuthService, useValue: { getSession: vi.fn() } },
      { provide: CommandBus, useValue: { execute: vi.fn() } },
      { provide: QueryBus, useValue: { execute: vi.fn() } },
    ],
  })
    // AdminGuard is referenced by @UseGuards on other CoursesController routes
    // (PATCH, rescan, transcription) — Nest resolves it via guard metadata,
    // not constructor injection, so a plain `providers: [{ provide, useValue }]`
    // entry does not satisfy it; overrideGuard is the supported mechanism.
    .overrideGuard(AdminGuard)
    .useValue({ canActivate: () => true })
    .compile();

  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI });
  await app.init();
  return app;
}

function url(id = 'course-1', token: string | null = 'valid.tok.en'): string {
  const base = `/api/v1/courses/${id}/poster`;
  return token === null ? base : `${base}?token=${encodeURIComponent(token)}`;
}

function binaryParser(
  res: supertest.Response,
  callback: (err: Error | null, data: Buffer) => void,
): void {
  const incoming = res as unknown as IncomingMessage;
  const chunks: Buffer[] = [];
  incoming.on('data', (chunk: Buffer) => chunks.push(chunk));
  incoming.on('end', () => callback(null, Buffer.concat(chunks)));
  incoming.on('error', (err: Error) => callback(err, Buffer.alloc(0)));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CoursesController — GET /api/v1/courses/:id/poster', () => {
  it('200 — Content-Type, Content-Length, CORP, and the poster bytes', async () => {
    const signer = makeSignerStub();
    const locator = makeLocatorStub();
    const app = await buildApp(signer, locator);

    const res = await request(app.getHttpServer()).get(url()).buffer(true).parse(binaryParser);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('image/jpeg');
    expect(Number.parseInt(res.headers['content-length'] as string, 10)).toBe(FIXTURE_BYTES.length);
    expect(res.headers['cross-origin-resource-policy']).toBe('cross-origin');
    expect(Buffer.compare(res.body as Buffer, FIXTURE_BYTES)).toBe(0);
    expect(locator.locate).toHaveBeenCalledWith('course-1');
    expect(signer.verify).toHaveBeenCalledWith('valid.tok.en', 'course-1');

    await app.close();
  });

  it('401 — token query param absent', async () => {
    const app = await buildApp(makeSignerStub(), makeLocatorStub());

    const res = await request(app.getHttpServer()).get(url('course-1', null));

    expect(res.status).toBe(401);
    expect(res.headers['content-type']).toContain('application/problem+json');

    await app.close();
  });

  it('401 — CoursePosterTokenSigner.verify() throws (tampered)', async () => {
    const signer = makeSignerStub();
    vi.mocked(signer.verify).mockImplementation(() => {
      throw new CoursePosterTokenTamperedError();
    });
    const app = await buildApp(signer, makeLocatorStub());

    const res = await request(app.getHttpServer()).get(url('course-1', 'tampered.tok.en'));

    expect(res.status).toBe(401);

    await app.close();
  });

  it('404 — CoursePosterLocator throws CourseNotFoundError', async () => {
    const locator = makeLocatorStub();
    vi.mocked(locator.locate).mockRejectedValue(new CourseNotFoundError('course-missing'));
    const app = await buildApp(makeSignerStub(), locator);

    const res = await request(app.getHttpServer()).get(url('course-missing'));

    expect(res.status).toBe(404);
    expect(res.headers['content-type']).toContain('application/problem+json');

    await app.close();
  });

  it('404 — CoursePosterLocator throws CoursePosterNotFoundError (no stored poster)', async () => {
    const locator = makeLocatorStub();
    vi.mocked(locator.locate).mockRejectedValue(new CoursePosterNotFoundError('course-1'));
    const app = await buildApp(makeSignerStub(), locator);

    const res = await request(app.getHttpServer()).get(url());

    expect(res.status).toBe(404);

    await app.close();
  });
});
