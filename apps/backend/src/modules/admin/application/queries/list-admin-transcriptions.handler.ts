import { Inject, Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { DASHBOARD_PORT } from '../../domain/dashboard.port';
import { ListAdminTranscriptionsQuery } from './list-admin-transcriptions.query';

import type { DashboardPort } from '../../domain/dashboard.port';
import type { AdminTranscriptionListDto } from '@app/api-client-ts';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const MIN_LIMIT = 1;

@Injectable()
@QueryHandler(ListAdminTranscriptionsQuery)
export class ListAdminTranscriptionsHandler implements IQueryHandler<
  ListAdminTranscriptionsQuery,
  AdminTranscriptionListDto
> {
  constructor(@Inject(DASHBOARD_PORT) private readonly dashboard: DashboardPort) {}

  async execute(query: ListAdminTranscriptionsQuery): Promise<AdminTranscriptionListDto> {
    const rawLimit = query.limit;
    const limit =
      rawLimit === undefined || !Number.isFinite(rawLimit)
        ? DEFAULT_LIMIT
        : Math.min(Math.max(rawLimit, MIN_LIMIT), MAX_LIMIT);

    const items = await this.dashboard.listRecentTranscriptions(limit, query.libraryId);

    return { items };
  }
}
