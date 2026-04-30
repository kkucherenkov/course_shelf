/**
 * WHY this file exists:
 * HTTP entry point for scan operations on a library. Kept separate from
 * CatalogController to avoid mixing library CRUD with the deeper-nested
 * /libraries/{id}/scans routes, which have their own access pattern (admin-only,
 * no per-user visibility filtering needed).
 *
 * Both endpoints are admin-only — AdminGuard handles authentication and role
 * enforcement before the handler runs.
 *
 * POST pattern: RunScanHandler returns the running Scan aggregate (persisted
 * before the fire-and-forget walk starts). The controller maps it directly to
 * ScanDto and returns 202 Accepted.
 */
import { Controller, Get, HttpCode, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

import { AdminGuard } from '../../common/auth/admin.guard';
import { Session } from '../../common/auth/decorators';
import { RunScanCommand } from './application/commands/run-scan.command';
import { GetLatestScanQuery } from './application/queries/get-latest-scan.query';
import { toScanDto } from './scans.dto';

import type { SessionContext } from '../../common/auth/decorators';
import type { Scan } from './domain/scan/scan';
import type { ScanDto } from '@app/api-client-ts';

@UseGuards(AdminGuard)
@Controller({ path: 'libraries/:id/scans', version: '1' })
export class ScansController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  /**
   * POST /api/v1/libraries/:id/scans
   * Accepts the scan request and returns 202 immediately with the running scan DTO.
   * The actual walk runs fire-and-forget after this response is sent.
   */
  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  async runLibraryScan(
    @Param('id') id: string,
    @Session() session: SessionContext,
  ): Promise<ScanDto> {
    const scan = await this.commandBus.execute<RunScanCommand, Scan>(
      new RunScanCommand(id, session.user.id),
    );
    return toScanDto(scan);
  }

  /**
   * GET /api/v1/libraries/:id/scans/latest
   * Returns the most recently started scan for the library, or 404 if none exists.
   */
  @Get('latest')
  async getLatestLibraryScan(@Param('id') id: string): Promise<ScanDto> {
    return this.queryBus.execute<GetLatestScanQuery, ScanDto>(new GetLatestScanQuery(id));
  }
}
