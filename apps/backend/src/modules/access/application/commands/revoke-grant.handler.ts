/**
 * WHY this file exists:
 * Command handler for revoking an existing AccessGrant. It delegates to the
 * repository port; if delete() returns false (no row found) it throws
 * GrantNotFoundError so the controller returns 404 without any HTTP logic here.
 */
import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { GRANT_REPOSITORY } from '../../domain/grant/grant.repository';
import { GrantNotFoundError } from '../../domain/grant/grant.errors';

import { RevokeGrantCommand } from './revoke-grant.command';

import type { GrantRepository } from '../../domain/grant/grant.repository';

@CommandHandler(RevokeGrantCommand)
export class RevokeGrantHandler implements ICommandHandler<RevokeGrantCommand, void> {
  constructor(@Inject(GRANT_REPOSITORY) private readonly repo: GrantRepository) {}

  async execute(command: RevokeGrantCommand): Promise<void> {
    const deleted = await this.repo.delete(command.id);

    if (!deleted) {
      throw new GrantNotFoundError(command.id);
    }
  }
}
