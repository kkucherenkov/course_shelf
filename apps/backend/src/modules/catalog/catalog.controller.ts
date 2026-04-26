/**
 * WHY this file exists:
 * HTTP entry point for the Catalog bounded context. Its only jobs are:
 *   1. Receive the request (body already validated by express-openapi-validator).
 *   2. Resolve the session via AuthService to extract actor (id + role).
 *   3. Dispatch a Command or Query via the CQRS bus.
 *   4. Return the result shaped as the OpenAPI-specified response.
 *
 * No business logic, no Prisma, no mapping beyond the command/query result.
 * The toLibraryDto helper is called only in query handlers; here the controller
 * receives already-shaped DTOs from the query bus.
 *
 * POST pattern: command returns { id }, controller issues GetLibraryQuery
 * to return the full resource. This keeps write and read models cleanly separated.
 *
 * Session pattern: the controller resolves the session once per request and
 * passes actor (id, role) down into the query. Unauthenticated callers receive
 * 401 here — domain errors from handlers are 403/404 and flow through the
 * HttpExceptionFilter as application/problem+json.
 */
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

import { AuthService } from '../../common/auth/auth.service';
import { RegisterLibraryCommand } from './application/commands/register-library.command';
import { GetLibraryQuery } from './application/queries/get-library.query';
import { ListLibrariesQuery } from './application/queries/list-libraries.query';

import type { Request } from 'express';
import type { LibraryDto, LibraryListDto, RegisterLibraryRequest } from '@app/api-client-ts';

@Controller({ path: 'libraries', version: '1' })
export class CatalogController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly auth: AuthService,
  ) {}

  /**
   * Resolves the session from the request. Throws UnauthorizedException (401)
   * when no session is present — this is the only HTTP exception allowed in a
   * controller; domain errors are thrown by handlers.
   */
  private async resolveActor(req: Request): Promise<{ id: string; role: string }> {
    const session = await this.auth.getSession(req);
    if (!session?.user) {
      throw new UnauthorizedException('Authentication required.');
    }
    const raw = (session.user as unknown as Record<string, unknown>)['role'];
    const role = typeof raw === 'string' ? raw : 'user';
    return { id: session.user.id, role };
  }

  /** GET /api/v1/libraries */
  @Get()
  async listLibraries(@Req() req: Request): Promise<LibraryListDto> {
    const actor = await this.resolveActor(req);
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
    @Req() req: Request,
  ): Promise<LibraryDto> {
    const actor = await this.resolveActor(req);
    const { id } = await this.commandBus.execute<RegisterLibraryCommand, { id: string }>(
      new RegisterLibraryCommand(body.name, body.rootPath),
    );
    return this.queryBus.execute<GetLibraryQuery, LibraryDto>(new GetLibraryQuery(id, actor));
  }

  /** GET /api/v1/libraries/:id */
  @Get(':id')
  async getLibrary(@Param('id') id: string, @Req() req: Request): Promise<LibraryDto> {
    const actor = await this.resolveActor(req);
    return this.queryBus.execute<GetLibraryQuery, LibraryDto>(new GetLibraryQuery(id, actor));
  }
}
