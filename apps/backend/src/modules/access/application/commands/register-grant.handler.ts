/**
 * WHY this file exists:
 * Command handler for registering a new AccessGrant. It:
 *   1. Generates a server-side id using nanoid (matches cuid character set / entropy).
 *   2. Delegates invariant enforcement to AccessGrant.register().
 *   3. Persists via the port — the infra adapter translates P2002 → GrantAlreadyExistsError.
 *   4. Returns { id } per CQRS convention.
 *
 * No NestJS HTTP exceptions here — boundaries/element-types enforces this at lint time.
 */
import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { nanoid } from 'nanoid';

import { AccessGrant } from '../../domain/grant/grant';
import { GRANT_REPOSITORY } from '../../domain/grant/grant.repository';

import { RegisterGrantCommand } from './register-grant.command';

import type { GrantRepository } from '../../domain/grant/grant.repository';

@CommandHandler(RegisterGrantCommand)
export class RegisterGrantHandler implements ICommandHandler<RegisterGrantCommand, { id: string }> {
  constructor(@Inject(GRANT_REPOSITORY) private readonly repo: GrantRepository) {}

  async execute(command: RegisterGrantCommand): Promise<{ id: string }> {
    const grant = AccessGrant.register({
      id: nanoid(),
      userId: command.userId,
      target: command.target,
      level: command.level,
    });

    await this.repo.save(grant);

    return { id: grant.id };
  }
}
