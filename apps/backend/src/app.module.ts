import path from 'node:path';

import { Module, type DynamicModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { CqrsModule } from '@nestjs/cqrs';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import {
  AcceptLanguageResolver,
  HeaderResolver,
  I18nJsonLoader,
  I18nModule,
  QueryResolver,
} from 'nestjs-i18n';

import { AuthModule } from './common/auth/auth.module';
import { SessionGuard } from './common/auth/auth.guard';
import { CommonAccessModule } from './common/access/access.module';
import { CentrifugoModule } from './common/centrifugo/centrifugo.module';
import { DataLoaderModule } from './common/dataloader/dataloader.module';
import { NotificationsModule } from './common/notifications/notifications.module';
import { ConfigModule } from './common/config/config.module';
import { ObservabilityModule } from './common/observability/observability.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { RedisModule } from './common/redis/redis.module';
import { SmsModule } from './common/sms/sms.module';
import { AccessModule } from './modules/access/access.module';
import { AdminModule } from './modules/admin/admin.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { LearningModule } from './modules/learning/learning.module';
import { OpsModule } from './modules/ops/ops.module';
import { StreamingModule } from './modules/streaming/streaming.module';
import { IntegrationsModule } from './modules/integrations/integrations.module';
import { HealthModule } from './modules/health/health.module';
import { PingModule } from './modules/ping/ping.module';
import { RealtimeModule } from './modules/realtime/realtime.module';

type ImportableModule = DynamicModule | (new (...args: unknown[]) => unknown);

const devOnlyModules: ImportableModule[] = [];

@Module({
  imports: [
    ConfigModule,
    CqrsModule.forRoot(),
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60_000, limit: 60 }],
    }),
    I18nModule.forRoot({
      fallbackLanguage: 'en',
      loader: I18nJsonLoader,
      loaderOptions: {
        path: path.resolve(__dirname, 'i18n'),
        watch: false,
      },
      resolvers: [
        new QueryResolver(['lang']),
        new HeaderResolver(['x-lang']),
        AcceptLanguageResolver,
      ],
    }),
    ObservabilityModule,
    DataLoaderModule,
    PrismaModule,
    RedisModule,
    CentrifugoModule,
    SmsModule,
    NotificationsModule,
    IntegrationsModule,
    AuthModule,
    CommonAccessModule,
    HealthModule,
    OpsModule,
    PingModule,
    RealtimeModule,
    CatalogModule,
    StreamingModule,
    LearningModule,
    AccessModule,
    AdminModule,
    ...devOnlyModules,
  ],
  providers: [
    // Order matters: ThrottlerGuard runs first (rate-limit before auth),
    // SessionGuard second (auth-by-default for all routes).
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: SessionGuard },
  ],
})
export class AppModule {}
