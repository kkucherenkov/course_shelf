import { Controller, Get, UseGuards } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';

import { AdminGuard } from '../../common/auth/admin.guard';
import { GetAdminDashboardQuery } from './application/queries/get-admin-dashboard.query';

import type { AdminDashboardDto } from '@app/api-client-ts';

@Controller({ path: 'admin', version: '1' })
@UseGuards(AdminGuard)
export class AdminController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get('dashboard')
  getDashboard(): Promise<AdminDashboardDto> {
    return this.queryBus.execute<GetAdminDashboardQuery, AdminDashboardDto>(
      new GetAdminDashboardQuery(),
    );
  }
}
