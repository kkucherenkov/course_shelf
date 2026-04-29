import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

import { AdminGuard } from '../../common/auth/admin.guard';
import { GetAdminDashboardQuery } from './application/queries/get-admin-dashboard.query';
import { GetAdminUserQuery } from './application/queries/get-admin-user.query';
import { ListAdminLibrariesQuery } from './application/queries/list-admin-libraries.query';
import { ListAdminScansQuery } from './application/queries/list-admin-scans.query';
import { ListAdminUsersQuery } from './application/queries/list-admin-users.query';
import { UpdateAdminUserCommand } from './application/commands/update-admin-user.command';

import type {
  AdminDashboardDto,
  AdminLibraryListDto,
  AdminScanListDto,
  AdminUpdateUserRequest,
  AdminUserListDto,
  AdminUserListItem,
} from '@app/api-client-ts';

@Controller({ path: 'admin', version: '1' })
@UseGuards(AdminGuard)
export class AdminController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  @Get('dashboard')
  getDashboard(): Promise<AdminDashboardDto> {
    return this.queryBus.execute<GetAdminDashboardQuery, AdminDashboardDto>(
      new GetAdminDashboardQuery(),
    );
  }

  @Get('scans')
  listScans(
    @Query('limit') limit?: string,
    @Query('libraryId') libraryId?: string,
  ): Promise<AdminScanListDto> {
    const parsed = limit === undefined ? undefined : Number.parseInt(limit, 10);
    return this.queryBus.execute<ListAdminScansQuery, AdminScanListDto>(
      new ListAdminScansQuery(parsed, libraryId),
    );
  }

  @Get('libraries')
  listLibraries(): Promise<AdminLibraryListDto> {
    return this.queryBus.execute<ListAdminLibrariesQuery, AdminLibraryListDto>(
      new ListAdminLibrariesQuery(),
    );
  }

  @Get('users')
  listUsers(
    @Query('search') search?: string,
    @Query('limit') limit?: string,
  ): Promise<AdminUserListDto> {
    const parsed = limit === undefined ? undefined : Number.parseInt(limit, 10);
    return this.queryBus.execute<ListAdminUsersQuery, AdminUserListDto>(
      new ListAdminUsersQuery(search, parsed),
    );
  }

  @Get('users/:id')
  getUser(@Param('id') id: string): Promise<AdminUserListItem> {
    return this.queryBus.execute<GetAdminUserQuery, AdminUserListItem>(new GetAdminUserQuery(id));
  }

  @Patch('users/:id')
  updateUser(
    @Param('id') id: string,
    @Body() body: AdminUpdateUserRequest,
  ): Promise<AdminUserListItem> {
    return this.commandBus.execute<UpdateAdminUserCommand, AdminUserListItem>(
      new UpdateAdminUserCommand(id, body),
    );
  }
}
