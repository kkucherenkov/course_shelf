import { Inject, Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { DASHBOARD_PORT } from '../../domain/dashboard.port';
import { ListAdminLibrariesQuery } from './list-admin-libraries.query';

import type { DashboardPort } from '../../domain/dashboard.port';
import type { AdminLibraryListDto } from '@app/api-client-ts';

@Injectable()
@QueryHandler(ListAdminLibrariesQuery)
export class ListAdminLibrariesHandler implements IQueryHandler<
  ListAdminLibrariesQuery,
  AdminLibraryListDto
> {
  constructor(@Inject(DASHBOARD_PORT) private readonly dashboard: DashboardPort) {}

  async execute(_query: ListAdminLibrariesQuery): Promise<AdminLibraryListDto> {
    const items = await this.dashboard.listAllLibrariesWithCounts();
    return { items };
  }
}
