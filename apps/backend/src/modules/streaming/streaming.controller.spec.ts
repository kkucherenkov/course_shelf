/**
 * Controller-level tests for GET /api/v1/stream/lessons/:id
 *                         and GET /api/v1/stream/lessons/:id/subtitles/:language
 *                         and GET /api/v1/lessons/:lessonId/materials/:materialId/download-url
 *                         and GET /api/v1/stream/materials/:materialId
 *
 * Approach: boot a minimal NestJS test module that mounts only
 * StreamingController. All domain dependencies (StreamTokenSigner,
 * LessonFileLocator) are replaced with vi.fn() stubs. The HttpExceptionFilter
 * is registered so we can assert on RFC 9457 problem+json bodies.
 * PassThroughGuard is registered as APP_GUARD so @Session() receives a fake user session.
 *
 * Fixture: a 1 024-byte deterministic file written to os.tmpdir() in beforeAll,
 * cleaned up in afterAll. A separate PDF fixture for material download tests.
 *
 * Video scenarios:
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
 *
 * Subtitle scenarios (E08-F02-S02):
 *   11. 200 VTT pass-through — body matches source, Content-Type: text/vtt.
 *   12. 200 SRT conversion — body starts with WEBVTT, timestamps use dot.
 *   13. Cache hit on second request — file is served from .cache.vtt sibling.
 *   14. 404 unknown language — SubtitleNotFoundError.
 *   15. 401 bad token on subtitle route.
 *
 * Material download-url scenarios:
 *   16. 200 issueMaterialDownloadUrl — returns MaterialDownloadUrlDto from QueryBus.
 *
 * Material stream scenarios:
 *   17. 200 getMaterialStream — Content-Type application/pdf, Content-Disposition attachment.
 *   18. 200 getMaterialStream — CORP cross-origin header is set.
 *   19. 200 getMaterialStream — Content-Disposition filename includes the label.
 *   20. 401 no token on material stream.
 *   21. 401 tampered token on material stream.
 *   22. 404 missing material (MaterialNotFoundError) on stream.
 */
import { unlinkSync, writeFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
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
import { CqrsModule, QueryBus } from '@nestjs/cqrs';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { HttpExceptionFilter } from '../../common/filters/http-exception.filter';
import { AuthService } from '../../common/auth/auth.service';
import { LessonNotFoundError } from '../../common/catalog-tokens';
import { LessonFileLocator } from './domain/lesson-file-locator';
import {
  LessonFilePathEscapedError,
  MaterialNotFoundError,
  SubtitleNotFoundError,
} from './domain/stream-token/stream-file.errors';
import { StreamTokenSigner } from './domain/stream-token/stream-token-signer';
import {
  StreamTokenExpiredError,
  StreamTokenTamperedError,
} from './domain/stream-token/stream-token.errors';
import { StreamingController } from './streaming.controller';

import type { MaterialDownloadUrlDto } from '@app/api-client-ts';

// ---------------------------------------------------------------------------
// Fixture
// ---------------------------------------------------------------------------

const FIXTURE_SIZE = 1024;
let FIXTURE_PATH: string;
let PDF_FIXTURE_PATH: string;

// Subtitle fixtures
let VTT_FIXTURE_PATH: string;
let SRT_FIXTURE_PATH: string;
const VTT_CONTENT = 'WEBVTT\n\n00:00:01.500 --> 00:00:04.000\nHello VTT\n';
const SRT_CONTENT = '1\n00:00:01,500 --> 00:00:04,000\nHello SRT\n';

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
// Pass-through guard stub — also injects a fake session so @Session() works.
// ---------------------------------------------------------------------------

@Injectable()
class PassThroughGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<Record<string, unknown>>();
    // Inject a fake session so the @Session() param decorator does not throw.
    req['session'] = { user: { id: 'user-1', role: 'user' } };
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
    signMaterial: vi.fn(),
    verifyMaterial: vi.fn().mockReturnValue({
      userId: 'user-1',
      lessonId: 'lesson-1',
      expiresAt: new Date(Date.now() + 60_000),
    }),
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
    locateSubtitle: vi.fn().mockResolvedValue({
      absolutePath: '', // overridden per-test
      extension: '.vtt',
      courseId: 'course-1',
      libraryId: 'lib-1',
    }),
    locateMaterial: vi.fn().mockResolvedValue({
      absolutePath: '', // overridden per-test
      sizeBytes: 512,
      label: 'Lesson Notes',
      kind: 'doc',
      courseId: 'course-1',
      libraryId: 'lib-1',
    }),
  } as unknown as LessonFileLocator;
}

