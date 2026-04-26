/**
 * WHY this file exists:
 * Command handler for registering a new Library. It:
 *   1. Generates a server-side id using nanoid (matches cuid character set / entropy).
 *   2. Delegates invariant enforcement to Library.register().
 *   3. Persists via the port — the infra adapter translates P2002 → LibraryAlreadyExistsError.
 *   4. Returns only { id } per CQRS convention; the controller issues GetLibraryQuery
 *      separately if the full resource is needed for the HTTP response.
 *
 * No NestJS HTTP exceptions here — boundaries/element-types enforces this at lint time.
 */
import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { nanoid } from 'nanoid';

import { Library } from '../../domain/library/library';
import { LIBRARY_REPOSITORY } from '../../domain/library/library.repository';

import { RegisterLibraryCommand } from './register-library.command';

import type { LibraryRepository } from '../../domain/library/library.repository';

@CommandHandler(RegisterLibraryCommand)
export class RegisterLibraryHandler implements ICommandHandler<
  RegisterLibraryCommand,
  { id: string }
> {
  constructor(@Inject(LIBRARY_REPOSITORY) private readonly repo: LibraryRepository) {}

  async execute(command: RegisterLibraryCommand): Promise<{ id: string }> {
    const library = Library.register({
      id: nanoid(),
      name: command.name,
      rootPath: command.rootPath,
    });

    await this.repo.save(library);

    return { id: library.id };
  }
}
