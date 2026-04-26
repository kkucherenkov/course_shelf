/**
 * WHY this file exists:
 * Query handler for listing all libraries. Returns LibraryDto[] directly so
 * the controller needs no mapping logic. The toDto helper lives in the
 * controller layer, not here — handlers return typed read models only.
 */
import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { LIBRARY_REPOSITORY } from '../../domain/library/library.repository';
import { toLibraryDto } from '../../catalog.dto';

import { ListLibrariesQuery } from './list-libraries.query';

import type { LibraryRepository } from '../../domain/library/library.repository';
import type { LibraryDto } from '@app/api-client-ts';

@QueryHandler(ListLibrariesQuery)
export class ListLibrariesHandler implements IQueryHandler<ListLibrariesQuery, LibraryDto[]> {
  constructor(@Inject(LIBRARY_REPOSITORY) private readonly repo: LibraryRepository) {}

  async execute(_query: ListLibrariesQuery): Promise<LibraryDto[]> {
    const libraries = await this.repo.findAll();
    return libraries.map((lib) => toLibraryDto(lib));
  }
}
