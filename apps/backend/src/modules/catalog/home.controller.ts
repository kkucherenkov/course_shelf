/**
 * WHY this file exists:
 * HTTP entry point for the /home/* routes. A dedicated controller is used
 * instead of extending CatalogController because the /home prefix is semantically
 * distinct from the library/course/lesson resource hierarchy. Keeping it separate
 * avoids coupling unrelated routes to the same controller class.
 *
 * Pattern:
 *   1. Resolve the session → actor (id + role).
 *   2. Parse + clamp query parameters.
 *   3. Dispatch a Query via the CQRS QueryBus.
 *   4. Return the result typed as the OpenAPI-specified response.
 *
 * No business logic, no Prisma, no mapping here.
 */
import { Controller, Get, Query, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';

import { SessionGuard } from '../../common/auth/auth.guard';
import { AuthService } from '../../common/auth/auth.service';
import { GetContinueWatchingQuery } from './application/queries/get-continue-watching.query';

import type { Request } from 'express';
import type { ContinueWatchingDto } from '@app/api-client-ts';

const CONTINUE_WATCHING_DEFAULT_LIMIT = 10;
const CONTINUE_WATCHING_MIN_LIMIT = 1;
const CONTINUE_WATCHING_MAX_LIMIT = 50;

@Controller({ path: 'home', version: '1' })
export class HomeController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly auth: AuthService,
  ) {}

  private async resolveActor(req: Request): Promise<{ id: string; role: string }> {
    const session = await this.auth.getSession(req);
    if (!session?.user) {
      throw new UnauthorizedException('Authentication required.');
    }
    const raw = (session.user as unknown as Record<string, unknown>)['role'];
    const role = typeof raw === 'string' ? raw : 'user';
    return { id: session.user.id, role };
  }

  /** GET /api/v1/home/continue-watching?limit= */
  @UseGuards(SessionGuard)
  @Get('continue-watching')
  async getContinueWatching(
    @Req() req: Request,
    @Query('limit') limitParam?: string,
  ): Promise<ContinueWatchingDto> {
    const actor = await this.resolveActor(req);
    const parsed = Number(limitParam ?? String(CONTINUE_WATCHING_DEFAULT_LIMIT));
    const limit = Math.min(
      Math.max(
        Number.isFinite(parsed) ? parsed : CONTINUE_WATCHING_DEFAULT_LIMIT,
        CONTINUE_WATCHING_MIN_LIMIT,
      ),
      CONTINUE_WATCHING_MAX_LIMIT,
    );

    return this.queryBus.execute<GetContinueWatchingQuery, ContinueWatchingDto>(
      new GetContinueWatchingQuery(actor, limit),
    );
  }
}
