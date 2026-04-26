/**
 * WHY this file exists:
 * Query handler for listing all libraries. Returns LibraryDto[] filtered by
 * what the caller is allowed to see:
 *   - Admins: full list (AuthorizationService short-circuits to true).
 *   - Non-admins: only libraries with a matching READ grant.
 *
 * The visibility check is batched via Promise.all so we fire all canSee()
 * calls concurrently — each hits the in-process LRU cache after the first
 * call, so the network round-trip is amortised.
 */
import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { AUTHORIZATION_SERVICE } from '../../../../common/access/authorization.service';
import { LIBRARY_REPOSITORY } from '../../domain/library/library.repository';
import { toLibraryDto } from '../../catalog.dto';

import { ListLibrariesQuery } from './list-libraries.query';

import type { AuthorizationService } from '../../../../common/access/authorization.service';
import type { LibraryRepository } from '../../domain/library/library.repository';
import type { LibraryDto } from '@app/api-client-ts';

@QueryHandler(ListLibrariesQuery)
export class ListLibrariesHandler implements IQueryHandler<ListLibrariesQuery, LibraryDto[]> {
  constructor(
    @Inject(LIBRARY_REPOSITORY) private readonly repo: LibraryRepository,
    @Inject(AUTHORIZATION_SERVICE) private readonly authz: AuthorizationService,
  ) {}

  async execute(query: ListLibrariesQuery): Promise<LibraryDto[]> {
    const libraries = await this.repo.findAll();

    const visible = await Promise.all(
      libraries.map((lib) => this.authz.canSee(query.actor, { kind: 'library', id: lib.id })),
    );

    return libraries.filter((_, i) => visible[i]).map((lib) => toLibraryDto(lib));
  }
}
