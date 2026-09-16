/**
 * WHY this file exists:
 * Controller-level integration spec proving `POST /api/v1/libraries` is
 * admin-gated (#592). Registering a library walks the server's filesystem
 * and grants the caller READ access to whatever it finds — before this
 * guard, any authenticated user could trigger that, not just admins.
 *
 * Boots a minimal NestJS test app with the REAL `AdminGuard` (only its
 * `AuthService`/`I18nService` dependencies are stubbed — see
 * `catalog-scrape-admin.integration.spec.ts` for the sibling pattern, which
 * instead swaps `AdminGuard` for a pass-through because it isn't the thing
 * under test there; here it is).
 *
 * `GET /api/v1/libraries` has no guard at all (role-based filtering happens
 * inside `ListLibrariesQuery`), so a case for it is included as a guard
 * against a future fix over-applying `@UseGuards(AdminGuard)` at the class
 * level and locking non-admins out of the list too.
 */
import {
  CanActivate,
  ExecutionContext,
  INestApplication,
  Injectable,
  UnauthorizedException,
  VersioningType,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Test } from '@nestjs/testing';
import { I18nService } from 'nestjs-i18n';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AdminGuard } from '../../common/auth/admin.guard';
import { AuthService } from '../../common/auth/auth.service';
import { LibraryGrantService } from '../../common/access/library-grant.service';
import { HttpExceptionFilter } from '../../common/filters/http-exception.filter';
import { CatalogController } from './catalog.controller';
import { RegisterLibraryCommand } from './application/commands/register-library.command';
import { RunScanCommand } from './application/commands/run-scan.command';
import { GetLibraryQuery } from './application/queries/get-library.query';
import { ListLibrariesQuery } from './application/queries/list-libraries.query';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';

import type { LibraryDto } from '@app/api-client-ts';

/**
 * Stand-in for the app-wide `SessionGuard` (`APP_GUARD` in `app.module.ts`),
 * which normally stamps `req.session` before any controller runs — the
 * source `@Session()` reads. `AdminGuard` only stamps `req.userId`, so
 * without this the routes that pass their guard (or, like GET, have none)
 * blow up on `@Session()` instead of exercising the behaviour under test.
 */
@Injectable()
class FakeSessionGuard implements CanActivate {
  constructor(private readonly role: string | undefined | null) {}

  canActivate(context: ExecutionContext): boolean {
    if (this.role === null) throw new UnauthorizedException();
    const req = context.switchToHttp().getRequest<{ session?: unknown }>();
    req.session = { user: { id: 'user-1', role: this.role }, sessionId: 'sess-1' };
    return true;
  }
}

const LIBRARY: LibraryDto = {
  id: 'lib-1',
  name: 'Conference Recordings',
  rootPath: '/srv/courses/conference',
  createdAt: '2026-04-25T09:00:00Z',
  updatedAt: '2026-04-25T09:00:00Z',
};

function makeAuth(role: string | undefined | null): { getSession: ReturnType<typeof vi.fn> } {
  return {
    getSession: vi.fn().mockResolvedValue(role === null ? null : { user: { id: 'user-1', role } }),
  };
}

async function buildApp(
  role: string | undefined | null,
  commandBus: { execute: ReturnType<typeof vi.fn> },
): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    controllers: [CatalogController],
    providers: [
      { provide: APP_FILTER, useClass: HttpExceptionFilter },
      { provide: APP_GUARD, useValue: new FakeSessionGuard(role) },
      AdminGuard,
      { provide: AuthService, useValue: makeAuth(role) },
      { provide: I18nService, useValue: { t: () => 'Forbidden' } },
      { provide: CommandBus, useValue: commandBus },
      {
        provide: QueryBus,
        useValue: {
          execute: vi.fn().mockImplementation((query: unknown) => {
            if (query instanceof ListLibrariesQuery) return Promise.resolve([LIBRARY]);
            if (query instanceof GetLibraryQuery) return Promise.resolve(LIBRARY);
            return Promise.reject(new Error(`Unexpected query: ${String(query)}`));
          }),
        },
      },
      {
        provide: LibraryGrantService,
        useValue: { grantRead: vi.fn().mockResolvedValue(undefined) },
      },
    ],
  }).compile();

  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI });
  await app.init();
  return app;
}

describe('CatalogController — POST /api/v1/libraries [integration]', () => {
  let app: INestApplication;

  afterEach(async () => {
    await app.close();
  });

  it('401 — no session', async () => {
    app = await buildApp(null, { execute: vi.fn() });

    const res = await request(app.getHttpServer())
      .post('/api/v1/libraries')
      .send({ name: 'Conference Recordings', rootPath: '/srv/courses/conference' });

    expect(res.status).toBe(401);
  });

  it('403 — authenticated but not an admin (red before #592)', async () => {
    const commandBus = { execute: vi.fn() };
    app = await buildApp('user', commandBus);

    const res = await request(app.getHttpServer())
      .post('/api/v1/libraries')
      .send({ name: 'Conference Recordings', rootPath: '/srv/courses/conference' });

    expect(res.status).toBe(403);
    expect(res.headers['content-type']).toContain('application/problem+json');
    // Never dispatched — the guard must reject before the handler runs.
    expect(commandBus.execute).not.toHaveBeenCalled();
  });

  it('201 — admin role reaches the handler and gets a grant', async () => {
    const commandBus = {
      execute: vi.fn().mockImplementation((command: unknown) => {
        if (command instanceof RegisterLibraryCommand) {
          return Promise.resolve({ id: 'lib-1', alreadyExisted: false });
        }
        if (command instanceof RunScanCommand) {
          return Promise.resolve(undefined);
        }
        return Promise.reject(new Error(`Unexpected command: ${String(command)}`));
      }),
    };
    app = await buildApp('admin', commandBus);

    const res = await request(app.getHttpServer())
      .post('/api/v1/libraries')
      .send({ name: 'Conference Recordings', rootPath: '/srv/courses/conference' });

    expect(res.status).toBe(201);
    expect(res.body).toEqual(LIBRARY);
  });
});

describe('CatalogController — GET /api/v1/libraries [integration]', () => {
  let app: INestApplication;

  beforeEach(async () => {
    app = await buildApp('user', { execute: vi.fn() });
  });

  afterEach(async () => {
    await app.close();
  });

  it('200 — no admin role required (role-based filtering lives in the query)', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/libraries');

    expect(res.status).toBe(200);
  });
});
