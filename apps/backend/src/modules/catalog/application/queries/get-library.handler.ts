/**
 * WHY this file exists:
 * Query handler for fetching a single Library. Throws LibraryNotFoundError
 * (not NotFoundException) when the id is unknown — the HttpExceptionFilter
 * maps it to 404 application/problem+json automatically.
 */
import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { LibraryNotFoundError } from '../../domain/library/library.errors';
import { LIBRARY_REPOSITORY } from '../../domain/library/library.repository';
import { toLibraryDto } from '../../catalog.dto';

import { GetLibraryQuery } from './get-library.query';

import type { LibraryRepository } from '../../domain/library/library.repository';
import type { LibraryDto } from '@app/api-client-ts';

@QueryHandler(GetLibraryQuery)
export class GetLibraryHandler implements IQueryHandler<GetLibraryQuery, LibraryDto> {
  constructor(@Inject(LIBRARY_REPOSITORY) private readonly repo: LibraryRepository) {}

  async execute(query: GetLibraryQuery): Promise<LibraryDto> {
    const library = await this.repo.findById(query.id);

    if (!library) {
      throw new LibraryNotFoundError(query.id);
    }

    return toLibraryDto(library);
  }
}
