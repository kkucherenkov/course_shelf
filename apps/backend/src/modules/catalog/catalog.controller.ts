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

import { LibraryGrantService } from '../../common/access/library-grant.service';
import { AdminGuard } from '../../common/auth/admin.guard';
import { Session } from '../../common/auth/decorators';
import { RunScanCommand } from './application/commands/run-scan.command';
import { RegisterLibraryCommand } from './application/commands/register-library.command';
import type { RegisterLibraryResult } from './application/commands/register-library.handler';
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
    private readonly libraryGrants: LibraryGrantService,
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
   *
   * Idempotent on `rootPath`. The handler upserts the library; the
   * controller then chains:
   *   1. A READ AccessGrant on the library for the calling user — so a
   *      non-admin who registered the library actually sees it via
   *      `listLibraries` (admins bypass the grant filter so the grant is
   *      redundant for them but harmless).
   *   2. An initial `RunScan` for fresh libraries — by the time the
   *      response is back the scan is already in `running` state. For
   *      already-existing libraries we don't re-trigger a scan; the
   *      admin can do that explicitly from /admin/libraries/<id>.
   *
   * `GrantAlreadyExistsError` is silently swallowed: when the same user
   * registers the same path twice (or a different user races a duplicate
   * registration), the grant unique constraint trips and we don't want
   * that to surface as a 409 to the SPA.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async registerLibrary(
    @Body() body: RegisterLibraryRequest,
    @Session() session: SessionContext,
  ): Promise<LibraryDto> {
    const actor = session.user;
    const { id, alreadyExisted } = await this.commandBus.execute<
      RegisterLibraryCommand,
      RegisterLibraryResult
    >(new RegisterLibraryCommand(body.name, body.rootPath));

    // Auto-grant READ to the registrant so non-admins see the library on
    // their list. Idempotent — bridge service swallows GrantAlreadyExistsError.
    await this.libraryGrants.grantRead(actor.id, id);

    if (!alreadyExisted) {
      // Fresh library — kick off the first scan so the user sees courses
      // shortly after the redirect. The handler returns once the scan
      // record is persisted as `running`; the file walk continues fire-
      // and-forget after the response.
      await this.commandBus.execute<RunScanCommand, unknown>(new RunScanCommand(id));
    }

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
