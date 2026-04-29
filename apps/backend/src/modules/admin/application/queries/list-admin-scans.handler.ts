import { Inject, Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { DASHBOARD_PORT } from '../../domain/dashboard.port';
import { ListAdminScansQuery } from './list-admin-scans.query';

import type { DashboardPort } from '../../domain/dashboard.port';
import type { AdminScanListDto } from '@app/api-client-ts';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const MIN_LIMIT = 1;

@Injectable()
@QueryHandler(ListAdminScansQuery)
export class ListAdminScansHandler implements IQueryHandler<ListAdminScansQuery, AdminScanListDto> {
  constructor(@Inject(DASHBOARD_PORT) private readonly dashboard: DashboardPort) {}

  async execute(query: ListAdminScansQuery): Promise<AdminScanListDto> {
    const rawLimit = query.limit;
    const limit =
      rawLimit === undefined || !Number.isFinite(rawLimit)
        ? DEFAULT_LIMIT
        : Math.min(Math.max(rawLimit, MIN_LIMIT), MAX_LIMIT);

    const items = await this.dashboard.listRecentScans(limit, query.libraryId);

    return { items };
  }
}
