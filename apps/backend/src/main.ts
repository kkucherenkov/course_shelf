import 'reflect-metadata';
import { Logger, RequestMethod, ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { AppConfig } from './common/config/app-config';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { SentryInterceptor } from './common/observability/sentry.interceptor';
import { registerOpenApiValidator } from './common/openapi/openapi-validator.middleware';
import { initSentry } from './instrument';
import { initTelemetry, shutdownTelemetry } from './telemetry';

import type { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap(): Promise<void> {
  // Sentry and OTel must be initialised before any other module so that their
  // auto-instrumentation patches run before the patched modules are imported.
  initSentry();
  initTelemetry();

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  const config = app.get(AppConfig);
  const { port, nodeEnv, corsOrigins } = config.runtime;

  app.set('trust proxy', 'loopback');

  // Helmet — secure-headers tuned for an SPA that talks bearer to /api/v1/* and
  // a Centrifugo WebSocket on the same origin (in prod, all folded behind one
  // proxy). The CSP below intentionally covers the API responses Helmet
  // attaches it to; the SPA's HTML response gets a parallel set of headers
  // from `apps/web/nginx.conf` so both `/` and `/api/v1/*` carry CSP — the
  // bar set by the E21-F02-S02 card.
  //
  //  - default-src 'self'         no third-party origins
  //  - script-src 'self'          no inline scripts (the runtime _app-config.js
  //                               is a separate file on the same origin)
  //  - style-src 'unsafe-inline'  Vue scoped styles inject <style> at runtime;
  //                               there is no static hash list we can enumerate
  //  - connect-src 'self' ws: wss: API + Centrifugo WS upstream
  //  - frame-ancestors 'none'     clickjacking guard
  //  - object-src 'none'          legacy plugins forbidden
  //
  // CSP stays disabled in dev so hot-reload, Vite eval'd modules, and
  // Storybook iframes work without per-tool exemptions.
  app.use(
    nodeEnv === 'production'
      ? helmet({
          contentSecurityPolicy: {
            directives: {
              defaultSrc: ["'self'"],
              scriptSrc: ["'self'"],
              styleSrc: ["'self'", "'unsafe-inline'"],
              imgSrc: ["'self'", 'data:', 'blob:'],
              fontSrc: ["'self'", 'data:'],
              connectSrc: ["'self'", 'ws:', 'wss:'],
              mediaSrc: ["'self'", 'blob:'],
              objectSrc: ["'none'"],
              frameAncestors: ["'none'"],
              formAction: ["'self'"],
              baseUri: ["'self'"],
              // `upgrade-insecure-requests` deliberately omitted —
              // forces every subresource fetch to https://, which
              // breaks plain-HTTP deployments (CI e2e stack, local
              // dev). TLS termination at the reverse proxy (Caddy /
              // Nginx Proxy Manager) handles the http→https hop in
              // production; the directive is redundant there and
              // harmful below.
            },
          },
          crossOriginEmbedderPolicy: false,
          crossOriginResourcePolicy: { policy: 'same-origin' },
          referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
        })
      : helmet({ contentSecurityPolicy: false }),
  );

  app.setGlobalPrefix('api', {
    exclude: [
      { path: 'healthz', method: RequestMethod.GET },
      { path: 'readyz', method: RequestMethod.GET },
    ],
  });
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new SentryInterceptor());

  registerOpenApiValidator(app, nodeEnv);

  app.enableShutdownHooks();

  // Graceful shutdown: flush OTel spans before the process exits.
  process.on('SIGTERM', () => {
    void shutdownTelemetry()
      .catch((error: unknown) => {
        Logger.error(`OTel shutdown failed: ${String(error)}`, undefined, 'Bootstrap');
      })
      .finally(() => app.close());
  });

  await app.listen(port, '0.0.0.0');
  Logger.log(
    `Backend listening on http://localhost:${String(port)}/api/v1 (env=${nodeEnv})`,
    'Bootstrap',
  );
}

bootstrap().catch((error: unknown) => {
  Logger.error(`Failed to bootstrap: ${String(error)}`, undefined, 'Bootstrap');
  process.exit(1);
});
