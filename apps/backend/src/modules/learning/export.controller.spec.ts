/**
 * Controller-level integration tests for GET /api/v1/lessons/:lessonId/export
 * and GET /api/v1/courses/:courseId/export.
 *
 * Boots a minimal NestJS test module mounting only ExportController — same
 * approach as courses.controller.poster.spec.ts for the sibling binary
 * route. QueryBus is stubbed to return a canned ExportBundle; the test then
 * unzips the real bytes `streamZip` (real `yazl`) wrote onto the response
 * and checks the entries, covering the design's "one integration test
 * unpacking the stream" for both a lesson export and a course export.
 *
 * `readZipEntries` below is a from-scratch, read-only ZIP local-file-header
 * walker — not a new dependency. yazl's local headers embed exact sizes
 * (buffers are added synchronously with a known length, never streamed), so
 * a linear walk needs no central-directory lookup. It supports the two
 * compression methods yazl can emit (0 = stored, 8 = deflate); it is not a
 * general-purpose unzip.
 */
import { inflateRawSync } from 'node:zlib';
import type { IncomingMessage } from 'node:http';
import type supertest from 'supertest';

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
import { describe, expect, it, vi } from 'vitest';

import { HttpExceptionFilter } from '../../common/filters/http-exception.filter';
import { LessonNotFoundError } from '../../common/catalog-tokens';
import { ExportController } from './export.controller';

import type { ExportBundle } from './domain/export/export-bundle';

// ---------------------------------------------------------------------------
// Minimal ZIP reader (see file header)
// ---------------------------------------------------------------------------

interface ZipEntry {
  path: string;
  content: string;
}

function readZipEntries(buf: Buffer): ZipEntry[] {
  const LOCAL_FILE_HEADER_SIG = 0x04_03_4b_50;
  const entries: ZipEntry[] = [];
  let offset = 0;

  while (offset + 4 <= buf.length && buf.readUInt32LE(offset) === LOCAL_FILE_HEADER_SIG) {
    const method = buf.readUInt16LE(offset + 8);
    const compressedSize = buf.readUInt32LE(offset + 18);
    const nameLength = buf.readUInt16LE(offset + 26);
    const extraLength = buf.readUInt16LE(offset + 28);
    const nameStart = offset + 30;
    const name = buf.toString('utf8', nameStart, nameStart + nameLength);
    const dataStart = nameStart + nameLength + extraLength;
    const compressedData = buf.subarray(dataStart, dataStart + compressedSize);

    const content =
      method === 0
        ? compressedData.toString('utf8')
        : inflateRawSync(compressedData).toString('utf8');
    entries.push({ path: name, content });

    offset = dataStart + compressedSize;
  }

  return entries;
}

// ---------------------------------------------------------------------------
// Test harness
// ---------------------------------------------------------------------------

@Injectable()
class PassThroughGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<Record<string, unknown>>();
    req['session'] = { user: { id: 'user-1', role: 'user' } };
    return true;
  }
}

async function buildApp(queryBus: {
  execute: ReturnType<typeof vi.fn>;
}): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [CqrsModule],
    controllers: [ExportController],
    providers: [
      { provide: APP_FILTER, useClass: HttpExceptionFilter },
      { provide: APP_GUARD, useClass: PassThroughGuard },
      { provide: QueryBus, useValue: queryBus },
    ],
  }).compile();

  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI });
  await app.init();
  return app;
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

const LESSON_BUNDLE: ExportBundle = {
  files: [{ path: 'lesson.md', content: '# Intro\n\n[Open in course_shelf](http://x)\n' }],
  directories: ['images/'],
  suggestedFileName: 'intro.zip',
};

const COURSE_BUNDLE: ExportBundle = {
  files: [
    {
      path: 'course.md',
      content: '# Signals\n\n## Foundations\n\n- [Intro](lessons/01-intro.md)\n',
    },
    { path: 'lessons/01-intro.md', content: '# Intro\n\n[Open in course_shelf](http://x)\n' },
    { path: 'lessons/02-sampling.md', content: '# Sampling\n\n[Open in course_shelf](http://y)\n' },
  ],
  directories: ['images/'],
  suggestedFileName: 'signals.zip',
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ExportController', () => {
  describe('GET /api/v1/lessons/:lessonId/export', () => {
    it('streams a ZIP whose entries unpack back to the handler-returned bundle', async () => {
      const queryBus = { execute: vi.fn().mockResolvedValue(LESSON_BUNDLE) };
      const app = await buildApp(queryBus);

      const res = await request(app.getHttpServer())
        .get('/api/v1/lessons/lesson-1/export')
        .buffer(true)
        .parse(binaryParser);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe('application/zip');
      expect(res.headers['content-disposition']).toBe(
        'attachment; filename="intro.zip"; filename*=UTF-8\'\'intro.zip',
      );

      const entries = readZipEntries(res.body as Buffer);
      expect(entries.map((e) => e.path)).toEqual(['images/', 'lesson.md']);
      expect(entries.find((e) => e.path === 'lesson.md')?.content).toBe(
        LESSON_BUNDLE.files[0]?.content,
      );

      await app.close();
    });

    it('routes a domain error to HttpExceptionFilter instead of starting the stream', async () => {
      const queryBus = { execute: vi.fn().mockRejectedValue(new LessonNotFoundError('lesson-1')) };
      const app = await buildApp(queryBus);

      const res = await request(app.getHttpServer()).get('/api/v1/lessons/lesson-1/export');

      expect(res.status).toBe(404);
      expect(res.headers['content-type']).toContain('application/problem+json');

      await app.close();
    });
  });

  describe('GET /api/v1/courses/:courseId/export', () => {
    it('streams a ZIP with course.md plus every lessons/NN-slug.md entry', async () => {
      const queryBus = { execute: vi.fn().mockResolvedValue(COURSE_BUNDLE) };
      const app = await buildApp(queryBus);

      const res = await request(app.getHttpServer())
        .get('/api/v1/courses/course-1/export')
        .buffer(true)
        .parse(binaryParser);

      expect(res.status).toBe(200);
      expect(res.headers['content-disposition']).toBe(
        'attachment; filename="signals.zip"; filename*=UTF-8\'\'signals.zip',
      );

      const entries = readZipEntries(res.body as Buffer);
      expect(entries.map((e) => e.path)).toEqual([
        'images/',
        'course.md',
        'lessons/01-intro.md',
        'lessons/02-sampling.md',
      ]);
      expect(entries.find((e) => e.path === 'course.md')?.content).toContain('- [Intro]');
      expect(entries.find((e) => e.path === 'lessons/02-sampling.md')?.content).toContain(
        '# Sampling',
      );

      await app.close();
    });
  });
});
