/**
 * WHY this file exists:
 * Query handler for listing all grants belonging to a given user. Returns
 * AccessGrantDto[] directly so the controller needs no mapping logic.
 */
import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { GRANT_REPOSITORY } from '../../domain/grant/grant.repository';
import { toAccessGrantDto } from '../../access.dto';

import { ListUserGrantsQuery } from './list-user-grants.query';

import type { GrantRepository } from '../../domain/grant/grant.repository';
import type { AccessGrantDto } from '@app/api-client-ts';

@QueryHandler(ListUserGrantsQuery)
export class ListUserGrantsHandler implements IQueryHandler<ListUserGrantsQuery, AccessGrantDto[]> {
  constructor(@Inject(GRANT_REPOSITORY) private readonly repo: GrantRepository) {}

  async execute(query: ListUserGrantsQuery): Promise<AccessGrantDto[]> {
    const grants = await this.repo.findManyByUser(query.userId);
    return grants.map((grant) => toAccessGrantDto(grant));
  }
}
