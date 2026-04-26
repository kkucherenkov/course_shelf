/**
 * WHY this file exists:
 * HTTP entry point for the Access bounded context. Its only jobs are:
 *   1. Receive the request (body already validated by express-openapi-validator).
 *   2. Enforce the admin role via AdminGuard (returns 401/403 before reaching handlers).
 *   3. Dispatch a Command or Query via the CQRS bus.
 *   4. Return the result shaped as the OpenAPI-specified response.
 *
 * No business logic, no Prisma, no mapping beyond what the query handler already
 * provides. POST fetches the full resource via GetGrantQuery after the write
 * command completes, keeping write and read models cleanly separated (CQRS).
 */
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

import { AdminGuard } from '../../common/auth/admin.guard';
import { RegisterGrantCommand } from './application/commands/register-grant.command';
import { RevokeGrantCommand } from './application/commands/revoke-grant.command';
import { GetGrantQuery } from './application/queries/get-grant.query';
import { ListUserGrantsQuery } from './application/queries/list-user-grants.query';

import type { AccessGrantDto, AccessGrantListDto, RegisterGrantRequest } from '@app/api-client-ts';

@UseGuards(AdminGuard)
@Controller({ path: 'access/grants', version: '1' })
export class AccessController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  /** GET /api/v1/access/grants?userId=… */
  @Get()
  async listGrants(@Query('userId') userId: string): Promise<AccessGrantListDto> {
    const items = await this.queryBus.execute<ListUserGrantsQuery, AccessGrantDto[]>(
      new ListUserGrantsQuery(userId),
    );
    return { items };
  }

  /**
   * POST /api/v1/access/grants
   * Returns 201 with the newly created AccessGrantDto.
   * Command returns { id }; controller fetches the canonical read model via
   * GetGrantQuery (CQRS: write path is separate from read path).
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async registerGrant(@Body() body: RegisterGrantRequest): Promise<AccessGrantDto> {
    const { id } = await this.commandBus.execute<RegisterGrantCommand, { id: string }>(
      new RegisterGrantCommand(body.userId, body.target, body.level),
    );

    return this.queryBus.execute<GetGrantQuery, AccessGrantDto>(new GetGrantQuery(id));
  }

  /** DELETE /api/v1/access/grants/:id */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async revokeGrant(@Param('id') id: string): Promise<void> {
    await this.commandBus.execute<RevokeGrantCommand>(new RevokeGrantCommand(id));
  }
}
