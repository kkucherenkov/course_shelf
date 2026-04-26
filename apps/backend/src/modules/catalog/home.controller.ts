/**
 * WHY this file exists:
 * HTTP entry point for the /home/* routes. A dedicated controller is used
 * instead of extending CatalogController because the /home prefix is semantically
 * distinct from the library/course/lesson resource hierarchy. Keeping it separate
 * avoids coupling unrelated routes to the same controller class.
 *
 * Pattern:
 *   1. Extract the actor from @Session() — resolved by the global SessionGuard.
 *   2. Parse + clamp query parameters.
 *   3. Dispatch a Query via the CQRS QueryBus.
 *   4. Return the result typed as the OpenAPI-specified response.
 *
 * No business logic, no Prisma, no mapping here.
 */
import { Controller, Get, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';

import { Session } from '../../common/auth/decorators';
import { GetContinueWatchingQuery } from './application/queries/get-continue-watching.query';

import type { SessionContext } from '../../common/auth/decorators';
import type { ContinueWatchingDto } from '@app/api-client-ts';

const CONTINUE_WATCHING_DEFAULT_LIMIT = 10;
const CONTINUE_WATCHING_MIN_LIMIT = 1;
const CONTINUE_WATCHING_MAX_LIMIT = 50;

@Controller({ path: 'home', version: '1' })
export class HomeController {
  constructor(private readonly queryBus: QueryBus) {}

  /** GET /api/v1/home/continue-watching?limit= */
  @Get('continue-watching')
  async getContinueWatching(
    @Session() session: SessionContext,
    @Query('limit') limitParam?: string,
  ): Promise<ContinueWatchingDto> {
    const actor = session.user;
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
