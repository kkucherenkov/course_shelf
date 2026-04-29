import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';

import { AdminGuard } from '../../common/auth/admin.guard';
import { GetAdminDashboardQuery } from './application/queries/get-admin-dashboard.query';
import { ListAdminScansQuery } from './application/queries/list-admin-scans.query';

import type { AdminDashboardDto, AdminScanListDto } from '@app/api-client-ts';

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

  @Get('scans')
  listScans(@Query('limit') limit?: string): Promise<AdminScanListDto> {
    const parsed = limit === undefined ? undefined : Number.parseInt(limit, 10);
    return this.queryBus.execute<ListAdminScansQuery, AdminScanListDto>(
      new ListAdminScansQuery(parsed),
    );
  }
}
