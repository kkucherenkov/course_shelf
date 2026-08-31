import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { configureApp } from './bootstrap';
import { AppConfig } from './common/config/app-config';
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

  // Helmet, prefix, versioning, CORS, pipes, filters, interceptors and the
  // OpenAPI validator — shared verbatim with the e2e suite (`src/bootstrap.ts`).
  configureApp(app, { nodeEnv, corsOrigins });

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
