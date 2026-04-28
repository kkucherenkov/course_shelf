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
import { GetRecentlyAddedQuery } from './application/queries/get-recently-added.query';
import { GetRecentlyCompletedQuery } from './application/queries/get-recently-completed.query';
import { GetYourWeekQuery } from './application/queries/get-your-week.query';

import type { SessionContext } from '../../common/auth/decorators';
import type {
  ContinueWatchingDto,
  RecentlyAddedDto,
  RecentlyCompletedDto,
  YourWeekDto,
} from '@app/api-client-ts';

const DEFAULT_LIMIT = 10;
const MIN_LIMIT = 1;
const MAX_LIMIT = 50;

/** Parse the ?limit= query param and clamp to [MIN_LIMIT, MAX_LIMIT]. */
function parseLimit(limitParam: string | undefined): number {
  const parsed = Number(limitParam ?? String(DEFAULT_LIMIT));
  return Math.min(
    Math.max(Number.isFinite(parsed) ? parsed : DEFAULT_LIMIT, MIN_LIMIT),
    MAX_LIMIT,
  );
}

@Controller({ path: 'home', version: '1' })
export class HomeController {
  constructor(private readonly queryBus: QueryBus) {}

  /** GET /api/v1/home/continue-watching?limit= */
  @Get('continue-watching')
  async getContinueWatching(
    @Session() session: SessionContext,
    @Query('limit') limitParam?: string,
  ): Promise<ContinueWatchingDto> {
    return this.queryBus.execute<GetContinueWatchingQuery, ContinueWatchingDto>(
      new GetContinueWatchingQuery(session.user, parseLimit(limitParam)),
    );
  }

  /** GET /api/v1/home/recently-added?limit= */
  @Get('recently-added')
  async getRecentlyAdded(
    @Session() session: SessionContext,
    @Query('limit') limitParam?: string,
  ): Promise<RecentlyAddedDto> {
    return this.queryBus.execute<GetRecentlyAddedQuery, RecentlyAddedDto>(
      new GetRecentlyAddedQuery(session.user, parseLimit(limitParam)),
    );
  }

  /** GET /api/v1/home/recently-completed?limit= */
  @Get('recently-completed')
  async getRecentlyCompleted(
    @Session() session: SessionContext,
    @Query('limit') limitParam?: string,
  ): Promise<RecentlyCompletedDto> {
    return this.queryBus.execute<GetRecentlyCompletedQuery, RecentlyCompletedDto>(
      new GetRecentlyCompletedQuery(session.user, parseLimit(limitParam)),
    );
  }

  /** GET /api/v1/home/your-week */
  @Get('your-week')
  async getYourWeek(@Session() session: SessionContext): Promise<YourWeekDto> {
    return this.queryBus.execute<GetYourWeekQuery, YourWeekDto>(
      new GetYourWeekQuery(session.user),
    );
  }
}
