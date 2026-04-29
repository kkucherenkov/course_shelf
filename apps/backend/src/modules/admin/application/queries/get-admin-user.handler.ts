import { Inject, Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { DASHBOARD_PORT } from '../../domain/dashboard.port';
import { UserNotFoundError } from '../../domain/admin.errors';
import { GetAdminUserQuery } from './get-admin-user.query';

import type { DashboardPort } from '../../domain/dashboard.port';
import type { AdminUserListItem } from '@app/api-client-ts';

@Injectable()
@QueryHandler(GetAdminUserQuery)
export class GetAdminUserHandler implements IQueryHandler<GetAdminUserQuery, AdminUserListItem> {
  constructor(@Inject(DASHBOARD_PORT) private readonly dashboard: DashboardPort) {}

  async execute(query: GetAdminUserQuery): Promise<AdminUserListItem> {
    const item = await this.dashboard.findUserById(query.id);

    if (item === null) {
      throw new UserNotFoundError(query.id);
    }

    return item;
  }
}
