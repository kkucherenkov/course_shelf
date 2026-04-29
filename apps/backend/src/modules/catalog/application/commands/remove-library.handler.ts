/**
 * WHY this file exists:
 * Command handler for the admin-only DELETE /libraries/{id} endpoint.
 * Delegates the full cascade teardown to the repository adapter, which keeps
 * all deletion logic co-located with the data-access layer.
 *
 * No HTTP exceptions here — only domain errors.
 */
import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { LIBRARY_REPOSITORY } from '../../domain/library/library.repository';
import { LibraryNotFoundError } from '../../domain/library/library.errors';

import { RemoveLibraryCommand } from './remove-library.command';

import type { LibraryRepository } from '../../domain/library/library.repository';

@CommandHandler(RemoveLibraryCommand)
export class RemoveLibraryHandler implements ICommandHandler<RemoveLibraryCommand, void> {
  constructor(@Inject(LIBRARY_REPOSITORY) private readonly repo: LibraryRepository) {}

  async execute(command: RemoveLibraryCommand): Promise<void> {
    const deleted = await this.repo.removeWithCascade(command.id);

    if (!deleted) {
      throw new LibraryNotFoundError(command.id);
    }
  }
}
