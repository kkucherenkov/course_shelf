/**
 * WHY this file exists:
 * Query handler for fetching a single AccessGrant. Throws GrantNotFoundError
 * (not NotFoundException) when the id is unknown — the HttpExceptionFilter
 * maps it to 404 application/problem+json automatically.
 */
import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { GRANT_REPOSITORY } from '../../domain/grant/grant.repository';
import { GrantNotFoundError } from '../../domain/grant/grant.errors';
import { toAccessGrantDto } from '../../access.dto';

import { GetGrantQuery } from './get-grant.query';

import type { GrantRepository } from '../../domain/grant/grant.repository';
import type { AccessGrantDto } from '@app/api-client-ts';

@QueryHandler(GetGrantQuery)
export class GetGrantHandler implements IQueryHandler<GetGrantQuery, AccessGrantDto> {
  constructor(@Inject(GRANT_REPOSITORY) private readonly repo: GrantRepository) {}

  async execute(query: GetGrantQuery): Promise<AccessGrantDto> {
    const grant = await this.repo.findById(query.id);

    if (!grant) {
      throw new GrantNotFoundError(query.id);
    }

    return toAccessGrantDto(grant);
  }
}
