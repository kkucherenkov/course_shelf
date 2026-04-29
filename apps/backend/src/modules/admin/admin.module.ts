import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { AdminGuard } from '../../common/auth/admin.guard';
import { DASHBOARD_PORT } from './domain/dashboard.port';
import { PrismaDashboardAdapter } from './infra/prisma-dashboard.adapter';
import { AdminController } from './admin.controller';
import { AdminPublicController } from './admin-public.controller';
import { GetAdminDashboardHandler } from './application/queries/get-admin-dashboard.handler';
import { ListAdminScansHandler } from './application/queries/list-admin-scans.handler';

// AdminGuard's dependencies (AuthService, I18nService) are provided globally
// by AuthModule (@Global) and I18nModule — no extra imports needed here.

@Module({
  imports: [CqrsModule],
  controllers: [AdminController, AdminPublicController],
  providers: [
    AdminGuard,
    GetAdminDashboardHandler,
    ListAdminScansHandler,
    { provide: DASHBOARD_PORT, useClass: PrismaDashboardAdapter },
  ],
})
export class AdminModule {}
