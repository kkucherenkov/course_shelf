import { Inject, Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { DASHBOARD_PORT } from '../../domain/dashboard.port';
import { GetAdminDashboardQuery } from './get-admin-dashboard.query';

import type { DashboardPort } from '../../domain/dashboard.port';
import type { AdminDashboardDto } from '@app/api-client-ts';

@Injectable()
@QueryHandler(GetAdminDashboardQuery)
export class GetAdminDashboardHandler implements IQueryHandler<
  GetAdminDashboardQuery,
  AdminDashboardDto
> {
  constructor(@Inject(DASHBOARD_PORT) private readonly dashboard: DashboardPort) {}

  async execute(_query: GetAdminDashboardQuery): Promise<AdminDashboardDto> {
    const generatedAt = new Date();
    const snapshot = await this.dashboard.getSnapshot();

    return {
      generatedAt: generatedAt.toISOString(),
      ...snapshot,
    };
  }
}
