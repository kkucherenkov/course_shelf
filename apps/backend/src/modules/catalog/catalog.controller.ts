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
 */
import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

import { RegisterLibraryCommand } from './application/commands/register-library.command';
import { GetLibraryQuery } from './application/queries/get-library.query';
import { ListLibrariesQuery } from './application/queries/list-libraries.query';

import type { LibraryDto, LibraryListDto, RegisterLibraryRequest } from '@app/api-client-ts';

@Controller({ path: 'libraries', version: '1' })
export class CatalogController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  /** GET /api/v1/libraries */
  @Get()
  async listLibraries(): Promise<LibraryListDto> {
    const items = await this.queryBus.execute<ListLibrariesQuery, LibraryDto[]>(
      new ListLibrariesQuery(),
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
  async registerLibrary(@Body() body: RegisterLibraryRequest): Promise<LibraryDto> {
    const { id } = await this.commandBus.execute<RegisterLibraryCommand, { id: string }>(
      new RegisterLibraryCommand(body.name, body.rootPath),
    );
    return this.queryBus.execute<GetLibraryQuery, LibraryDto>(new GetLibraryQuery(id));
  }

  /** GET /api/v1/libraries/:id */
  @Get(':id')
  async getLibrary(@Param('id') id: string): Promise<LibraryDto> {
    return this.queryBus.execute<GetLibraryQuery, LibraryDto>(new GetLibraryQuery(id));
  }
}
