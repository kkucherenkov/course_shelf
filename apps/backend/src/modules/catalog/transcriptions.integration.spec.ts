/**
 * WHY this file exists:
 * The handler spec proves the walk; this proves the HTTP boundary the eight
 * cards behind this one will consume. Boots a minimal Nest app with the real
 * controllers, the real handlers, in-memory ports, and the HttpExceptionFilter,
 * then drives it with supertest.
 *
 * Covers:
 *   1. POST /api/v1/libraries/{id}/transcriptions → 202 + TranscriptionDto
 *   2. The same POST with no model configured → 503 problem+json, matching the
 *      one failure status the contract documents for an unusable engine
 *   3. The same POST while a run is going → 409 problem+json
 *   4. GET .../latest → 200, and 404 before anything has run
 *   5. GET .../transcriptions → 200 with the history
 *   6. POST /api/v1/transcriptions/{id}/cancel → 202, and 409 once terminal
 *
 * The route shapes are the point: `setGlobalPrefix('api')` + URI versioning is
 * what turns `libraries/:id/transcriptions` into `/api/v1/...`, and getting that
 * wrong is invisible to a unit spec.
 */
import {
  CanActivate,
  ExecutionContext,
  INestApplication,
  Injectable,
  VersioningType,
} from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { CqrsModule } from '@nestjs/cqrs';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AdminGuard } from '../../common/auth/admin.guard';
import { CentrifugoService } from '../../common/centrifugo/centrifugo.service';
import { AppConfig } from '../../common/config/app-config';
import { HttpExceptionFilter } from '../../common/filters/http-exception.filter';
import { CancelTranscriptionHandler } from './application/commands/cancel-transcription.handler';
import { RunTranscriptionHandler } from './application/commands/run-transcription.handler';
import { GetLatestTranscriptionHandler } from './application/queries/get-latest-transcription.handler';
import { ListTranscriptionsHandler } from './application/queries/list-transcriptions.handler';
import { COURSE_REPOSITORY } from './domain/course/course.repository';
import { LESSON_REPOSITORY } from './domain/lesson/lesson.repository';
import { LIBRARY_REPOSITORY } from './domain/library/library.repository';
import { Library } from './domain/library/library';
import { FFMPEG_ADAPTER } from './domain/scan/ffmpeg-adapter';
import { Transcription } from './domain/transcription/transcription';
import { TRANSCRIPT_REPOSITORY } from './domain/transcription/transcript.repository';
import { TRANSCRIPTION_REPOSITORY } from './domain/transcription/transcription.repository';
import { WHISPER_ADAPTER } from './domain/transcription/whisper.port';
import { TranscriptionCancelController } from './transcription-cancel.controller';
import { TranscriptionsController } from './transcriptions.controller';

import type { TranscriptionRepository } from './domain/transcription/transcription.repository';

const LIBRARY_ID = 'lib-1';

@Injectable()
class PassThroughAdminGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<Record<string, unknown>>();
    req['userId'] = 'admin-user-1';
    // The @Session() decorator reads the request; a minimal shape is enough.
    req['session'] = { user: { id: 'admin-user-1', role: 'admin' }, sessionId: 's1' };
    return true;
  }
}

/** In-memory TranscriptionRepository — the only state these tests care about. */
function makeTranscriptionRepo(seed: Transcription[] = []): TranscriptionRepository {
  const store = new Map<string, Transcription>(seed.map((t) => [t.id, t]));
  return {
    save: vi.fn(async (t: Transcription) => {
      store.set(t.id, t);
    }),
    findById: vi.fn(async (id: string) => store.get(id) ?? null),
    findLatestForLibrary: vi.fn(
      async (libraryId: string) =>
        [...store.values()]
          .filter((t) => t.libraryId === libraryId)
          .toSorted((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
          .at(0) ?? null,
    ),
    findRunningForLibrary: vi.fn(
      async (libraryId: string) =>
        [...store.values()].find((t) => t.libraryId === libraryId && t.status === 'running') ??
        null,
    ),
    listForLibrary: vi.fn(async (libraryId: string, limit: number) =>
      [...store.values()].filter((t) => t.libraryId === libraryId).slice(0, limit),
    ),
  };
}

async function buildApp(options: {
  configured?: boolean;
  seedRuns?: Transcription[];
}): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [CqrsModule],
    controllers: [TranscriptionsController, TranscriptionCancelController],
    providers: [
      { provide: APP_FILTER, useClass: HttpExceptionFilter },
      RunTranscriptionHandler,
      CancelTranscriptionHandler,
      GetLatestTranscriptionHandler,
      ListTranscriptionsHandler,
      {
        provide: TRANSCRIPTION_REPOSITORY,
        useValue: makeTranscriptionRepo(options.seedRuns ?? []),
      },
      {
        provide: TRANSCRIPT_REPOSITORY,
        useValue: {
          findGeneratedForLessons: async () => new Map(),
          replaceGenerated: async () => undefined,
        },
      },
      {
        provide: LIBRARY_REPOSITORY,
        useValue: {
          findById: async (id: string) =>
            id === LIBRARY_ID
              ? Library.register({ id: LIBRARY_ID, name: 'Lib', rootPath: '/lib' })
              : null,
        },
      },
      // No courses → no lessons → the walk finishes immediately, which is what
      // these tests want: they are about the HTTP boundary, not the walk.
      { provide: COURSE_REPOSITORY, useValue: { findManyByLibrary: async () => [] } },
      { provide: LESSON_REPOSITORY, useValue: { findByCourse: async () => [] } },
      { provide: FFMPEG_ADAPTER, useValue: { extractAudio: async () => undefined } },
      { provide: WHISPER_ADAPTER, useValue: { transcribe: async () => ({ srtAbsolutePath: '' }) } },
      {
        provide: AppConfig,
        useValue: {
          derivedPath: '/derived',
          transcription: {
            whisperPath: 'whisper-cli',
            modelPath: options.configured === false ? '' : '/models/base.bin',
            timeoutMs: 1000,
            threads: 4,
            language: 'auto',
            configured: options.configured ?? true,
          },
        },
      },
      { provide: CentrifugoService, useValue: { publish: vi.fn().mockResolvedValue(undefined) } },
    ],
  })
    .overrideGuard(AdminGuard)
    .useValue(new PassThroughAdminGuard())
    .compile();

  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI });
  await app.init();
  return app;
}

