/**
 * WHY this file exists:
 * HTTP entry point for the Catalog bounded context. Its only jobs are:
 *   1. Receive the request (body already validated by express-openapi-validator).
 *   2. Dispatch a Command or Query via the CQRS bus.
 *   3. Return the result shaped as the OpenAPI-specified response.
 *
 * No business logic, no Prisma, no mapping beyond the command/query result.
 * The toLibraryDto helper is called only in query handlers; here the controller
 * receives already-shaped DTOs from the query bus.
 *
 * POST pattern: command returns { id }, controller issues GetLibraryQuery
 * to return the full resource. This keeps write and read models cleanly separated.
 *
 * Session pattern: the global SessionGuard resolves the session and attaches
 * req.session before the handler runs. Use @Session() to extract the actor.
 */
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

import { AdminGuard } from '../../common/auth/admin.guard';
import { Session } from '../../common/auth/decorators';
import { RegisterLibraryCommand } from './application/commands/register-library.command';
import { UpdateLibraryCommand } from './application/commands/update-library.command';
import { RemoveLibraryCommand } from './application/commands/remove-library.command';
import { GetLibraryQuery } from './application/queries/get-library.query';
import { ListLibrariesQuery } from './application/queries/list-libraries.query';

import type { SessionContext } from '../../common/auth/decorators';
import type {
  LibraryDto,
  LibraryListDto,
  RegisterLibraryRequest,
  UpdateLibraryRequest,
} from '@app/api-client-ts';

@Controller({ path: 'libraries', version: '1' })
export class CatalogController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  /** GET /api/v1/libraries */
  @Get()
  async listLibraries(@Session() session: SessionContext): Promise<LibraryListDto> {
    const actor = session.user;
    const items = await this.queryBus.execute<ListLibrariesQuery, LibraryDto[]>(
      new ListLibrariesQuery(actor),
    );
    return { items };
  }

  /**
   * POST /api/v1/libraries
   * Command returns { id }; controller fetches the full record via GetLibraryQuery.
   * This keeps the write path free of read-model concerns (CQRS).
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async registerLibrary(
    @Body() body: RegisterLibraryRequest,
    @Session() session: SessionContext,
  ): Promise<LibraryDto> {
    const actor = session.user;
    const { id } = await this.commandBus.execute<RegisterLibraryCommand, { id: string }>(
      new RegisterLibraryCommand(body.name, body.rootPath),
    );
    return this.queryBus.execute<GetLibraryQuery, LibraryDto>(new GetLibraryQuery(id, actor));
  }

  /** GET /api/v1/libraries/:id */
  @Get(':id')
  async getLibrary(
    @Param('id') id: string,
    @Session() session: SessionContext,
  ): Promise<LibraryDto> {
    const actor = session.user;
    return this.queryBus.execute<GetLibraryQuery, LibraryDto>(new GetLibraryQuery(id, actor));
  }

  /** PATCH /api/v1/libraries/:id — admin only */
  @UseGuards(AdminGuard)
  @Patch(':id')
  async updateLibrary(
    @Param('id') id: string,
    @Body() body: UpdateLibraryRequest,
  ): Promise<LibraryDto> {
    const patch: { name?: string } = {};
    if (body.name !== undefined) patch.name = body.name;
    return this.commandBus.execute<UpdateLibraryCommand, LibraryDto>(
      new UpdateLibraryCommand(id, patch),
    );
  }

  /** DELETE /api/v1/libraries/:id — admin only */
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  async removeLibrary(@Param('id') id: string): Promise<void> {
    await this.commandBus.execute(new RemoveLibraryCommand(id));
  }
}
