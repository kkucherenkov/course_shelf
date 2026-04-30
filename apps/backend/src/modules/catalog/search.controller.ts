/**
 * WHY this file exists:
 * HTTP entry point for GET /api/v1/search. Follows the same controller pattern
 * as CoursesController: extract actor from @Session(), dispatch a query via
 * QueryBus, return the typed result.
 *
 * Limit parsing: the spec declares `limit` as an optional integer query param
 * (default 20, max 100). express-openapi-validator passes it as a string when
 * present, so we parse defensively and clamp to [1, 100].
 *
 * No business logic, no Prisma, no mapping here.
 */
import { Controller, Get, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';

import { Session } from '../../common/auth/decorators/session.decorator';
import { SearchCatalogueQuery } from './application/queries/search-catalogue.query';

import type { SessionContext } from '../../common/auth/decorators/session.decorator';
import type { SearchResultDto } from '@app/api-client-ts';

const DEFAULT_LIMIT = 20;
const MIN_LIMIT = 1;
const MAX_LIMIT = 100;

function parseLimit(raw: string | undefined): number {
  if (raw === undefined) return DEFAULT_LIMIT;
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed)) return DEFAULT_LIMIT;
  return Math.min(Math.max(parsed, MIN_LIMIT), MAX_LIMIT);
}

@Controller({ path: 'search', version: '1' })
export class SearchController {
  constructor(private readonly queryBus: QueryBus) {}

  /** GET /api/v1/search?q=…&limit=… */
  @Get()
  async searchCatalogue(
    @Session() session: SessionContext,
    @Query('q') q = '',
    @Query('limit') rawLimit?: string,
  ): Promise<SearchResultDto> {
    const actor = session.user;
    const limit = parseLimit(rawLimit);

    return this.queryBus.execute<SearchCatalogueQuery, SearchResultDto>(
      new SearchCatalogueQuery(q, limit, actor),
    );
  }
}
