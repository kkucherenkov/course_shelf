import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { DASHBOARD_PORT } from '../../domain/dashboard.port';
import { EmptyUserPatchError, UserNotFoundError } from '../../domain/admin.errors';
import { UpdateAdminUserCommand } from './update-admin-user.command';

import type { DashboardPort } from '../../domain/dashboard.port';
import type { AdminUserListItem } from '@app/api-client-ts';

@Injectable()
@CommandHandler(UpdateAdminUserCommand)
export class UpdateAdminUserHandler implements ICommandHandler<
  UpdateAdminUserCommand,
  AdminUserListItem
> {
  constructor(@Inject(DASHBOARD_PORT) private readonly dashboard: DashboardPort) {}

  async execute(command: UpdateAdminUserCommand): Promise<AdminUserListItem> {
    const { id, patch } = command;

    if (patch.role === undefined && patch.banned === undefined) {
      throw new EmptyUserPatchError();
    }

    const updated = await this.dashboard.updateUser(id, patch);

    if (updated === null) {
      throw new UserNotFoundError(id);
    }

    return updated;
  }
}
