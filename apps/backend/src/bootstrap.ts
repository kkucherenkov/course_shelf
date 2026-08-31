import { RequestMethod, ValidationPipe, VersioningType } from '@nestjs/common';
import helmet from 'helmet';

import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { rejectNullBytes } from './common/http/reject-null-bytes.middleware';
import { SentryInterceptor } from './common/observability/sentry.interceptor';
import { registerOpenApiValidator } from './common/openapi/openapi-validator.middleware';

import type { AppRuntimeConfig } from './common/config/app-config';
import type { NestExpressApplication } from '@nestjs/platform-express';

/**
 * Everything between `NestFactory.create()` and `app.listen()`.
 *
 * It lives here rather than inline in `main.ts` so the backend e2e suite
 * (`test/**`) can boot the *same* wiring instead of a hand-copied
 * approximation of it. A test that asserts on a second copy of the CSP
 * directives, the validation-pipe flags or the middleware order proves only
 * that the copy matches itself.
 *
 * Order is load-bearing:
 *   helmet → express.json + openapi-validator (registered last, but both are
 *   `app.use()` so they run before the Nest router) → guards → pipes.
 */
export function configureApp(
  app: NestExpressApplication,
  runtime: Pick<AppRuntimeConfig, 'nodeEnv' | 'corsOrigins'>,
): void {
  const { nodeEnv, corsOrigins } = runtime;

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

  // After the validator, because it needs the body `express.json()` (mounted by
  // `registerOpenApiValidator`) produced, and before the Nest router. See the
  // file header: a NUL byte anywhere in a JSON payload is valid JSON, satisfies
  // every `type: string` in the spec, and 500s the first write that touches
  // Postgres.
  app.use('/api', rejectNullBytes);
}
