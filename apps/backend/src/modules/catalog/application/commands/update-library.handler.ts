/**
 * WHY this file exists:
 * Command handler for the admin-only PATCH /libraries/{id} endpoint.
 * Guards against an empty patch (400) and a missing id (404) before
 * delegating the update to the repository adapter.
 *
 * No HTTP exceptions here — only domain errors.
 */
import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { LIBRARY_REPOSITORY } from '../../domain/library/library.repository';
import { LibraryNotFoundError, LibraryUpdateEmptyError } from '../../domain/library/library.errors';
import { toLibraryDto } from '../../catalog.dto';

import { UpdateLibraryCommand } from './update-library.command';

import type { LibraryRepository } from '../../domain/library/library.repository';
import type { LibraryDto } from '@app/api-client-ts';

@CommandHandler(UpdateLibraryCommand)
export class UpdateLibraryHandler implements ICommandHandler<UpdateLibraryCommand, LibraryDto> {
  constructor(@Inject(LIBRARY_REPOSITORY) private readonly repo: LibraryRepository) {}

  async execute(command: UpdateLibraryCommand): Promise<LibraryDto> {
    const { id, patch } = command;

    // WHY: An empty patch has no observable effect. Reject early so the caller
    // gets a meaningful 400 rather than a silent no-op.
    if (patch.name === undefined) {
      throw new LibraryUpdateEmptyError();
    }

    const updated = await this.repo.update(id, patch);

    if (!updated) {
      throw new LibraryNotFoundError(id);
    }

    return toLibraryDto(updated);
  }
}
