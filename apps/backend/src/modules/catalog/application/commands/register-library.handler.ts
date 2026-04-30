/**
 * WHY this file exists:
 * Command handler for registering a Library — idempotent on rootPath.
 *
 *   1. Look up an existing library by rootPath. If one exists, return its
 *      id with `alreadyExisted: true` — this lets multiple users "register"
 *      the same physical path on disk (a self-hosted single-tenant app
 *      with a couple of co-admins doesn't want a 409 just because two
 *      people pointed at the same folder; the controller chains a grant
 *      so the second registrant actually sees the library on their list).
 *   2. Otherwise: generate a server-side id, run domain invariants via
 *      Library.register(), persist via the port, return `{ id, alreadyExisted: false }`.
 *
 * No NestJS HTTP exceptions here — boundaries/element-types enforces that
 * at lint time. The Prisma adapter still translates P2002 → 409, but the
 * find-first short-circuit means we should never reach that path under
 * normal use; it remains as a defensive guard against races.
 */
import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { nanoid } from 'nanoid';

import { Library } from '../../domain/library/library';
import { LIBRARY_REPOSITORY } from '../../domain/library/library.repository';

import { RegisterLibraryCommand } from './register-library.command';

import type { LibraryRepository } from '../../domain/library/library.repository';

export interface RegisterLibraryResult {
  id: string;
  alreadyExisted: boolean;
}

@CommandHandler(RegisterLibraryCommand)
export class RegisterLibraryHandler implements ICommandHandler<
  RegisterLibraryCommand,
  RegisterLibraryResult
> {
  constructor(@Inject(LIBRARY_REPOSITORY) private readonly repo: LibraryRepository) {}

  async execute(command: RegisterLibraryCommand): Promise<RegisterLibraryResult> {
    const existing = await this.repo.findByRootPath(command.rootPath);
    if (existing) {
      return { id: existing.id, alreadyExisted: true };
    }

    const library = Library.register({
      id: nanoid(),
      name: command.name,
      rootPath: command.rootPath,
    });

    await this.repo.save(library);

    return { id: library.id, alreadyExisted: false };
  }
}
