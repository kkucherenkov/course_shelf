/**
 * WHY this file exists:
 * Controller-level integration spec for the scrape-preview admin endpoints in
 * mock mode. Boots a minimal NestJS test app with:
 *   - the real ScrapeCourseHandler (verifies command dispatch)
 *   - SCRAPER_REGISTRY bound to DefaultScraperRegistry(createMockScrapers())
 *   - a stub COURSE_REPOSITORY (no DB)
 *   - AdminGuard replaced by a PassThroughGuard
 *   - HttpExceptionFilter registered for RFC 9457 error shapes
 *
 * Covers:
 *   1. GET /api/v1/admin/scrapers lists mock scrapers (includes json-ld)
 *   2. POST scrape-preview returns deterministic mock candidates (youtube source, title "Mock …")
 *   3. POST scrape-preview on an unknown course → 404 application/problem+json
 *
 * This is the "Step 2b" path: no shared HTTP harness exists; each controller
 * module has its own isolated test app, consistent with streaming.controller.spec.ts.
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
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { HttpExceptionFilter } from '../../common/filters/http-exception.filter';
import { AdminGuard } from '../../common/auth/admin.guard';
import { ScrapeCourseHandler } from './application/commands/scrape-course.handler';
import { CatalogScrapeAdminController } from './catalog-scrape-admin.controller';
import { COURSE_REPOSITORY } from './domain/course/course.repository';
import { SCRAPER_REGISTRY } from './domain/scraper/scraper.port';
import { DefaultScraperRegistry } from './infra/scrapers/scraper.registry';
import { createMockScrapers } from './infra/scrapers/mock.scrapers';

// ---------------------------------------------------------------------------
// Pass-through guard — replaces AdminGuard so we can call the endpoints
// without a real Better Auth session or I18nService.
// ---------------------------------------------------------------------------

@Injectable()
class PassThroughAdminGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<Record<string, unknown>>();
    req['userId'] = 'admin-user-1';
    return true;
  }
}

// ---------------------------------------------------------------------------
// App factory
// ---------------------------------------------------------------------------

async function buildApp(courseExists: boolean): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [CqrsModule],
    controllers: [CatalogScrapeAdminController],
    providers: [
      { provide: APP_FILTER, useClass: HttpExceptionFilter },
      ScrapeCourseHandler,
      {
        provide: SCRAPER_REGISTRY,
        useValue: new DefaultScraperRegistry(createMockScrapers()),
      },
      {
        provide: COURSE_REPOSITORY,
        useValue: {
          findById: async () => (courseExists ? ({ id: 'c1' } as never) : null),
        },
      },
    ],
  })
    // Replace AdminGuard with a pass-through so no AuthService / I18nService is needed.
    .overrideGuard(AdminGuard)
    .useValue(new PassThroughAdminGuard())
    .compile();

  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI });
  await app.init();
  return app;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CatalogScrapeAdminController — mock mode [integration]', () => {
  describe('GET /api/v1/admin/scrapers', () => {
    let app: INestApplication;

    beforeAll(async () => {
      app = await buildApp(true);
    });
    afterAll(() => app.close());

    it('200 — lists all mock scrapers, including json-ld', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/admin/scrapers');

      expect(res.status).toBe(200);
      const ids = (res.body as { scrapers: { id: string }[] }).scrapers.map((s) => s.id);
      expect(ids).toContain('json-ld');
      expect(ids).toContain('youtube');
      expect(ids).toContain('udemy');
    });

    it('each scraper entry carries configured:true and supportedKinds', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/admin/scrapers');

      expect(res.status).toBe(200);
      for (const s of (res.body as { scrapers: { configured: boolean }[] }).scrapers) {
        expect(s.configured).toBe(true);
      }
      const yt = (
        res.body as { scrapers: { id: string; supportedKinds: string[] }[] }
      ).scrapers.find((s) => s.id === 'youtube');
      expect(yt?.supportedKinds).toEqual(['url', 'name', 'fragment']);
    });
  });

  describe('POST /api/v1/admin/courses/:id/scrape-preview — known course', () => {
    let app: INestApplication;

    beforeAll(async () => {
      app = await buildApp(true);
    });
    afterAll(() => app.close());

    it('200 — returns mock youtube candidates for a YouTube URL', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/admin/courses/c1/scrape-preview')
        .send({ kind: 'url', url: 'https://www.youtube.com/playlist?list=PL1' });

      expect(res.status).toBe(200);
      const { candidates } = res.body as {
        candidates: { source: string; fragment: { title: string } }[];
      };
      expect(candidates).toHaveLength(1);
      expect(candidates.at(0)?.source).toBe('youtube');
      expect(candidates.at(0)?.fragment.title).toContain('Mock');
    });

    it('200 — returns mock json-ld candidates for a fragment request', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/admin/courses/c1/scrape-preview')
        .send({ source: 'json-ld', kind: 'fragment', fragment: '<html/>' });

      expect(res.status).toBe(200);
      const { candidates } = res.body as {
        candidates: { source: string }[];
      };
      expect(candidates.at(0)?.source).toBe('json-ld');
    });
  });

  describe('POST /api/v1/admin/courses/:id/scrape-preview — unknown course', () => {
    let app: INestApplication;

    beforeAll(async () => {
      app = await buildApp(false);
    });
    afterAll(() => app.close());

    it('404 application/problem+json when the course does not exist', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/admin/courses/does-not-exist/scrape-preview')
        .send({ source: 'json-ld', kind: 'fragment', fragment: '<html/>' });

      expect(res.status).toBe(404);
      expect(res.headers['content-type']).toContain('application/problem+json');
      expect((res.body as Record<string, unknown>)['code']).toBe('course-not-found');
    });
  });
});
