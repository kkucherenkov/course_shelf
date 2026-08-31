/**
 * Harness for the backend e2e layer (GitHub #266).
 *
 * What is real here:
 *   - `configureApp()` from `src/bootstrap.ts` — the *same* helmet / prefix /
 *     versioning / pipe / filter / openapi-validator wiring `main.ts` uses.
 *   - `AuthModule` — the real Better Auth instance, the real catch-all
 *     `AuthController`, the real sign-in rate limiter and self-registration
 *     guard middlewares.
 *   - `SessionGuard` as `APP_GUARD`, exactly as `AppModule` registers it.
 *   - `RealtimeController` and `MeController` as the two sample protected
 *     routes: one without a body (401 path), one with a required body the
 *     OpenAPI validator can reject (400 path).
 *
 * What is faked — external systems only:
 *   - the database: Better Auth runs on `memoryAdapter({})` through the
 *     `AUTH_DATABASE` seam, and `PrismaService` is a stub whose only used
 *     method is the `user.count()` the first-user-is-admin hook calls.
 *   - the mail transport (`EMAIL_PORT`).
 *   - the CQRS `CommandBus`.
 *
 * Centrifugo needs no fake: `RealtimeService` only signs a JWT locally.
 */
import path from 'node:path';

import { Global, Module, type INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { CommandBus } from '@nestjs/cqrs';
import { Test } from '@nestjs/testing';
import { memoryAdapter } from 'better-auth/adapters/memory';
import {
  AcceptLanguageResolver,
  HeaderResolver,
  I18nJsonLoader,
  I18nModule,
  QueryResolver,
} from 'nestjs-i18n';
import { vi } from 'vitest';

import { configureApp } from '../src/bootstrap';
import { SessionGuard } from '../src/common/auth/auth.guard';
import { AuthModule } from '../src/common/auth/auth.module';
import { AUTH_DATABASE } from '../src/common/auth/auth.tokens';
import { AppConfig } from '../src/common/config/app-config';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { EMAIL_PORT } from '../src/modules/integrations/domain/email.port';
import { MeController } from '../src/modules/me/me.controller';
import { RealtimeModule } from '../src/modules/realtime/realtime.module';

import type { NestExpressApplication } from '@nestjs/platform-express';

export interface E2eAppOptions {
  /**
   * `production` is what turns Helmet's CSP on (and the validator's response
   * checking off), so the secure-header spec asks for it explicitly.
   */
  nodeEnv?: 'development' | 'production';
  /** Overrides merged into the env AppConfig reads. */
  env?: Record<string, string>;
  /** Stub for `CommandBus.execute`. */
  commandBusExecute?: () => unknown;
  /**
   * What `prisma.user.count()` answers. 0 (the default) is the fresh-install
   * path: the first account becomes ADMIN and the self-registration guard
   * steps aside so the owner can be created.
   */
  existingUserCount?: number;
}

export interface E2eApp {
  app: INestApplication;
  /** Passed to supertest. */
  server: ReturnType<INestApplication['getHttpServer']>;
  close: () => Promise<void>;
}

function baseEnv(nodeEnv: string): Record<string, string> {
  return {
    NODE_ENV: nodeEnv,
    BETTER_AUTH_SECRET: 'e2e-secret-not-a-real-key-0123456789',
    BETTER_AUTH_URL: 'http://127.0.0.1',
    BETTER_AUTH_BASE_PATH: '/api/v1/auth',
    CENTRIFUGO_API_URL: 'http://centrifugo.invalid/api',
    CENTRIFUGO_API_KEY: 'e2e-api-key',
    CENTRIFUGO_TOKEN_HMAC_SECRET: 'e2e-centrifugo-hmac-secret',
    DATABASE_URL: 'postgresql://e2e:e2e@127.0.0.1:5432/e2e',
    CORS_ORIGINS: 'http://localhost:3001',
    // The sign-in limiter is per-app-instance (an in-process Map), so it never
    // leaks between tests — but keep the global throttler out of the way.
    RATE_LIMIT_MAX: '100000',
  };
}

/**
 * `ConfigService` prefers `process.env` over its internal config, so a stray
 * variable in the developer's shell would otherwise decide what the e2e run
 * tests. Read from the explicit map only.
 */
function fixedConfigService(env: Record<string, string>): ConfigService {
  return {
    get: (key: string): string | undefined => env[key],
  } as unknown as ConfigService;
}

export async function createE2eApp(options: E2eAppOptions = {}): Promise<E2eApp> {
  const nodeEnv = options.nodeEnv ?? 'development';
  const env = { ...baseEnv(nodeEnv), ...options.env };
  const config = new AppConfig(fixedConfigService(env));

  // `count()` is the only Prisma call left once the memory adapter owns the
  // storage — Better Auth's first-user-is-admin hook and the
  // self-registration guard both probe it.
  const userCount = options.existingUserCount ?? 0;
  const prisma = { user: { count: (): Promise<number> => Promise.resolve(userCount) } };

  @Global()
  @Module({
    providers: [
      { provide: AppConfig, useValue: config },
      { provide: PrismaService, useValue: prisma },
      { provide: EMAIL_PORT, useValue: { send: vi.fn(() => Promise.resolve()) } },
      // One fresh in-memory store per app — tests never see each other's
      // users. The tables have to be declared up front: the memory adapter
      // throws `Model <x> not found` rather than creating a missing key.
      {
        provide: AUTH_DATABASE,
        useValue: memoryAdapter({ user: [], session: [], account: [], verification: [] }),
      },
    ],
    exports: [AppConfig, PrismaService, EMAIL_PORT, AUTH_DATABASE],
  })
  class E2eInfraModule {}

  const moduleRef = await Test.createTestingModule({
    imports: [
      E2eInfraModule,
      I18nModule.forRoot({
        fallbackLanguage: 'en',
        loader: I18nJsonLoader,
        loaderOptions: { path: path.resolve(__dirname, '../src/i18n'), watch: false },
        resolvers: [
          new QueryResolver(['lang']),
          new HeaderResolver(['x-lang']),
          AcceptLanguageResolver,
        ],
      }),
      AuthModule,
      RealtimeModule,
    ],
    controllers: [MeController],
    providers: [
      { provide: APP_GUARD, useClass: SessionGuard },
      // CqrsModule is deliberately not imported: its bootstrap hook wants to
      // register real handlers, and the only thing under test here is the
      // controller's HTTP edge.
      {
        provide: CommandBus,
        useValue: {
          execute: vi.fn().mockImplementation(() => Promise.resolve(options.commandBusExecute?.())),
        },
      },
    ],
  }).compile();

  const app = moduleRef.createNestApplication<NestExpressApplication>({ logger: false });
  configureApp(app, { nodeEnv, corsOrigins: config.runtime.corsOrigins });
  await app.init();

  return {
    app,
    server: app.getHttpServer(),
    close: () => app.close(),
  };
}
