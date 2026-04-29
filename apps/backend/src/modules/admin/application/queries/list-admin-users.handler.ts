import { Inject, Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { DASHBOARD_PORT } from '../../domain/dashboard.port';
import { ListAdminUsersQuery } from './list-admin-users.query';

import type { DashboardPort } from '../../domain/dashboard.port';
import type { AdminUserListDto } from '@app/api-client-ts';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;
const MIN_LIMIT = 1;

@Injectable()
@QueryHandler(ListAdminUsersQuery)
export class ListAdminUsersHandler implements IQueryHandler<ListAdminUsersQuery, AdminUserListDto> {
  constructor(@Inject(DASHBOARD_PORT) private readonly dashboard: DashboardPort) {}

  async execute(query: ListAdminUsersQuery): Promise<AdminUserListDto> {
    const rawLimit = query.limit;
    const limit =
      rawLimit === undefined || !Number.isFinite(rawLimit)
        ? DEFAULT_LIMIT
        : Math.min(Math.max(rawLimit, MIN_LIMIT), MAX_LIMIT);

    const items = await this.dashboard.listUsers({
      ...(query.search === undefined ? {} : { search: query.search }),
      limit,
    });

    return { items };
  }
}