describe('Transcription routes [integration]', () => {
  let app: INestApplication;

  afterEach(async () => {
    await app.close();
  });

  it('202 — POST starts a run and answers with the running aggregate', async () => {
    app = await buildApp({});

    const res = await request(app.getHttpServer())
      .post(`/api/v1/libraries/${LIBRARY_ID}/transcriptions`)
      .send({ force: true });

    expect(res.status).toBe(202);
    expect(res.body).toMatchObject({
      libraryId: LIBRARY_ID,
      status: 'running',
      force: true,
      lessonsTotal: 0,
      lessonsSkipped: 0,
      lessonsTranscribed: 0,
      lessonsFailed: 0,
      errors: [],
    });
    expect(typeof (res.body as { startedAt: string }).startedAt).toBe('string');
  });

  it('503 problem+json — POST with no whisper model configured', async () => {
    app = await buildApp({ configured: false });

    const res = await request(app.getHttpServer())
      .post(`/api/v1/libraries/${LIBRARY_ID}/transcriptions`)
      .send({});

    expect(res.status).toBe(503);
    expect(res.headers['content-type']).toContain('application/problem+json');
  });

  it('409 problem+json — POST while a run is already going', async () => {
    const running = Transcription.start({
      id: 'run-1',
      libraryId: LIBRARY_ID,
      force: false,
      lessonsTotal: 0,
    });
    app = await buildApp({ seedRuns: [running] });

    const res = await request(app.getHttpServer())
      .post(`/api/v1/libraries/${LIBRARY_ID}/transcriptions`)
      .send({});

    expect(res.status).toBe(409);
    expect(res.headers['content-type']).toContain('application/problem+json');
  });

  it('404 — GET latest before anything has run', async () => {
    app = await buildApp({});

    const res = await request(app.getHttpServer()).get(
      `/api/v1/libraries/${LIBRARY_ID}/transcriptions/latest`,
    );

    expect(res.status).toBe(404);
  });

  it('200 — GET latest and GET history after a run exists', async () => {
    const finished = Transcription.start({
      id: 'run-1',
      libraryId: LIBRARY_ID,
      force: false,
      lessonsTotal: 2,
    });
    finished.recordSkipped();
    finished.complete();
    app = await buildApp({ seedRuns: [finished] });

    const latest = await request(app.getHttpServer()).get(
      `/api/v1/libraries/${LIBRARY_ID}/transcriptions/latest`,
    );
    expect(latest.status).toBe(200);
    expect(latest.body).toMatchObject({ id: 'run-1', status: 'succeeded', lessonsSkipped: 1 });

    const history = await request(app.getHttpServer()).get(
      `/api/v1/libraries/${LIBRARY_ID}/transcriptions`,
    );
    expect(history.status).toBe(200);
    expect((history.body as { items: unknown[] }).items).toHaveLength(1);
  });

  it('404 — GET history for an unknown library', async () => {
    app = await buildApp({});

    const res = await request(app.getHttpServer()).get('/api/v1/libraries/nope/transcriptions');

    expect(res.status).toBe(404);
  });

  it('202 then 409 — cancelling a run, then cancelling it again', async () => {
    const running = Transcription.start({
      id: 'run-1',
      libraryId: LIBRARY_ID,
      force: false,
      lessonsTotal: 5,
    });
    app = await buildApp({ seedRuns: [running] });

    const first = await request(app.getHttpServer()).post('/api/v1/transcriptions/run-1/cancel');
    expect(first.status).toBe(202);
    expect(first.body).toMatchObject({ id: 'run-1', status: 'cancelled' });

    const second = await request(app.getHttpServer()).post('/api/v1/transcriptions/run-1/cancel');
    expect(second.status).toBe(409);
    expect(second.headers['content-type']).toContain('application/problem+json');
  });

  it('404 — cancelling a run that does not exist', async () => {
    app = await buildApp({});

    const res = await request(app.getHttpServer()).post('/api/v1/transcriptions/nope/cancel');

    expect(res.status).toBe(404);
  });
});
