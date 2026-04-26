/**
 * Controller-level tests for GET /api/v1/stream/lessons/:id
 *
 * Approach: boot a minimal NestJS test module that mounts only
 * StreamingController. All domain dependencies (StreamTokenSigner,
 * LessonFileLocator) are replaced with vi.fn() stubs. The HttpExceptionFilter
 * is registered so we can assert on RFC 9457 problem+json bodies.
 * SessionGuard is overridden with a pass-through stub so we don't need I18nModule.
 *
 * Fixture: a 1 024-byte deterministic file written to os.tmpdir() in beforeAll,
 * cleaned up in afterAll.
 *
 * Scenarios:
 *   1.  200 full file — no Range; Content-Type, Content-Length, Accept-Ranges.
 *   2.  206 single range bytes=0-9; Content-Range, body = first 10 bytes.
 *   3.  206 multi-range bytes=0-9,20-29; multipart/byteranges + correct slices.
 *   4.  416 unsatisfiable bytes=99999-.
 *   5.  400 invalid Range pages=0-9.
 *   6.  401 no token.
 *   7.  401 tampered token.
 *   8.  401 expired token.
 *   9.  404 unknown lesson (LessonNotFoundError).
 *   10. 500 path-escape (LessonFilePathEscapedError).
 */
import { unlinkSync, writeFileSync } from 'node:fs';
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
import { APP_FILTER } from '@nestjs/core';
import { CqrsModule, QueryBus } from '@nestjs/cqrs';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { HttpExceptionFilter } from '../../common/filters/http-exception.filter';
import { AuthService } from '../../common/auth/auth.service';
import { SessionGuard } from '../../common/auth/auth.guard';
import { LessonNotFoundError } from '../../common/catalog-tokens';
import { LessonFileLocator } from './domain/lesson-file-locator';
import { LessonFilePathEscapedError } from './domain/stream-token/stream-file.errors';
import { StreamTokenSigner } from './domain/stream-token/stream-token-signer';
import {
  StreamTokenExpiredError,
  StreamTokenTamperedError,
} from './domain/stream-token/stream-token.errors';
import { StreamingController } from './streaming.controller';

// ---------------------------------------------------------------------------
// Fixture
// ---------------------------------------------------------------------------

const FIXTURE_SIZE = 1024;
let FIXTURE_PATH: string;

// Deterministic content: bytes 0x00..0xFF repeated
function makeFixtureBuffer(): Buffer {
  const buf = Buffer.alloc(FIXTURE_SIZE);
  for (let i = 0; i < FIXTURE_SIZE; i++) {
    buf[i] = i % 256;
  }
  return buf;
}

let fixtureBytes: Buffer;

// ---------------------------------------------------------------------------
// Pass-through guard stub
// ---------------------------------------------------------------------------

@Injectable()
class PassThroughGuard implements CanActivate {
  canActivate(_ctx: ExecutionContext): boolean {
    return true;
  }
}

// ---------------------------------------------------------------------------
// Stub factories
// ---------------------------------------------------------------------------

function makeSignerStub(): StreamTokenSigner {
  return {
    sign: vi.fn(),
    verify: vi.fn().mockReturnValue({ userId: 'user-1', expiresAt: new Date(Date.now() + 60_000) }),
  } as unknown as StreamTokenSigner;
}

function makeLocatorStub(): LessonFileLocator {
  // Will be configured per-test via vi.mocked()
  return {
    locate: vi.fn().mockResolvedValue({
      absolutePath: '', // overridden after FIXTURE_PATH is set
      sizeBytes: FIXTURE_SIZE,
      libraryId: 'lib-1',
      courseId: 'course-1',
    }),
  } as unknown as LessonFileLocator;
}

// ---------------------------------------------------------------------------
// App factory
// ---------------------------------------------------------------------------

async function buildApp(
  signerStub: StreamTokenSigner,
  locatorStub: LessonFileLocator,
): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [CqrsModule],
    controllers: [StreamingController],
    providers: [
      { provide: APP_FILTER, useClass: HttpExceptionFilter },
      { provide: StreamTokenSigner, useValue: signerStub },
      { provide: LessonFileLocator, useValue: locatorStub },
      { provide: AuthService, useValue: { getSession: vi.fn() } },
      { provide: QueryBus, useValue: { execute: vi.fn() } },
    ],
  })
    .overrideGuard(SessionGuard)
    .useClass(PassThroughGuard)
    .compile();

  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI });
  await app.init();
  return app;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const VALID_TOKEN = 'valid.token.here';

