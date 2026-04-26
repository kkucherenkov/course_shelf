/**
 * WHY this file exists:
 * Command handler for revoking an existing AccessGrant. It delegates to the
 * repository port; if delete() returns false (no row found) it throws
 * GrantNotFoundError so the controller returns 404 without any HTTP logic here.
 *
 * Cache invalidation: after a successful delete, calls AuthorizationService.invalidate()
 * so the next canSee() for that user re-evaluates against the new grant set.
 * We must find the grant first to know the userId, so findById is called before delete.
 */
import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { AUTHORIZATION_SERVICE } from '../../../../common/access/authorization.service';
import { GRANT_REPOSITORY } from '../../domain/grant/grant.repository';
import { GrantNotFoundError } from '../../domain/grant/grant.errors';

import { RevokeGrantCommand } from './revoke-grant.command';

import type { AuthorizationService } from '../../../../common/access/authorization.service';
import type { GrantRepository } from '../../domain/grant/grant.repository';

@CommandHandler(RevokeGrantCommand)
export class RevokeGrantHandler implements ICommandHandler<RevokeGrantCommand, void> {
  constructor(
    @Inject(GRANT_REPOSITORY) private readonly repo: GrantRepository,
    @Inject(AUTHORIZATION_SERVICE) private readonly authz: AuthorizationService,
  ) {}

  async execute(command: RevokeGrantCommand): Promise<void> {
    // Fetch before delete so we have the userId for cache invalidation.
    const grant = await this.repo.findById(command.id);

    if (!grant) {
      throw new GrantNotFoundError(command.id);
    }

    const deleted = await this.repo.delete(command.id);

    if (!deleted) {
      // Guard against a concurrent delete between findById and delete.
      throw new GrantNotFoundError(command.id);
    }

    // Evict cached decisions so the next canSee() reflects the revoked grant.
    this.authz.invalidate(grant.userId);
  }
}
