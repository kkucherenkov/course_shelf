/**
 * Bridge service for the catalog write path.
 *
 * The boundaries lint rule forbids `src/modules/catalog` from directly
 * importing `src/modules/access` (each bounded context owns its public
 * surface). This service lives in `src/common/access` — the shared
 * kernel — and exposes the one cross-context operation catalog needs:
 * "grant the user READ on a library they just registered".
 *
 * Internally it dispatches `RegisterGrantCommand` via the CQRS bus.
 * The handler in the access module picks it up. Re-issuing the same
 * grant (same `(userId, target)` pair) is silently a no-op — duplicate
 * grants raise `GrantAlreadyExistsError`, which is swallowed here so
 * idempotent registration paths don't have to.
 */
import { Injectable } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';

import { RegisterGrantCommand } from '../../modules/access/application/commands/register-grant.command';
import { GrantAlreadyExistsError } from '../../modules/access/domain/grant/grant.errors';

@Injectable()
export class LibraryGrantService {
  constructor(private readonly commandBus: CommandBus) {}

  /**
   * Grant the user READ access to the given library. Idempotent — when
   * the grant already exists the call is a no-op (no exception).
   */
  async grantRead(userId: string, libraryId: string): Promise<void> {
    try {
      await this.commandBus.execute<RegisterGrantCommand, { id: string }>(
        new RegisterGrantCommand(userId, { kind: 'library', libraryId }, 'READ'),
      );
    } catch (error) {
      if (!(error instanceof GrantAlreadyExistsError)) throw error;
    }
  }
}