function url(id = 'lesson-1', token: string | null = VALID_TOKEN): string {
  return token === null
    ? `/api/v1/stream/lessons/${id}`
    : `/api/v1/stream/lessons/${id}?token=${encodeURIComponent(token)}`;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('StreamingController — GET /api/v1/stream/lessons/:id', () => {
  beforeAll(() => {
    FIXTURE_PATH = path.join(os.tmpdir(), `stream-fixture-${process.pid}.mp4`);
    fixtureBytes = makeFixtureBuffer();
    writeFileSync(FIXTURE_PATH, fixtureBytes);
  });

  afterAll(() => {
    try {
      unlinkSync(FIXTURE_PATH);
    } catch {
      // ignore cleanup errors
    }
  });

  // -------------------------------------------------------------------------
  // 200 — full file
  // -------------------------------------------------------------------------
  it('200 full file — returns Content-Type, Content-Length, Accept-Ranges', async () => {
    const signer = makeSignerStub();
    const locator = makeLocatorStub();
    vi.mocked(locator.locate).mockResolvedValue({
      absolutePath: FIXTURE_PATH,
      sizeBytes: FIXTURE_SIZE,
      libraryId: 'lib-1',
      courseId: 'course-1',
    });

    const app = await buildApp(signer, locator);

    const res = await request(app.getHttpServer()).get(url()).buffer(true).parse(binaryParser);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('video/mp4');
    expect(Number.parseInt(res.headers['content-length'] as string, 10)).toBe(FIXTURE_SIZE);
    expect(res.headers['accept-ranges']).toBe('bytes');
    expect(Buffer.compare(res.body as Buffer, fixtureBytes)).toBe(0);

    await app.close();
  });

  // -------------------------------------------------------------------------
  // 206 single range
  // -------------------------------------------------------------------------
  it('206 single range bytes=0-9 — correct Content-Range and body slice', async () => {
    const signer = makeSignerStub();
    const locator = makeLocatorStub();
    vi.mocked(locator.locate).mockResolvedValue({
      absolutePath: FIXTURE_PATH,
      sizeBytes: FIXTURE_SIZE,
      libraryId: 'lib-1',
      courseId: 'course-1',
    });

    const app = await buildApp(signer, locator);

    const res = await request(app.getHttpServer())
      .get(url())
      .set('Range', 'bytes=0-9')
      .buffer(true)
      .parse(binaryParser);

    expect(res.status).toBe(206);
    expect(res.headers['content-range']).toBe(`bytes 0-9/${FIXTURE_SIZE}`);
    expect(Number.parseInt(res.headers['content-length'] as string, 10)).toBe(10);
    const body = res.body as Buffer;
    expect(body.length).toBe(10);
    expect(Buffer.compare(body, fixtureBytes.subarray(0, 10))).toBe(0);

    await app.close();
  });

  // -------------------------------------------------------------------------
  // 206 multi-range
  // -------------------------------------------------------------------------
  it('206 multi-range bytes=0-9,20-29 — multipart/byteranges with correct slices', async () => {
    const signer = makeSignerStub();
    const locator = makeLocatorStub();
    vi.mocked(locator.locate).mockResolvedValue({
      absolutePath: FIXTURE_PATH,
      sizeBytes: FIXTURE_SIZE,
      libraryId: 'lib-1',
      courseId: 'course-1',
    });

    const app = await buildApp(signer, locator);

    const res = await request(app.getHttpServer())
      .get(url())
      .set('Range', 'bytes=0-9,20-29')
      .buffer(true)
      .parse(binaryParser);

    expect(res.status).toBe(206);
    expect(res.headers['content-type']).toContain('multipart/byteranges');

    const bodyStr = (res.body as Buffer).toString('binary');
    // Both byte slices must appear in the response body.
    const slice1 = fixtureBytes.subarray(0, 10).toString('binary');
    const slice2 = fixtureBytes.subarray(20, 30).toString('binary');
    expect(bodyStr).toContain(slice1);
    expect(bodyStr).toContain(slice2);
    // Content-Range headers for each part.
    expect(bodyStr).toContain(`bytes 0-9/${FIXTURE_SIZE}`);
    expect(bodyStr).toContain(`bytes 20-29/${FIXTURE_SIZE}`);

    await app.close();
  });

  // -------------------------------------------------------------------------
  // 416 unsatisfiable
  // -------------------------------------------------------------------------
  it('416 when Range is entirely out of bounds (bytes=99999-)', async () => {
    const signer = makeSignerStub();
    const locator = makeLocatorStub();
    vi.mocked(locator.locate).mockResolvedValue({
      absolutePath: FIXTURE_PATH,
      sizeBytes: FIXTURE_SIZE,
      libraryId: 'lib-1',
      courseId: 'course-1',
    });

    const app = await buildApp(signer, locator);

    const res = await request(app.getHttpServer()).get(url()).set('Range', 'bytes=99999-');

    expect(res.status).toBe(416);
    expect(res.headers['content-range']).toBe(`bytes */${FIXTURE_SIZE}`);

    await app.close();
  });

  // -------------------------------------------------------------------------
  // 400 invalid Range
  // -------------------------------------------------------------------------
  it('400 when Range header has wrong unit (pages=0-9)', async () => {
    const signer = makeSignerStub();
    const locator = makeLocatorStub();
    vi.mocked(locator.locate).mockResolvedValue({
      absolutePath: FIXTURE_PATH,
      sizeBytes: FIXTURE_SIZE,
      libraryId: 'lib-1',
      courseId: 'course-1',
    });

    const app = await buildApp(signer, locator);

    const res = await request(app.getHttpServer()).get(url()).set('Range', 'pages=0-9');

    expect(res.status).toBe(400);

    await app.close();
  });

  // -------------------------------------------------------------------------
  // 401 — no token
  // -------------------------------------------------------------------------
  it('401 when token query param is absent', async () => {
    const signer = makeSignerStub();
    const locator = makeLocatorStub();
    const app = await buildApp(signer, locator);

    const res = await request(app.getHttpServer()).get(url('lesson-1', null));

    expect(res.status).toBe(401);

    await app.close();
  });

  // -------------------------------------------------------------------------
  // 401 — tampered token
  // -------------------------------------------------------------------------
  it('401 when token is tampered', async () => {
    const signer = makeSignerStub();
    vi.mocked(signer.verify).mockImplementation(() => {
      throw new StreamTokenTamperedError();
    });
    const locator = makeLocatorStub();
    const app = await buildApp(signer, locator);

    const res = await request(app.getHttpServer()).get(url('lesson-1', 'tampered.tok.en'));

    expect(res.status).toBe(401);

    await app.close();
  });

  // -------------------------------------------------------------------------
  // 401 — expired token
  // -------------------------------------------------------------------------
  it('401 when token is expired', async () => {
    const signer = makeSignerStub();
    vi.mocked(signer.verify).mockImplementation(() => {
      throw new StreamTokenExpiredError();
    });
    const locator = makeLocatorStub();
    const app = await buildApp(signer, locator);

    const res = await request(app.getHttpServer()).get(url('lesson-1', 'expired.tok.en'));

    expect(res.status).toBe(401);

    await app.close();
  });

  // -------------------------------------------------------------------------
  // 404 — unknown lesson
  // -------------------------------------------------------------------------
  it('404 when lesson is not found', async () => {
    const signer = makeSignerStub();
    const locator = makeLocatorStub();
    vi.mocked(locator.locate).mockRejectedValue(new LessonNotFoundError('lesson-missing'));
    const app = await buildApp(signer, locator);

    const res = await request(app.getHttpServer()).get(url('lesson-missing'));

    expect(res.status).toBe(404);
    expect(res.headers['content-type']).toContain('application/problem+json');

    await app.close();
  });

  // -------------------------------------------------------------------------
  // 500 — path escape
  // -------------------------------------------------------------------------
  it('500 when LessonFilePathEscapedError is thrown', async () => {
    const signer = makeSignerStub();
    const locator = makeLocatorStub();
    vi.mocked(locator.locate).mockRejectedValue(new LessonFilePathEscapedError('lesson-evil'));
    const app = await buildApp(signer, locator);

    const res = await request(app.getHttpServer()).get(url('lesson-evil'));

    expect(res.status).toBe(500);
    expect(res.headers['content-type']).toContain('application/problem+json');
    expect((res.body as Record<string, unknown>)['code']).toBe('lesson-file-path-escaped');

    await app.close();
  });
});

// ---------------------------------------------------------------------------
// Binary response parser for supertest
// ---------------------------------------------------------------------------

function binaryParser(
  res: supertest.Response,
  callback: (err: Error | null, data: Buffer) => void,
): void {
  // res is a superagent Response which extends IncomingMessage, so it has
  // the stream event API.
  const incoming = res as unknown as IncomingMessage;
  const chunks: Buffer[] = [];
  incoming.on('data', (chunk: Buffer) => chunks.push(chunk));
  incoming.on('end', () => callback(null, Buffer.concat(chunks)));
  incoming.on('error', (err: Error) => callback(err, Buffer.alloc(0)));
}
