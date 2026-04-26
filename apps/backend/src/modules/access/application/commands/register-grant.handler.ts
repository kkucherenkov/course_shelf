/**
 * WHY this file exists:
 * Command handler for registering a new AccessGrant. It:
 *   1. Generates a server-side id using nanoid (matches cuid character set / entropy).
 *   2. Delegates invariant enforcement to AccessGrant.register().
 *   3. Persists via the port — the infra adapter translates P2002 → GrantAlreadyExistsError.
 *   4. Invalidates any cached authorization decisions for the affected user so the
 *      next canSee() call reflects the new grant immediately.
 *   5. Returns { id } per CQRS convention.
 *
 * No NestJS HTTP exceptions here — boundaries/element-types enforces this at lint time.
 *
 * Cache invalidation: direct call to AuthorizationService.invalidate() rather than
 * emitting a domain event. This is deliberately synchronous — a cache flush is an
 * infrastructure concern, not a domain event, and an EventBus subscriber would add
 * indirection without meaningful decoupling at this scale.
 */
import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { nanoid } from 'nanoid';

import { AUTHORIZATION_SERVICE } from '../../../../common/access/authorization.service';
import { AccessGrant } from '../../domain/grant/grant';
import { GRANT_REPOSITORY } from '../../domain/grant/grant.repository';

import { RegisterGrantCommand } from './register-grant.command';

import type { AuthorizationService } from '../../../../common/access/authorization.service';
import type { GrantRepository } from '../../domain/grant/grant.repository';

@CommandHandler(RegisterGrantCommand)
export class RegisterGrantHandler implements ICommandHandler<RegisterGrantCommand, { id: string }> {
  constructor(
    @Inject(GRANT_REPOSITORY) private readonly repo: GrantRepository,
    @Inject(AUTHORIZATION_SERVICE) private readonly authz: AuthorizationService,
  ) {}

  async execute(command: RegisterGrantCommand): Promise<{ id: string }> {
    const grant = AccessGrant.register({
      id: nanoid(),
      userId: command.userId,
      target: command.target,
      level: command.level,
    });

    await this.repo.save(grant);

    // Evict cached decisions so the next canSee() reflects the new grant.
    this.authz.invalidate(grant.userId);

    return { id: grant.id };
  }
}