// ---------------------------------------------------------------------------
// App factory
// ---------------------------------------------------------------------------

async function buildApp(
  signerStub: StreamTokenSigner,
  locatorStub: LessonFileLocator,
  queryBusExecute?: ReturnType<typeof vi.fn>,
): Promise<INestApplication> {
  // SessionGuard is registered as APP_GUARD in the real app (not @UseGuards),
  // so overrideGuard() has no effect on it. Register PassThroughGuard as
  // APP_GUARD to inject req.session for @Session()-decorated routes.
  const moduleRef = await Test.createTestingModule({
    imports: [CqrsModule],
    controllers: [StreamingController],
    providers: [
      { provide: APP_FILTER, useClass: HttpExceptionFilter },
      { provide: APP_GUARD, useClass: PassThroughGuard },
      { provide: StreamTokenSigner, useValue: signerStub },
      { provide: LessonFileLocator, useValue: locatorStub },
      { provide: AuthService, useValue: { getSession: vi.fn() } },
      { provide: QueryBus, useValue: { execute: queryBusExecute ?? vi.fn() } },
    ],
  }).compile();

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

function subtitleUrl(id = 'lesson-1', lang = 'en', token: string | null = VALID_TOKEN): string {
  const base = `/api/v1/stream/lessons/${id}/subtitles/${lang}`;
  return token === null ? base : `${base}?token=${encodeURIComponent(token)}`;
}

function materialDownloadUrl(lessonId = 'lesson-1', materialId = 'mat-1'): string {
  return `/api/v1/lessons/${lessonId}/materials/${materialId}/download-url`;
}

function materialStreamUrl(materialId = 'mat-1', token: string | null = VALID_TOKEN): string {
  const base = `/api/v1/stream/materials/${materialId}`;
  return token === null ? base : `${base}?token=${encodeURIComponent(token)}`;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('StreamingController — GET /api/v1/stream/lessons/:id', () => {
  beforeAll(() => {
    FIXTURE_PATH = path.join(os.tmpdir(), `stream-fixture-${process.pid}.mp4`);
    fixtureBytes = makeFixtureBuffer();
    writeFileSync(FIXTURE_PATH, fixtureBytes);

    PDF_FIXTURE_PATH = path.join(os.tmpdir(), `material-fixture-${process.pid}.pdf`);
    writeFileSync(PDF_FIXTURE_PATH, Buffer.from('%PDF-1.4 fixture content'));

    VTT_FIXTURE_PATH = path.join(os.tmpdir(), `subtitle-fixture-${process.pid}.vtt`);
    SRT_FIXTURE_PATH = path.join(os.tmpdir(), `subtitle-fixture-${process.pid}.srt`);
    writeFileSync(VTT_FIXTURE_PATH, VTT_CONTENT, 'utf8');
    writeFileSync(SRT_FIXTURE_PATH, SRT_CONTENT, 'utf8');
  });

  afterAll(() => {
    for (const p of [
      FIXTURE_PATH,
      PDF_FIXTURE_PATH,
      VTT_FIXTURE_PATH,
      SRT_FIXTURE_PATH,
      `${SRT_FIXTURE_PATH.slice(0, -4)}.cache.vtt`,
    ]) {
      try {
        unlinkSync(p);
      } catch {
        // ignore cleanup errors
      }
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

  // =========================================================================
  // Subtitle route (E08-F02-S02)
  // =========================================================================

  // -------------------------------------------------------------------------
  // 200 VTT pass-through
  // -------------------------------------------------------------------------
  it('subtitle 200 VTT pass-through — Content-Type: text/vtt, body matches source', async () => {
    const signer = makeSignerStub();
    const locator = makeLocatorStub();
    vi.mocked(locator.locateSubtitle).mockResolvedValue({
      absolutePath: VTT_FIXTURE_PATH,
      extension: '.vtt',
      courseId: 'course-1',
      libraryId: 'lib-1',
    });

    const app = await buildApp(signer, locator);

    const res = await request(app.getHttpServer()).get(subtitleUrl());

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/vtt');
    expect(res.text).toBe(VTT_CONTENT);

    await app.close();
  });

  // -------------------------------------------------------------------------
  // 200 SRT conversion
  // -------------------------------------------------------------------------
  it('subtitle 200 SRT conversion — body starts with WEBVTT, timestamps use dot', async () => {
    const signer = makeSignerStub();
    const locator = makeLocatorStub();
    vi.mocked(locator.locateSubtitle).mockResolvedValue({
      absolutePath: SRT_FIXTURE_PATH,
      extension: '.srt',
      courseId: 'course-1',
      libraryId: 'lib-1',
    });

    const app = await buildApp(signer, locator);

    const res = await request(app.getHttpServer()).get(subtitleUrl('lesson-1', 'ru'));

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/vtt');
    expect(res.text.startsWith('WEBVTT')).toBe(true);
    expect(res.text).toContain('00:00:01.500 --> 00:00:04.000');
    expect(res.text).not.toContain('00:00:01,500');

    await app.close();
  });

  // -------------------------------------------------------------------------
  // Cache hit on second request
  // -------------------------------------------------------------------------
  it('subtitle cache hit — second SRT request reads from .cache.vtt sibling', async () => {
    const signer = makeSignerStub();
    const locator = makeLocatorStub();
    vi.mocked(locator.locateSubtitle).mockResolvedValue({
      absolutePath: SRT_FIXTURE_PATH,
      extension: '.srt',
      courseId: 'course-1',
      libraryId: 'lib-1',
    });

    const app = await buildApp(signer, locator);

    // First request — generates the cache.
    await request(app.getHttpServer()).get(subtitleUrl('lesson-1', 'ru'));

    // Verify the cache was written.
    const cachePath = `${SRT_FIXTURE_PATH.slice(0, -4)}.cache.vtt`;
    const cacheContent = await readFile(cachePath, 'utf8');
    expect(cacheContent.startsWith('WEBVTT')).toBe(true);

    // Second request — should serve the cache (body is identical).
    const res2 = await request(app.getHttpServer()).get(subtitleUrl('lesson-1', 'ru'));
    expect(res2.status).toBe(200);
    expect(res2.text).toBe(cacheContent);

    await app.close();
  });

  // -------------------------------------------------------------------------
  // 404 unknown language
  // -------------------------------------------------------------------------
  it('subtitle 404 when language is not found', async () => {
    const signer = makeSignerStub();
    const locator = makeLocatorStub();
    vi.mocked(locator.locateSubtitle).mockRejectedValue(
      new SubtitleNotFoundError('lesson-1', 'fr'),
    );

    const app = await buildApp(signer, locator);

    const res = await request(app.getHttpServer()).get(subtitleUrl('lesson-1', 'fr'));

    expect(res.status).toBe(404);
    expect(res.headers['content-type']).toContain('application/problem+json');
    expect((res.body as Record<string, unknown>)['code']).toBe('subtitle-not-found');

    await app.close();
  });

  // -------------------------------------------------------------------------
  // 401 bad token on subtitle route
  // -------------------------------------------------------------------------
  it('subtitle 401 when token is absent', async () => {
    const signer = makeSignerStub();
    const locator = makeLocatorStub();
    const app = await buildApp(signer, locator);

    const res = await request(app.getHttpServer()).get(subtitleUrl('lesson-1', 'en', null));

    expect(res.status).toBe(401);

    await app.close();
  });

  it('subtitle 401 when token is tampered', async () => {
    const signer = makeSignerStub();
    vi.mocked(signer.verify).mockImplementation(() => {
      throw new StreamTokenTamperedError();
    });
    const locator = makeLocatorStub();
    const app = await buildApp(signer, locator);

    const res = await request(app.getHttpServer()).get(subtitleUrl('lesson-1', 'en', 'bad.tok.en'));

    expect(res.status).toBe(401);

    await app.close();
  });

  // =========================================================================
  // Material download-url route
  // =========================================================================

  it('issueMaterialDownloadUrl 200 — returns MaterialDownloadUrlDto from QueryBus', async () => {
    const signer = makeSignerStub();
    const locator = makeLocatorStub();
    const dto: MaterialDownloadUrlDto = {
      url: '/api/v1/stream/materials/mat-1?token=tok',
      token: 'tok',
      expiresAt: new Date(Date.now() + 300_000).toISOString(),
    };
    const queryBusExecute = vi.fn().mockResolvedValue(dto);
    const app = await buildApp(signer, locator, queryBusExecute);

    const res = await request(app.getHttpServer()).get(materialDownloadUrl());

    expect(res.status).toBe(200);
    expect((res.body as MaterialDownloadUrlDto).url).toBe(dto.url);
    expect((res.body as MaterialDownloadUrlDto).token).toBe(dto.token);

    await app.close();
  });

  // =========================================================================
  // Material stream route
  // =========================================================================

  it('getMaterialStream 200 — Content-Type application/pdf, CORP cross-origin, Content-Disposition with label', async () => {
    const signer = makeSignerStub();
    const locator = makeLocatorStub();
    const PDF_CONTENT = Buffer.from('%PDF-1.4 fixture content');
    vi.mocked(locator.locateMaterial).mockResolvedValue({
      absolutePath: PDF_FIXTURE_PATH,
      sizeBytes: PDF_CONTENT.length, // must match actual file size for Content-Length to be correct
      label: 'Lesson Notes',
      kind: 'doc',
      courseId: 'course-1',
      libraryId: 'lib-1',
    });

    const app = await buildApp(signer, locator);

    // Use .buffer(true).parse(binaryParser) so supertest fully consumes the
    // binary (application/pdf) response before resolving. Without buffering,
    // supertest closes the socket after reading headers, which causes
    // pipeline() on the server side to see "aborted" and reject.
    const res = await request(app.getHttpServer())
      .get(materialStreamUrl())
      .buffer(true)
      .parse(binaryParser);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/pdf');
    expect(res.headers['cross-origin-resource-policy']).toBe('cross-origin');
    expect(res.headers['content-disposition']).toContain('attachment');
    expect(res.headers['content-disposition']).toContain('Lesson Notes');

    await app.close();
  });

  it('getMaterialStream 401 when token is absent', async () => {
    const signer = makeSignerStub();
    const locator = makeLocatorStub();
    const app = await buildApp(signer, locator);

    const res = await request(app.getHttpServer()).get(materialStreamUrl('mat-1', null));

    expect(res.status).toBe(401);

    await app.close();
  });

  it('getMaterialStream 401 when token is tampered', async () => {
    const signer = makeSignerStub();
    vi.mocked(signer.verifyMaterial).mockImplementation(() => {
      throw new StreamTokenTamperedError();
    });
    const locator = makeLocatorStub();
    const app = await buildApp(signer, locator);

    const res = await request(app.getHttpServer()).get(
      materialStreamUrl('mat-1', 'tampered.tok.en'),
    );

    expect(res.status).toBe(401);

    await app.close();
  });

  it('getMaterialStream 404 when MaterialNotFoundError is thrown', async () => {
    const signer = makeSignerStub();
    const locator = makeLocatorStub();
    vi.mocked(locator.locateMaterial).mockRejectedValue(
      new MaterialNotFoundError('lesson-1', 'mat-missing'),
    );

    const app = await buildApp(signer, locator);

    const res = await request(app.getHttpServer()).get(materialStreamUrl('mat-missing'));

    expect(res.status).toBe(404);
    expect(res.headers['content-type']).toContain('application/problem+json');
    expect((res.body as Record<string, unknown>)['code']).toBe('material-not-found');

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
