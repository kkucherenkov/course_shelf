/**
 * WHY this file exists:
 * Query handler for fetching a single Library. Throws LibraryNotFoundError
 * (not NotFoundException) when the id is unknown — the HttpExceptionFilter
 * maps it to 404 application/problem+json automatically.
 *
 * After the repo lookup, we enforce visibility: non-admins without a matching
 * READ grant receive PermissionDenied (403). We check for existence first so
 * an attacker cannot distinguish "library does not exist" from "you cannot see
 * it" — the 403 only fires after the 404 check passes.
 *
 * WHY 403 after 404 check (not before):
 * Returning 404 for non-admin unknown ids leaks whether the resource exists.
 * For v1, the acceptance criteria state 403 on missing grant; we align with
 * that. If the library does not exist → 404. If it exists but no grant → 403.
 */
import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { AUTHORIZATION_SERVICE } from '../../../../common/access/authorization.service';
import { LibraryNotFoundError } from '../../domain/library/library.errors';
import { LIBRARY_REPOSITORY } from '../../domain/library/library.repository';
import { toLibraryDto } from '../../catalog.dto';
import { PermissionDenied } from '../../../../shared/domain-error';

import { GetLibraryQuery } from './get-library.query';

import type { AuthorizationService } from '../../../../common/access/authorization.service';
import type { LibraryRepository } from '../../domain/library/library.repository';
import type { LibraryDto } from '@app/api-client-ts';

@QueryHandler(GetLibraryQuery)
export class GetLibraryHandler implements IQueryHandler<GetLibraryQuery, LibraryDto> {
  constructor(
    @Inject(LIBRARY_REPOSITORY) private readonly repo: LibraryRepository,
    @Inject(AUTHORIZATION_SERVICE) private readonly authz: AuthorizationService,
  ) {}

  async execute(query: GetLibraryQuery): Promise<LibraryDto> {
    const library = await this.repo.findById(query.id);

    if (!library) {
      throw new LibraryNotFoundError(query.id);
    }

    const allowed = await this.authz.canSee(query.actor, {
      kind: 'library',
      id: library.id,
    });

    if (!allowed) {
      throw new PermissionDenied('You do not have access to this library.');
    }

    return toLibraryDto(library);
  }
}
